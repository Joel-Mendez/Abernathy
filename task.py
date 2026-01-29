from flask import jsonify, request
from datetime import datetime
import db

TABLE = "tasks"

def create_task():
    """
    Retrieves user input (task_name as text) and creates a new entry into the Tasks table
    """
    data = request.get_json() or {}
    task_name = data.get("name") or data.get("task")

    if not task_name or not task_name.strip():
        return jsonify({"message": "No task provided"}), 400

    db.insert_row(TABLE, task_name.strip())

    return jsonify({"message": f"Task '{task_name.strip()}' saved successfully."})

def list_tasks():
    task_list = db.get_all(TABLE)
    return jsonify({"tasks": task_list})

def update_task(task_id):
    data = request.get_json() or {}
    updates = {}

    new_name = data.get("name") or data.get("new")
    if new_name is not None:
        new_name = new_name.strip()
        if not new_name:
            return jsonify({"message": "Name cannot be empty"}), 400
        updates["name"] = new_name

    if "status" in data:
        status = data["status"]
        updates["status"] = status
        updates["date_completed"] = (
            datetime.now().isoformat() if status == "complete" else None
        )

    if "project_id" in data:
        updates["project_id"] = data["project_id"]

    if "due_date" in data:
        updates["due_date"] = data["due_date"]

    if not updates:
        return jsonify({"message": "No valid fields provided"}), 400

    db.update_fields(TABLE, task_id, updates)
    return jsonify({"message": "Task updated"})

def delete_task(task_id):
    db.delete_row(TABLE, task_id)
    return jsonify(success=True)
