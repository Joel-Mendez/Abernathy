from flask import Flask, jsonify, render_template, request
import sqlite3 
from datetime import datetime
import db
import task
import project
import node

# --- Initialize app ---
app = Flask(__name__) 

# --- Home ---
@app.route("/")     
def index():
    return render_template("index.html")

# --- Task Routes ---
@app.route("/add_task", methods=["POST"])
def add_task(): return task.add_task()

@app.route("/get_tasks", methods=["GET"])
def get_tasks(): return task.get_tasks()

@app.route("/update_status", methods=["POST"])
def update_status(): return task.update_status()

@app.route("/edit_task", methods=["POST"])
def edit_task(): return task.edit_task()

@app.route("/delete_task", methods=["POST"])
def delete_task(): return task.delete_task()

# --- Project Routes ---
@app.route("/add_project", methods=["POST"])
def add_project(): return project.add_project()

@app.route("/get_projects", methods=["GET"])
def get_projects(): return project.get_projects()

@app.route("/update_project_status", methods=["POST"])
def update_project_status(): return project.update_status()

@app.route("/edit_project", methods=["POST"])
def edit_project(): return project.edit_project()

@app.route("/delete_project", methods=["POST"])
def delete_project(): return project.delete_project()

# --- Knowledge Base Routes ---
@app.route("/add_node", methods=["POST"])
def add_node(): return node.add_node()

@app.route("/get_nodes", methods=["GET"])
def get_nodes(): return node.get_nodes()

@app.route("/update_node_status", methods=["POST"])
def update_node_status(): return node.update_status()

@app.route("/edit_node", methods=["POST"])
def edit_node(): return node.edit_node()

@app.route("/delete_node", methods=["POST"])
def delete_node(): return node.delete_node()

# --- Run app ---
if __name__ == "__main__":
    db.init_db()
    app.run(debug=True)  