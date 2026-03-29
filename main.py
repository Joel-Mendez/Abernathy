from flask import Flask, render_template, request, jsonify
import db
import task
import project

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')


# Tasks ################################

@app.route('/tasks', methods=['GET'])
def get_tasks():
    return jsonify(task.get_all())

@app.route('/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    name = data.get("name", "")
    task_id = task.create(name, data.get("project_id"))
    return jsonify({"id": task_id, "name": name})

@app.route('/tasks/<int:task_id>', methods=['PATCH'])
def patch_task(task_id):
    data = request.get_json()
    if 'name'           in data: task.update_name(task_id, data['name'])
    if 'status'         in data: task.update_status(task_id, data['status'])
    if 'due_date'       in data: task.update_due_date(task_id, data['due_date'])
    if 'priority'       in data: task.update_priority(task_id, data['priority'])
    if 'effort'         in data: task.update_effort(task_id, data['effort'])
    if 'due_date_fixed' in data: task.update_due_date_fixed(task_id, data['due_date_fixed'])
    if 'project_id'     in data: task.update_project(task_id, data['project_id'])
    if 'notes'          in data: task.update_notes(task_id, data['notes'])
    if 'day_block'      in data: task.update_day_block(task_id, data['day_block'])
    return jsonify({"ok": True})

@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task.delete(task_id)
    return jsonify({"ok": True})

@app.route('/tasks/<int:task_id>/dependencies', methods=['POST'])
def add_dependency(task_id):
    task.add_dependency(task_id, request.get_json().get('child_id'))
    return jsonify({"ok": True})

@app.route('/tasks/<int:task_id>/dependencies/<int:dep_id>', methods=['DELETE'])
def remove_dependency(task_id, dep_id):
    task.remove_dependency(task_id, dep_id)
    return jsonify({"ok": True})


# Projects ################################

@app.route('/projects', methods=['GET'])
def get_projects():
    return jsonify(project.get_all())

@app.route('/projects', methods=['POST'])
def create_project():
    data = request.get_json()
    name = data.get("name", "")
    project_id = project.create(name)
    return jsonify({"id": project_id, "name": name})

@app.route('/projects/<int:project_id>', methods=['PATCH'])
def patch_project(project_id):
    data = request.get_json()
    if 'name'  in data: project.update(project_id, data['name'])
    if 'notes' in data: project.update_notes(project_id, data['notes'])
    return jsonify({"ok": True})

@app.route('/projects/<int:project_id>', methods=['DELETE'])
def delete_project_route(project_id):
    project.delete(project_id)
    return jsonify({"ok": True})


if __name__ == '__main__':
    db.init()
    app.run(debug=False)
