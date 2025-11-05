from flask import Flask, jsonify, render_template, request

app = Flask(__name__) 

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
    app.run(debug=True)  