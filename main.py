from flask import Flask, jsonify, render_template

app = Flask(__name__) 

@app.route("/")     
def index():
    return render_template("index.html")

@app.route("/greeting")     
def home():
    return jsonify({"message":"Howdy, howdy!"}) 

if __name__ == "__main__":
    app.run(debug=True)  