from flask import Flask, render_template
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
@app.route("/add_task", methods=["POST"])
def add_task(): return task.add_task()

@app.route("/get_tasks", methods=["GET"])
def get_tasks(): return task.get_tasks()

@app.route("/update_task_status", methods=["POST"])
def update_task_status(): return task.update_status()

@app.route("/rename_task", methods=["POST"]) #change in frontend
def rename_task(): return task.rename_task()

@app.route("/delete_task", methods=["POST"])
def delete_task(): return task.delete_task()

######## Project Routes ###################
@app.route("/add_project", methods=["POST"])
def add_project(): return project.add_project()

@app.route("/get_projects", methods=["GET"])
def get_projects(): return project.get_projects()

@app.route("/rename_project", methods=["POST"]) #change in frontend
def rename_project(): return project.rename_project()

@app.route("/delete_project", methods=["POST"])
def delete_project(): return project.delete_project()

##### Knowledge Base Routes #################
@app.route("/add_node", methods=["POST"])
def add_node(): return node.add_node()

@app.route("/get_nodes", methods=["GET"])
def get_nodes(): return node.get_nodes()

@app.route("/rename_node", methods=["POST"]) #change in frontend
def rename_node(): return node.rename_node()

@app.route("/delete_node", methods=["POST"])
def delete_node(): return node.delete_node()

##### Run App ##################################
if __name__ == "__main__":
    db.init_db()
    app.run(debug=True)  