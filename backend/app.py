from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import requests
import time
import pandas as pd
import uuid
import os

app = Flask(__name__)
CORS(app)  # frontend ↔ backend during dev

DATASETS = {}

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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

@app.route("/api/data/upload", methods=["POST"])
def upload_file():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file"}), 400

    dataset_id = str(uuid.uuid4())
    path = os.path.join(UPLOAD_DIR, dataset_id)

    if file.filename.endswith(".csv"):
        df = pd.read_csv(file)
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(file)
    else:
        return jsonify({"error": "Unsupported format"}), 400

    DATASETS[dataset_id] = df

    return jsonify({
        "dataset_id": dataset_id,
        "columns": list(df.columns),
        "rows": len(df)
    })
@app.route("/api/data/operate", methods=["POST"])
def operate():
    data = request.json
    dataset_id = data.get("dataset_id")
    operations = data.get("operations", [])

    df = DATASETS.get(dataset_id)
    if df is None:
        return jsonify({"error": "Invalid dataset"}), 400

    for op in operations:
        if op["type"] == "drop_columns":
            df = df.drop(columns=op["columns"], errors="ignore")

        elif op["type"] == "remove_empty_rows":
            df = df.dropna()

        elif op["type"] == "remove_duplicates":
            df = df.drop_duplicates()

        elif op["type"] == "filter":
            col = op["column"]
            val = op["value"]
            operator = op["op"]

            if operator == ">":
                df = df[df[col] > val]
            elif operator == "<":
                df = df[df[col] < val]
            elif operator == "==":
                df = df[df[col] == val]

    DATASETS[dataset_id] = df

    return jsonify({
        "rows": len(df),
        "preview": df.head(10).to_dict(orient="records")
    })

@app.route("/api/data/export/<dataset_id>")
def export(dataset_id):
    df = DATASETS.get(dataset_id)
    if df is None:
        return jsonify({"error": "Invalid dataset"}), 400

    path = f"{UPLOAD_DIR}/{dataset_id}.csv"
    df.to_csv(path, index=False)

    return send_file(path, as_attachment=True)



if __name__ == "__main__":
    app.run(debug=True)
