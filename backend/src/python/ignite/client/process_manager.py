# Copyright 2022 Georgios Savvas

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


import os
import asyncio
import importlib
import threading
from pathlib import PurePath
from uuid import uuid4

from tinydb import Query, TinyDB

from ignite.logger import get_logger

LOGGER = get_logger(__name__)


def start_worker(loop):
    from ignite.client.utils import get_generic_env
    PID = str(os.getpid())
    LOGGER.warning(f"WORKER INIT - PID {PID}")
    env = os.environ
    ignite_env = get_generic_env()
    from pprint import pprint
    for k, v in ignite_env.items():
        env[k] = v
    asyncio.set_event_loop(loop)
    loop.run_forever()
    LOGGER.warning("WORKER END")


class Process():
    def __init__(self, action, entity, process_id, processes_manager, on_finish, session_id, **kwargs):
        self.action = action
        self.entity = entity
        self.id = process_id
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
            "process_id": self.id,
            "session_id": self.session_id
        }

    def pause(self):
        self.state["paused"] = True
    
    def unpause(self):
        self.state["paused"] = False
    
    def kill(self):
        self.state["killed"] = True


class ProcessManager():
    def __init__(self, processes_manager, db_path):
        self.db = TinyDB(db_path)
        self.processes = []
        self.processes_manager = processes_manager
        self.loop = None

    def start(self):
        if not self.loop:
            self.loop = asyncio.new_event_loop()
        self.thread = threading.Thread(
            name="IgniteWorker",
            target=start_worker,
            args=(self.loop,),
            daemon=True
        )
        self.thread.start()

    def create_process(self, action, entity, session_id, process_id=None):
        process_id = process_id or str(uuid4())
        process = Process(
            action=action,
            entity=entity,
            process_id=process_id,
            session_id=session_id,
            processes_manager=self.processes_manager,
            on_finish=self.handle_process_finished
        )
        self.run_process(process)
    
    def run_process(self, process):
        LOGGER.debug(f"Process manager info: {self.thread} {self.loop}")
        LOGGER.debug(f"Process: {process}")
        if not self.thread or not self.thread.is_alive():
            self.start()
        if not self.loop:
            self.loop = asyncio.new_event_loop()
        asyncio.create_task(self.send(process))
        future = asyncio.run_coroutine_threadsafe(process.run(), self.loop)
        LOGGER.debug(f"Future: {future}")
        self.remove(Query().process.id)
        self.db.insert(process.as_dict())
        self.processes.append({
            "id": process.id,
            "process": process,
            "future": future,
        })

    def remove(self, process_id):
        for i, process_data in enumerate(self.processes):
            if process_data["id"] == process_id:
                self.processes.pop(i)
                break
        self.db.remove(Query().process_id == process_id)
    
    def restore_processes(self):
        for kwargs in self.db:
            LOGGER.warning(f"Restoring process from db {kwargs['process_id']}")
            self.create_process(
                action=kwargs["action"],
                entity=kwargs["entity"],
                process_id=kwargs["process_id"],
                session_id=kwargs["session_id"]
            )

    def processes(self):
        return self.processes
    
    def amount(self):
        return len(self.processes)
    
    def handle_process_finished(self, process_id, result):
        process = self.get_process(process_id)
        asyncio.create_task(self.send(process, state="finished" if not process.state["killed"] else "error"))
        print(f"Removing {process_id} from db...")
        self.db.remove(Query().process_id == process_id)
        print("Done.")
    
    def get_process(self, process_id):
        for process_data in self.processes:
            if process_data["id"] == process_id:
                return process_data["process"]
    
    def report(self, session_id=""):
        data = []
        for process_data in self.processes:
            process = process_data["process"]
            if session_id and session_id != process.session_id:
                continue
            data.append({
                "state": process.state["active"],
                "progress": process.progress,
                "name": process.action["label"],
                "entity": process.entity,
                "id": process.id
            })
        return data

    def get_future(self, process_id):
        for process_data in self.processes:
            if process_data["id"] == process_id:
                return process_data["future"]
    
    def pause(self, process_id):
        process = self.get_process(process_id)
        print(f"Pausing {process}")
        if process:
            process.pause()
    
    def unpause(self, process_id):
        process = self.get_process(process_id)
        print(f"Unpausing {process}")
        if process:
            process.unpause()
    
    def retry(self, process_id):
        process = self.get_process(process_id)
        print(f"Retrying {process}")
        if process:
            self.run_process(process)
    
    def kill(self, process_id):
        process = self.get_process(process_id)
        print(f"Killing {process}")
        if process:
            process.kill()
    
    def clear(self, process_id):
        for i, process_data in enumerate(self.processes):
            if process_data["id"] == process_id:
                print(f"Clearing {process_data['process']}")
                self.db.remove(Query().process_id == process_id)
                self.processes.pop(i)
                break
        else:
            print(f"Couldn't find process to clear with {process_id}")

    async def send(self, process, progress=-1, state=""):
        ws = self.processes_manager.get(process.session_id)
        if not ws and self.processes_manager.connections:
            ws, ws_id = self.processes_manager.connections[0]
            LOGGER.error(f"Websocket was not found for {process} {process.session_id} but ended up using {ws_id}")
        elif not ws:
            LOGGER.error(f"Websocket was not found for {process} {process.session_id}")
            return
        data = {
            "name": process.action["label"],
            "entity": process.entity,
            "id": process.id
        }
        if progress >= 0:
            data["progress"] = progress
        if state:
            data["state"] = state
        await ws.send_json({"data": data})
