import logging
from ignite_client import utils


HUEY = utils.get_huey()


class TaskManager:
    def __init__(self):
        self.tasks = []

    def add(self, task):
        self.tasks.insert(0, task)
        HUEY.enqueue(task)

    def remove(self, task):
        self.tasks.remove(task)
    
    def tasks(self):
        return self.tasks
    
    def amount(self):
        return len(self.tasks)


manager = TaskManager()
