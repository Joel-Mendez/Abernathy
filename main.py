from src.task import *


def main():
    print('Welcome to your Task Manager')

    while True: 
        print("What can I help you with?")
        print("c - create task")
        print("x - exit application") 

        user_input = input()

        if user_input == "c":
            # Create Task
            task_name = input('Specify Task name ...')
            task = create_task(1,task_name)
            print(task.name)
        elif user_input == "x":
            print("Exiting app... ")
            break
        else: 
            print("Invalid Option. Please Try again...")

if __name__ == "__main__":
    main()