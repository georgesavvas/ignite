import logging
from ignite_client import utils


class TaskManager():
    def __init__(self, huey):
        self.tasks = []
        self.huey = huey

    def add(self, task):
        result = self.huey.enqueue(task)
        result.ignite_action = task.ignite_action
        result.ignite_entity = task.ignite_entity
        self.tasks.insert(0, result)

    def remove(self, task):
        self.tasks.remove(task)
    
    def tasks(self):
        return self.tasks
    
    def amount(self):
        return len(self.tasks)
    
    def report(self):
        data = {}
        for task in self.tasks:
            data[task.id] = {
                "action": task.ignite_action,
                "entity": task.ignite_entity,
                "result": task()
            }
        return data
    
    def get(self, task_id):
        for task in self.tasks:
            if task.id == task_id:
                return task
