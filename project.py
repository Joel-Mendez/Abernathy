from flask import jsonify, request
from datetime import datetime
import db

def add_project():
    data = request.get_json()
    project_name = data.get("project")

    if not project_name:
        return jsonify({"message": "No project provided"}), 400

    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO projects (name) VALUES (?)", (project_name,))
    conn.commit()
    conn.close()

    return jsonify({"message": f"Project '{project_name}' created successfully."})

def get_projects():
    conn = db.get_connection()

    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects")
    rows = cursor.fetchall()
    conn.close()

    project_list = [dict(row) for row in rows]
    return jsonify({"projects": project_list})

def edit_project():
    data = request.get_json()
    old_name = data["old"]
    new_name = data["new"]
    
    conn = db.get_connection()
    conn.execute("UPDATE projects SET name = ? WHERE name = ?", (new_name, old_name))
    conn.commit()
    conn.close()
    
    return jsonify(success=True)

def delete_project():
    data = request.get_json()
    project_name = data["project"]
    
    conn = db.get_connection()
    conn.execute("DELETE FROM projects WHERE name = ?", (project_name,))
    conn.commit()
    conn.close()
    
    return jsonify(success=True)