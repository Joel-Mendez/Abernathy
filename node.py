from flask import jsonify, request, render_template
from datetime import datetime
import db

def add_node():
    data = request.get_json()
    node_name = data.get("node")

    if not node_name:
        return jsonify({"message": "No node provided"}), 400

    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO nodes (name) VALUES (?)", (node_name,))
    conn.commit()
    conn.close()

    return jsonify({"message": f"node '{node_name}' created successfully."})

def get_nodes():
    conn = db.get_connection()

    cursor = conn.cursor()
    cursor.execute("SELECT * FROM nodes")
    rows = cursor.fetchall()
    conn.close()

    node_list = [dict(row) for row in rows]
    return jsonify({"nodes": node_list})

def edit_node():
    data = request.get_json()
    old_name = data["old"]
    new_name = data["new"]
    
    conn = db.get_connection()
    conn.execute("UPDATE nodes SET name = ? WHERE name = ?", (new_name, old_name))
    conn.commit()
    conn.close()
    
    return jsonify(success=True)

def delete_node():
    data = request.get_json()
    node_name = data["node"]
    
    conn = db.get_connection()
    conn.execute("DELETE FROM nodes WHERE name = ?", (node_name,))
    conn.commit()
    conn.close()
    
    return jsonify(success=True)