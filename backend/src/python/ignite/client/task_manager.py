# Copyright 2022 George Savvas

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


import asyncio
import importlib
import threading
from pathlib import PurePath
from uuid import uuid4

from tinydb import Query, TinyDB

from ..utils import get_logger

LOGGER = get_logger(__name__)


def start_worker(loop):
    LOGGER.warning("WORKER INIT")
    asyncio.set_event_loop(loop)
    loop.run_forever()
    LOGGER.warning("WORKER END")


class Task():
    def __init__(self, action, entity, task_id, processes_manager, on_finish, session_id, **kwargs):
        self.action = action
        self.entity = entity
        self.id = task_id
        self.session_id = session_id
        self.processes_manager = processes_manager
        self.state = {"paused": False, "killed": False, "active": "waiting"}
        self.on_finish = on_finish
        self.progress = 0

    async def run(self):
        async def progress_fn(progress=-1, state=""):
            ws = self.processes_manager.get(self.session_id)
            if not ws and self.processes_manager.connections:
                ws, ws_id = self.processes_manager.connections[0]
                LOGGER.error(f"Websocket was not found for {self} {self.session_id} but ended up using {ws_id}")
            elif not ws:
                LOGGER.error(f"Websocket was not found for {self} {self.session_id}")
                return
            data = {
                "id": self.id,
                "name": self.action["label"],
                "entity": self.entity
            }
            if progress >= 0:
                data["progress"] = progress
                self.progress = progress
            if state:
                data["state"] = state
                self.state["active"] = state
            elif progress >= 0:
                data["state"] = "running" if progress < 100 else "finished"
                self.state["active"] = state
            await ws.send_json({"data": data})
        module_path = PurePath(self.action["module_path"])
        module = importlib.machinery.SourceFileLoader(
            module_path.name, str(module_path)
        ).load_module()
        result = await module.main(entity=self.entity, progress_fn=progress_fn, state=self.state)
        self.on_finish(self.id, result)
        return result
    
    def as_dict(self):
        return {
            "action": self.action,
            "entity": self.entity,
            "task_id": self.id,
            "session_id": self.session_id
        }

    def pause(self):
        self.state["paused"] = True
    
    def unpause(self):
        self.state["paused"] = False
    
    def kill(self):
        self.state["killed"] = True


class TaskManager():
    def __init__(self, processes_manager, db_path):
        self.db = TinyDB(db_path)
        self.tasks = []
        self.processes_manager = processes_manager

    def start(self):
        self.loop = asyncio.new_event_loop()
        self.thread = threading.Thread(
            target=start_worker, args=(self.loop,), daemon=True
        )
        self.thread.start()

    def create_task(self, action, entity, session_id, task_id=None):
        task_id = task_id or str(uuid4())
        task = Task(
            action=action,
            entity=entity,
            task_id=task_id,
            session_id=session_id,
            processes_manager=self.processes_manager,
            on_finish=self.handle_task_finished
        )
        self.run_task(task)
    
    def run_task(self, task):
        asyncio.create_task(self.send(task))
        future = asyncio.run_coroutine_threadsafe(task.run(), self.loop)
        self.remove(Query().task.id)
        self.db.insert(task.as_dict())
        self.tasks.append({
            "id": task.id,
            "task": task,
            "future": future,
        })

    def remove(self, task_id):
        for i, task_data in enumerate(self.tasks):
            if task_data["id"] == task_id:
                self.tasks.pop(i)
                break
        self.db.remove(Query().task_id == task_id)
    
    def restore_tasks(self):
        for kwargs in self.db:
            LOGGER.warning(f"Restoring task from db {kwargs['task_id']}")
            self.create_task(
                action=kwargs["action"],
                entity=kwargs["entity"],
                task_id=kwargs["task_id"],
                session_id=kwargs["session_id"]
            )

    def tasks(self):
        return self.tasks
    
    def amount(self):
        return len(self.tasks)
    
    def handle_task_finished(self, task_id, result):
        task = self.get_task(task_id)
        asyncio.create_task(self.send(task, state="finished" if not task.state["killed"] else "error"))
        print(f"Removing {task_id} from db...")
        self.db.remove(Query().task_id == task_id)
        print("Done.")
    
    def get_task(self, task_id):
        for task_data in self.tasks:
            if task_data["id"] == task_id:
                return task_data["task"]
    
    def report(self, session_id=""):
        data = []
        for task_data in self.tasks:
            task = task_data["task"]
            if session_id and session_id != task.session_id:
                continue
            data.append({
                "state": task.state["active"],
                "progress": task.progress,
                "name": task.action["label"],
                "entity": task.entity,
                "id": task.id
            })
        return data

    def get_future(self, task_id):
        for task_data in self.tasks:
            if task_data["id"] == task_id:
                return task_data["future"]
    
    def pause(self, task_id):
        task = self.get_task(task_id)
        print(f"Pausing {task}")
        if task:
            task.pause()
    
    def unpause(self, task_id):
        task = self.get_task(task_id)
        print(f"Unpausing {task}")
        if task:
            task.unpause()
    
    def retry(self, task_id):
        task = self.get_task(task_id)
        print(f"Retrying {task}")
        if task:
            self.run_task(task)
    
    def kill(self, task_id):
        task = self.get_task(task_id)
        print(f"Killing {task}")
        if task:
            task.kill()
    
    def clear(self, task_id):
        for i, task_data in enumerate(self.tasks):
            if task_data["id"] == task_id:
                print(f"Clearing {task_data['task']}")
                self.db.remove(Query().task_id == task_id)
                self.tasks.pop(i)
                break
        else:
            print(f"Couldn't find task to clear with {task_id}")

    async def send(self, task, progress=-1, state=""):
        ws = self.processes_manager.get(task.session_id)
        if not ws and self.processes_manager.connections:
            ws, ws_id = self.processes_manager.connections[0]
            LOGGER.error(f"Websocket was not found for {task} {task.session_id} but ended up using {ws_id}")
        elif not ws:
            LOGGER.error(f"Websocket was not found for {task} {task.session_id}")
            return
        data = {
            "name": task.action["label"],
            "entity": task.entity,
            "id": task.id
        }
        if progress >= 0:
            data["progress"] = progress
        if state:
            data["state"] = state
        await ws.send_json({"data": data})
