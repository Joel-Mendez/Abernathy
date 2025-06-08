
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/reverse', methods=['POST'])
def reverse_string():
    data = request.get_json()
    input_string = data.get('input','')
    reversed_string = input_string[::-1]
    return jsonify({'reversed':reversed_string})

if __name__ == '__main__':
    app.run(debug=True)