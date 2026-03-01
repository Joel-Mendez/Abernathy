from flask import Flask, render_template, request, jsonify
import task

app = Flask(__name__)

@app.route('/') 
def home():
    task.init_db()
    return render_template('index.html')

@app.route('/tasks', methods=['GET'])
def get_tasks():
    return jsonify(task.get_tasks())

@app.route('/create-task', methods=['POST'])
def create_task():
    data = request.get_json()
    name = data.get("message", "")
    task_id = task.create_task(name)
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

if __name__ == '__main__':
    app.run(debug=True)