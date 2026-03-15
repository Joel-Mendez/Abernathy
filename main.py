from flask import Flask, render_template, request, jsonify
import task

app = Flask(__name__) # Create application

@app.route('/') # Route for the home page
def home():
    return render_template('index.html')

# Task Routes
@app.route('/tasks', methods=['GET'])
def get_tasks():
    return jsonify(task.get_tasks())

@app.route('/create-task', methods=['POST'])
def create_task():
    data = request.get_json()
    name = data.get("message", "")
    project_id = data.get("project_id", None)
    task_id = task.create_task(name, project_id)
    return jsonify({"id": task_id, "name": name})

@app.route('/delete-task', methods=['POST'])
def delete_task():
    data = request.get_json()
    task.delete_task(data.get("id"))
    return jsonify({"ok": True})

@app.route('/update-task', methods=['POST'])
def update_task():
    data = request.get_json()
    task.update_task(data.get("id"), data.get("name"))
    return jsonify({"ok": True})

@app.route('/update-status', methods=['POST'])
def update_status():
    data = request.get_json()
    task.update_task_status(data.get("id"), data.get("status"))
    return jsonify({"ok": True})

@app.route('/update-due-date', methods=['POST'])
def update_due_date():
    data = request.get_json()
    task.update_task_due_date(data.get("id"), data.get("due_date"))
    return jsonify({"ok": True})

@app.route('/update-priority', methods=['POST'])
def update_priority():
    data = request.get_json()
    task.update_task_priority(data.get("id"), data.get("priority"))
    return jsonify({"ok": True})

@app.route('/update-effort', methods=['POST'])
def update_effort():
    data = request.get_json()
    task.update_task_effort(data.get("id"), data.get("effort"))
    return jsonify({"ok": True})

@app.route('/update-due-date-fixed', methods=['POST'])
def update_due_date_fixed():
    data = request.get_json()
    task.update_task_due_date_fixed(data.get("id"), data.get("fixed"))
    return jsonify({"ok": True})

@app.route('/add-dependency', methods=['POST'])
def add_dependency():
    data = request.get_json()
    task.add_dependency(data.get('parent_id'), data.get('child_id'))
    return jsonify({"ok": True})

@app.route('/remove-dependency', methods=['POST'])
def remove_dependency():
    data = request.get_json()
    task.remove_dependency(data.get('parent_id'), data.get('child_id'))
    return jsonify({"ok": True})

@app.route('/update-task-project', methods=['POST'])
def update_task_project():
    data = request.get_json()
    task.update_task_project(data.get("id"), data.get("project_id"))
    return jsonify({"ok": True})

@app.route('/update-notes', methods=['POST'])
def update_notes():
    data = request.get_json()
    task.update_task_notes(data.get("id"), data.get("notes"))
    return jsonify({"ok": True})

# Project Routes
@app.route('/projects', methods=['GET'])
def get_projects():
    return jsonify(task.get_projects())

@app.route('/create-project', methods=['POST'])
def create_project():
    data = request.get_json()
    name = data.get("name", "")
    project_id = task.create_project(name)
    return jsonify({"id": project_id, "name": name})

@app.route('/delete-project', methods=['POST'])
def delete_project():
    data = request.get_json()
    task.delete_project(data.get("id"))
    return jsonify({"ok": True})

@app.route('/update-project', methods=['POST'])
def update_project():
    data = request.get_json()
    task.update_project(data.get("id"), data.get("name"))
    return jsonify({"ok": True})

if __name__ == '__main__':
    task.init_db() 
    app.run(debug=False)