# Description: Main file for the Task Manager Application

from src.task_manager import * 
from src.ui import *

def main():
    print('Welcome to your Task Manager')
    while True: 
        user_input = prompt_user()

        if user_input == "c": # Handle User Input functions in UI later
            # Create Task
            print('creating task...')
            task_name = input('Enter task name: ')
            create_task(task_name)
        elif user_input == "d":
            # Delete Task
            print('delete task...')
            task_name = input('Enter task id: ')  
            delete_task(task_name)
        elif user_input == "l":
            # List Tasks
            print('list tasks ...')
            list_tasks()
        elif user_input == "x":
            print("Exiting app... ")
            break

if __name__ == "__main__":
    main()