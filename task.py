from flask import jsonify, request
from datetime import datetime
import db

def add_task():
    data = request.get_json()
    task_name = data.get("task")

    if not task_name:
        return jsonify({"message": "No task provided"}), 400

    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO tasks (name) VALUES (?)", (task_name))
    conn.commit()
    conn.close()

    return jsonify({"message": f"Task '{task_name}' saved successfully."})

def get_tasks():
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name, status, date_completed FROM tasks")
    rows = cursor.fetchall()
    conn.close()

    task_list = [
        {"name": row[0], "status": row[1], "date_completed": row[2]}
        for row in rows
    ]
    return jsonify({"tasks": task_list})

def update_status():
    data = request.get_json()
    task_name = data.get("task")
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

def edit_task():
    data = request.get_json()
    old_name = data["old"]
    new_name = data["new"]
    
    conn = db.get_connection()
    conn.execute("UPDATE tasks SET name = ? WHERE name = ?", (new_name, old_name))
    conn.commit()
    conn.close()
    
    return jsonify(success=True)

def delete_task():
    data = request.get_json()
    task = data["task"]
    
    conn = db.get_connection()
    conn.execute("DELETE FROM tasks WHERE name = ?", (task,))
    conn.commit()
    conn.close()
    
    return jsonify(success=True)