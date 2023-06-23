# Description: UI file for the Task Manager Application

def prompt_user():
    print("-----------------------------")
    print("What can I help you with?")
    print("c - create task")
    print("d - delete task")
    print("l - list tasks")
    print("x - exit application") 

    user_input = input()

    if user_input in ["c", "d", "l", "x"]:
        return user_input
    else: 
        print("Invalid input, please try again")
        prompt_user()    
