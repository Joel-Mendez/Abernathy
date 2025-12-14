from flask import jsonify, request, render_template
from datetime import datetime
import db

TABLE = "nodes"

def add_node():
    data = request.get_json()
    node_name = data.get("node")

    if not node_name:
        return jsonify({"message": "No node provided"}), 400

    db.insert_row(TABLE,node_name)

    return jsonify({"message": f"node '{node_name}' created successfully."})

def get_nodes():
    node_list = db.get_all(TABLE)
    return jsonify({"nodes": node_list})

def rename_node(): 
    data = request.get_json()
    id = data["id"]
    new_name = data["new"]
    
    db.update_name(TABLE,id,new_name)
    
    return jsonify(success=True)

def delete_node():
    data = request.get_json()
    id = data["id"] 
    
    db.delete_row(TABLE,id)
    
    return jsonify(success=True)