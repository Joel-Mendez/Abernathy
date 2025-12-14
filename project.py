from flask import jsonify, request
from datetime import datetime
import db

TABLE = "projects"

def add_project():
    data = request.get_json()
    project_name = data.get("project")

    if not project_name:
        return jsonify({"message": "No project provided"}), 400

    db.insert_row(TABLE,project_name)

    return jsonify({"message": f"Project '{project_name}' created successfully."})

def get_projects():
    project_list = db.get_all(TABLE)
    return jsonify({"projects": project_list})

def rename_project():
    data = request.get_json()
    id = data["id"]
    new_name = data["new"]
    
    db.update_name(TABLE,id,new_name)
    
    return jsonify(success=True)

def delete_project():
    data = request.get_json()
    id = data["id"]
    db.delete_row(TABLE,id)
    
    return jsonify(success=True)