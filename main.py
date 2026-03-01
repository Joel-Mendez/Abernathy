from flask import Flask, render_template, request, jsonify
import tasks

app = Flask(__name__)

@app.route('/') 
def home():
    tasks.init_db()
    return render_template('index.html')

@app.route('/tasks', methods=['GET'])
def get_tasks():
    return jsonify(tasks.get_tasks())

@app.route('/create-task', methods=['POST'])
def create_task():
    data = request.get_json()
    name = data.get("message", "")
    task_id = tasks.create_task(name)
    return jsonify({"id": task_id, "name": name})

@app.route('/delete-task', methods=['POST'])
def delete_task():
    data = request.get_json()
    tasks.delete_task(data.get("id"))
    return jsonify({"ok": True})

if __name__ == '__main__':
    app.run(debug=True)