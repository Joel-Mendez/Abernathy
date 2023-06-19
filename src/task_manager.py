from src.task import Task 
from src.database import Database 

def create_task(task_name):
    db = Database('tasks.db')
    task = Task(None, task_name)
    db.add_task(task)

# def delete_task(task_id):
#     db = Database('tasks.db')
#     task = Task(task_id, None)
#     db.delete_task(task)