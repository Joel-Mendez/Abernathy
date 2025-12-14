from flask import jsonify, request
from datetime import datetime
import db

TABLE = "tasks"

def add_task():
    """
    Retrieves user input (task_name as text) and creates a new entry into the Tasks table
    """
    data = request.get_json()
    task_name = data.get("task")

    if not task_name:
        return jsonify({"message": "No task provided"}), 400

    db.insert_row(TABLE,task_name)

    return jsonify({"message": f"Task '{task_name}' saved successfully."})

def get_tasks():
    task_list = db.get_all(TABLE)
    return jsonify({"tasks": task_list})

def update_status(): 
    data = request.get_json()
    task_name = data.get("task") # CHANGE TO ID
    new_status = data.get("status")

    conn = db.get_connection()
    cursor = conn.cursor()

    if new_status == "complete":
        timestamp = datetime.now().isoformat()
        cursor.execute("UPDATE tasks SET status = ?, date_completed = ? WHERE name = ?", (new_status, timestamp, task_name))
    else:
        cursor.execute("UPDATE tasks SET status = ?, date_completed = NULL WHERE name = ?", (new_status, task_name))

    conn.commit()
    conn.close()

    return jsonify({"message": "Status updated"})

def rename_task():
    data = request.get_json()
    id = data["id"] 
    new_name = data["new"]
    
    db.update_name(TABLE,id,new_name)
    
    return jsonify(success=True)

def delete_task():
    data = request.get_json()
    id = data["id"]
    
    db.delete_row(TABLE,id)
    
    return jsonify(success=True)