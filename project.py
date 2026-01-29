from flask import jsonify, request
import db

TABLE = "projects"

def create_project():
    data = request.get_json() or {}
    project_name = data.get("name") or data.get("project")

    if not project_name or not project_name.strip():
        return jsonify({"message": "No project provided"}), 400

    db.insert_row(TABLE, project_name.strip())

    return jsonify({"message": f"Project '{project_name.strip()}' created successfully."})

def list_projects():
    project_list = db.get_all(TABLE)
    return jsonify({"projects": project_list})

def get_project(project_id):
    project = db.get_row(TABLE, project_id)
    if not project:
        return jsonify({"message": "Project not found"}), 404
    tasks = db.get_tasks_by_project(project_id)
    return jsonify({"project": project, "tasks": tasks})

def update_project(project_id):
    data = request.get_json() or {}
    new_name = data.get("name") or data.get("new")

    if new_name is None:
        return jsonify({"message": "No valid fields provided"}), 400

    new_name = new_name.strip()
    if not new_name:
        return jsonify({"message": "Name cannot be empty"}), 400

    db.update_name(TABLE, project_id, new_name)
    return jsonify({"message": "Project updated"})

def delete_project(project_id):
    db.delete_row(TABLE, project_id)
    return jsonify(success=True)
