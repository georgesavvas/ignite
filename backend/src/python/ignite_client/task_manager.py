import enum
import logging
from ignite_client import utils
import asyncio


# async def worker(name, queue):
#     while True:

#         sleep_for = await queue.get()
#         await asyncio.sleep(sleep_for)
#         queue.task_done()
#         print(f'{name} has slept for {sleep_for:0.2f} seconds')


class TaskManager():
    def __init__(self, huey):
        self.tasks = []
        self.huey = huey
        self.queue = asyncio.Queue()

    def add(self, task, task_id):
        result = self.huey.enqueue(task)
        result.ignite_action = task.ignite_action
        result.ignite_entity = task.ignite_entity
        self.tasks.append((task_id, result))

    def remove(self, task_id):
        for i, (id, task) in enumerate(self.tasks):
            if task_id == id:
                self.tasks.pop(i)
                break
    
    def tasks(self):
        return self.tasks
    
    def amount(self):
        return len(self.tasks)
    
    def report(self):
        data = {}
        for task_id, task in self.tasks:
            data[task_id] = {
                "action": task.ignite_action,
                "entity": task.ignite_entity,
                "result": task()
            }
        return data
    
    def get(self, task_id):
        for i, (id, task) in enumerate(self.tasks):
            if task_id == id:
                return task
