import logging
import asyncio
import threading
import importlib
from pathlib import PurePath
from tinydb import TinyDB, Query


def start_worker(loop):
    print("WORKER INIT")
    asyncio.set_event_loop(loop)
    loop.run_forever()
    print("WORKER END")


class Task():
    def __init__(self, action, entity, task_id, processes_manager, on_finish, session_id, **kwargs):
        self.action = action
        self.entity = entity
        self.id = task_id
        self.session_id = session_id
        self.processes_manager = processes_manager
        self.state = {"paused": False, "killed": False}
        self.on_finish = on_finish

    async def run(self):
        async def progress_fn(progress=-1, state=""):
            ws = self.processes_manager.get(self.action["session_id"])
            data = {"id": self.id}
            if progress >= 0:
                data["progress"] = progress
            if state:
                data["state"] = state
            elif progress >= 0:
                data["state"] = "running" if progress < 100 else "finished"
            await ws.send_json({"data": data})
        module_path = PurePath(self.action["module_path"])
        module = importlib.machinery.SourceFileLoader(
            module_path.name, str(module_path)
        ).load_module()
        result = await module.main(entity=self.entity, progress_fn=progress_fn, state=self.state)
        self.on_finish(self.id, result)
        return result
    
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

        self.loop = asyncio.new_event_loop()
        self.thread = threading.Thread(
            target=start_worker, args=(self.loop,), daemon=True
        )
        self.thread.start()
        self.restore_items()

    def add(self, **kwargs):
        task = Task(**kwargs, processes_manager=self.processes_manager, on_finish=self.handle_task_finished)
        asyncio.create_task(self.send(task, state="waiting"))
        self.db.insert({**kwargs})
        future = asyncio.run_coroutine_threadsafe(task.run(), self.loop)
        self.tasks.append({
            "id": kwargs["task_id"],
            "task": task,
            "future": future,
        })

    def remove(self, task_id):
        for i, (id, task) in enumerate(self.tasks):
            if task_id == id:
                task.revoke()
                self.tasks.pop(i)
                break
    
    def restore_items(self):
        for item in self.db:
            print(item)
            logging.warning(f"Restoring task from db {item['task_id']}")

    def tasks(self):
        return self.tasks
    
    def amount(self):
        return len(self.tasks)
    
    def handle_task_finished(self, task_id, result):
        task = self.get_task(task_id)
        asyncio.create_task(self.send(task, state="finished" if not task.state["killed"] else "error"))
        self.db.remove(Query().id == task_id)
    
    # def report(self):
    #     data = []
    #     # waiting = [task.kwargs["task_id"] for task in self.huey.pending()]
    #     for task_id, task in self.tasks:
    #         kwargs = task.ignite_data
    #         state = "running"
    #         if task.is_revoked():
    #             state = "paused"
    #         elif task_id in waiting:
    #             state = "waiting"
    #         else:
    #             result = task()
    #             if result:
    #                 state = "finished"
    #         data.append({
    #             "state": state,
    #             "progress": 100,
    #             "name": kwargs["action"]["label"],
    #             "entity": kwargs["entity"],
    #             "id": task_id
    #         })
    #     return data
    
    def get_task(self, task_id):
        for task_data in self.tasks:
            if task_data["id"] == task_id:
                return task_data["task"]
    
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
        data = {
            "state": "waiting",
            "name": task.action["label"],
            "entity": task.entity,
            "id": task.id
        }
        if progress >= 0:
            data["progress"] = progress
        if state:
            data["state"] = state
        await ws.send_json({"data": data})
