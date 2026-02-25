from flask import Flask, render_template, request, jsonify
import tasks

app = Flask(__name__)

@app.route('/') 
def home():
    tasks.init_db()
    return render_template('index.html')

@app.route('/reverse', methods=['POST'])
def reverse():
    data = request.get_json()
    user_input = data.get("message","")
    user_input = user_input[::-1]
    return jsonify({"reversed":user_input})

if __name__ == '__main__':
    app.run(debug=True) 