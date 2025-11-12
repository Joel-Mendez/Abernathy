from flask import Flask, jsonify, render_template, request
import sqlite3 

app = Flask(__name__) 

# Initialize the database
def init_db():
    conn = sqlite3.connect("abernathy.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            name TEXT NOT NULL,
            status TEXT DEFAULT 'not started'
        )
    """)

@app.route("/")     
def index():
    return render_template("index.html")

@app.route("/add_task", methods=["POST"])
def add_task():
    data = request.get_json()
    task_name = data.get("task")

    if not task_name:
        return jsonify({"message": "No task provided"}), 400

    conn = sqlite3.connect("abernathy.db")
    cursor = conn.cursor()
    cursor.execute("INSERT INTO tasks (name, status) VALUES (?, ?)", (task_name,"not started"))
    conn.commit()
    conn.close()

    return jsonify({"message": f"Task '{task_name}' saved successfully."})

@app.route("/get_tasks", methods=["GET"])
def get_tasks():
    conn = sqlite3.connect("abernathy.db")
    cursor = conn.cursor()
    cursor.execute("SELECT name, status FROM tasks")
    rows = cursor.fetchall()
    conn.close()

    task_list = [{"name": row[0], "status": row[1]} for row in rows]
    return jsonify({"tasks":task_list})

@app.route("/update_status", methods=["POST"])
def update_status():
    data = request.get_json()
    task_name = data.get("task")
    new_status = data.get("status")

    conn = sqlite3.connect("abernathy.db")
    cursor = conn.cursor()
    cursor.execute("UPDATE tasks SET status = ? WHERE name = ?", (new_status, task_name))
    conn.commit()
    conn.close()

    return jsonify({"message": "Status updated"})

@app.route("/edit_task", methods=["POST"])
def edit_task():
    data = request.get_json()
    old_name = data["old"]
    new_name = data["new"]
    
    conn = sqlite3.connect("abernathy.db")
    conn.execute("UPDATE tasks SET name = ? WHERE name = ?", (new_name, old_name))
    conn.commit()
    conn.close()
    
    return jsonify(success=True)

@app.route("/delete_task", methods=["POST"])
def delete_task():
    data = request.get_json()
    task = data["task"]
    
    conn = sqlite3.connect("abernathy.db")
    conn.execute("DELETE FROM tasks WHERE name = ?", (task,))
    conn.commit()
    conn.close()
    
    return jsonify(success=True)

if __name__ == "__main__":
    init_db()
    app.run(debug=True)  