import logging


class TaskManager:
    def __init__(self):
        self.tasks = []

    def add(self, task):
        self.tasks.append(task)

    def remove(self, task):
        self.tasks.remove(task)
    
    def tasks(self):
        return self.tasks
    
    def amount(self):
        return len(self.tasks)


manager = TaskManager()
