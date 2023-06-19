# Description: Main file for the Task Manager Application

from src.task_manager import * 

def main():
    print('Welcome to your Task Manager')
    while True: 
        # Promting User for input (move to ui.py later)
        print("What can I help you with?")
        print("c - create task")
        print("d - delete task")
        print("l - list tasks")
        print("x - exit application") 
        user_input = input()

        if user_input == "c": # Handle User Input functions in UI later
            # Create Task
            task_name = input('Specify Task name ...')
            create_task(task_name)
        elif user_input == "d":
            # Delete Task
            pass
        elif user_input == "l":
            # List Tasks
            pass
        elif user_input == "x":
            print("Exiting app... ")
            break
        else: 
            print("Invalid Option. Please Try again...")

if __name__ == "__main__":
    main()