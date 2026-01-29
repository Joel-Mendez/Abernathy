from flask import Flask, render_template, request
import db
import task
import project
import node

########### Initialize app ##########
app = Flask(__name__) 

############# Home ##################
@app.route("/")     
def index():
    return render_template("index.html")

######### Task Routes ###############
@app.route("/tasks", methods=["GET", "POST"])
def tasks_collection():
    if request.method == "GET":
        return task.list_tasks()
    return task.create_task()

@app.route("/tasks/<int:task_id>", methods=["PATCH", "DELETE"])
def task_detail(task_id):
    if request.method == "PATCH":
        return task.update_task(task_id)
    return task.delete_task(task_id)

######## Project Routes ###################
@app.route("/projects", methods=["GET", "POST"])
def projects_collection():
    if request.method == "GET":
        return project.list_projects()
    return project.create_project()

@app.route("/projects/<int:project_id>", methods=["PATCH", "DELETE"])
def project_detail(project_id):
    if request.method == "PATCH":
        return project.update_project(project_id)
    return project.delete_project(project_id)

##### Knowledge Base Routes #################
@app.route("/nodes", methods=["GET", "POST"])
def nodes_collection():
    if request.method == "GET":
        return node.list_nodes()
    return node.create_node()

@app.route("/nodes/<int:node_id>", methods=["GET", "PATCH", "DELETE"])
def node_detail(node_id):
    if request.method == "GET":
        return node.get_node(node_id)
    if request.method == "PATCH":
        return node.update_node(node_id)
    return node.delete_node(node_id)

##### Run App ##################################
if __name__ == "__main__":
    db.init_db()
    app.run(debug=True)  
