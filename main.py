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
            name TEXT NOT NULL
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
    cursor.execute("INSERT INTO tasks (name) VALUES (?)", (task_name,))
    conn.commit()
    conn.close()

    return jsonify({"message": f"Task '{task_name}' saved successfully."})

@app.route("/get_tasks", methods=["GET"])
def get_tasks():
    conn = sqlite3.connect("abernathy.db")
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM tasks")
    rows = cursor.fetchall()
    conn.close 

    task_list = [row[0] for row in rows]
    return jsonify({"tasks":task_list})

if __name__ == "__main__":
    init_db()
    app.run(debug=True)  