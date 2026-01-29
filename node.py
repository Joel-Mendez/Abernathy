from flask import jsonify, request
import db

TABLE = "nodes"

def create_node():
    data = request.get_json() or {}
    node_name = data.get("name") or data.get("node")

    if not node_name or not node_name.strip():
        return jsonify({"message": "No node provided"}), 400

    db.insert_row(TABLE, node_name.strip())

    return jsonify({"message": f"node '{node_name.strip()}' created successfully."})

def list_nodes():
    node_list = db.get_all(TABLE)
    return jsonify({"nodes": node_list})

def get_node(node_id):
    node = db.get_row(TABLE, node_id)
    if not node:
        return jsonify({"message": "Node not found"}), 404
    return jsonify(node)

def update_node(node_id):
    data = request.get_json() or {}
    new_name = data.get("name") or data.get("new")
    new_content = data.get("content")

    if new_name is None and new_content is None:
        return jsonify({"message": "No valid fields provided"}), 400

    fields = {}
    if new_name is not None:
        new_name = new_name.strip()
        if not new_name:
            return jsonify({"message": "Name cannot be empty"}), 400
        fields["name"] = new_name

    if new_content is not None:
        fields["content"] = new_content

    db.update_fields(TABLE, node_id, fields)
    return jsonify({"message": "Node updated"})

def delete_node(node_id):
    db.delete_row(TABLE, node_id)
    return jsonify(success=True)
