class Task: 
    def __init__(self, id, name):

        # Attributes to identify task
        self.id = id # id used to identify name internally
        self.name = name # task name used by the user throuhgout the app

def create_task(id, name): 
    task = Task(id,name)
    return task 