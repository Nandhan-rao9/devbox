from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import time

app = Flask(__name__)
CORS(app)  # frontend ↔ backend during dev

@app.route("/api/check", methods=["POST"])
def check_api():
    data = request.json

    method = data.get("method")
    url = data.get("url")
    headers = data.get("headers", {})
    body = data.get("body")

    if not method or not url:
        return jsonify({"error": "method and url required"}), 400

    try:
        start = time.time()

        request_kwargs = {
            "method": method,
            "url": url,
            "headers": headers,
            "timeout": 15
        }
        
        if method in ["POST", "PUT", "PATCH"]:
            request_kwargs["data"] = body
        
        resp = requests.request(**request_kwargs)


        elapsed = int((time.time() - start) * 1000)

        return jsonify({
            "status": resp.status_code,
            "time": f"{elapsed} ms",
            "headers": dict(resp.headers),
            "body": resp.text
        })

    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True)
