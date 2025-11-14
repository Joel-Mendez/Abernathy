from flask import Flask, jsonify, render_template, request
import sqlite3 
from datetime import datetime
import db

# Initialize app
app = Flask(__name__) 

@app.route("/")     
def index():
    return render_template("index.html")

@app.route("/add_task", methods=["POST"])
def add_task():
    data = request.get_json()
    task_name = data.get("task")

    if not task_name:
        return jsonify({"message": "No task provided"}), 400

    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO tasks (name, status) VALUES (?, ?)", (task_name,"not started"))
    conn.commit()
    conn.close()

    return jsonify({"message": f"Task '{task_name}' saved successfully."})

@app.route("/get_tasks", methods=["GET"])
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

@app.route("/update_status", methods=["POST"])
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

@app.route("/edit_task", methods=["POST"])
def edit_task():
    data = request.get_json()
    old_name = data["old"]
    new_name = data["new"]
    
    conn = db.get_connection()
    conn.execute("UPDATE tasks SET name = ? WHERE name = ?", (new_name, old_name))
    conn.commit()
    conn.close()
    
    return jsonify(success=True)

@app.route("/delete_task", methods=["POST"])
def delete_task():
    data = request.get_json()
    task = data["task"]
    
    conn = db.get_connection()
    conn.execute("DELETE FROM tasks WHERE name = ?", (task,))
    conn.commit()
    conn.close()
    
    return jsonify(success=True)

if __name__ == "__main__":
    db.init_db()
    app.run(debug=True)  