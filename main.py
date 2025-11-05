from flask import Flask, jsonify, render_template, request
import sqlite3 

app = Flask(__name__) 

# Initialize the database
def init_db():
    conn = sqlite3.connect("abernathy.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            name TEXT NOT NULL
        )
    """)

@app.route("/")     
def index():
    return render_template("index.html")

@app.route("/reverse",methods=["POST"]) 
def reverse_text():
    data = request.get_json()
    text = data.get("message","")
    reversed_text = text[::-1]
    return jsonify({"reversed":reversed_text})

if __name__ == "__main__":
    init_db()
    app.run(debug=True)  