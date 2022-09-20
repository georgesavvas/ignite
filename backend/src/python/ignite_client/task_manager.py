import logging
import asyncio
import threading


def start_worker(loop):
    print("WORKER INIT")
    asyncio.set_event_loop(loop)
    loop.run_forever()
    print("WORKER END")


class TaskManager():
    def __init__(self, processes_manager):
        self.tasks = []
        self.processes_manager = processes_manager

        self.loop = asyncio.new_event_loop()
        self.queue = asyncio.Queue(loop=self.loop)
        self.thread = threading.Thread(
            target=start_worker, args=(self.loop,), daemon=True
        )
        self.thread.start()

    def add(self, task, action, entity, task_id, session_id):
        future = asyncio.run_coroutine_threadsafe(task, self.loop)
        asyncio.create_task(self.send(action, entity, task_id, session_id))

    def remove(self, task_id):
        for i, (id, task) in enumerate(self.tasks):
            if task_id == id:
                task.revoke()
                self.tasks.pop(i)
                break
    
    def tasks(self):
        return self.tasks
    
    def amount(self):
        return len(self.tasks)
    
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
    
    def get(self, task_id):
        for i, (id, task) in enumerate(self.tasks):
            if task_id == id:
                return task
    
    async def send(self, action, entity, task_id, session_id):
        ws = self.processes_manager.get(session_id)
        await ws.send_json({"data": {
            "state": "waiting",
            "progress": 0,
            "name": action["label"],
            "entity": entity,
            "id": task_id
        }})
