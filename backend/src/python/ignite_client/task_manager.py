import logging
import asyncio


async def worker(queue, processes_manager):
    print("STARTING TASK WORKER")
    while True:
        if not queue:
            print("Queue worker sleeping...")
            await asyncio.sleep(2)
            continue
        task_id, progress = await queue.get()
        print("connections", processes_manager.connections)
        await asyncio.sleep(1)
        print("queue worker sleeping but not false")
        # ws = processes_manager.get(task_id)
        # ws.send_json({"data": (task_id, progress)})
        print(f"Reported progress {progress} for task {task_id}") 
    print("WORKER EXITED LOOP")


class TaskManager():
    def __init__(self, huey, processes_manager):
        self.tasks = []
        self.errored = []
        self.huey = huey
        self.processes_manager = processes_manager

    def add(self, task, task_id):
        result = self.huey.enqueue(task)
        result.ignite_data = task.kwargs
        self.tasks.append((task_id, result))
        # self.queue.put((task_id, result))
        asyncio.create_task(self.enqueue((task_id, result)))

    async def enqueue(self, stuff):
        await self.queue.put(stuff)

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
    
    def report(self):
        data = []
        waiting = [task.kwargs["task_id"] for task in self.huey.pending()]
        for task_id, task in self.tasks:
            kwargs = task.ignite_data
            state = "running"
            if task.is_revoked():
                state = "paused"
            elif task_id in waiting:
                state = "waiting"
            else:
                result = task()
                if result:
                    state = "finished"
            data.append({
                "state": state,
                "progress": 100,
                "name": kwargs["action"]["label"],
                "entity": kwargs["entity"],
                "id": task_id
            })
        return data
    
    def get(self, task_id):
        for i, (id, task) in enumerate(self.tasks):
            if task_id == id:
                return task
    
    async def start_worker(self):
        self.queue = asyncio.Queue()
        return await worker(self.queue, self.processes_manager)
