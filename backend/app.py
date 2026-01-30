import os
import sqlite3
import pandas as pd
import time
import re
import requests
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Gemini Configuration
# NOTE: Keep your API key private in production environments!
genai.configure(api_key="AIzaSyAL0gOlBwGiStQ4E_8c57w4-3gp4jknDts")
model = genai.GenerativeModel('gemini-2.0-flash')

# In-memory storage for the current session's dataframe
DATASETS = {}

# --- API CHECKER LOGIC ---
@app.route("/api/check", methods=["POST"])
def check_api():
    data = request.json
    method = data.get("method", "GET").upper()
    url = data.get("url")
    headers = data.get("headers", {})
    body = data.get("body")

    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        start = time.time()
        
        request_kwargs = {
            "method": method,
            "url": url,
            "headers": headers,
            "timeout": 15
        }
        
        if method in ["POST", "PUT", "PATCH"] and body:
            request_kwargs["data"] = body
        
        resp = requests.request(**request_kwargs)
        elapsed = int((time.time() - start) * 1000)

        return jsonify({
            "status": resp.status_code,
            "time": f"{elapsed} ms",
            "headers": dict(resp.headers),
            "body": resp.text
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- DATA ENGINE LOGIC ---
@app.route("/api/upload", methods=["POST"])
def upload():
    file = request.files.get("file")
    if not file: 
        return jsonify({"error": "No file provided"}), 400

    try:
        # Load data based on file extension
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file)
        else:
            return jsonify({"error": "Unsupported file format. Use CSV or Excel."}), 400
        
        # Sanitize column names: Remove non-alphanumeric chars and replace with underscores
        # This prevents SQL injection and syntax errors in SQLite
        df.columns = [re.sub(r'[^\w]', '_', c).strip().lower() for c in df.columns]
        
        dataset_id = "current_session"
        DATASETS[dataset_id] = df
        
        return jsonify({
            "columns": list(df.columns),
            "rows": len(df),
            "preview": df.head(10).to_dict(orient="records")
        })
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

@app.route("/api/query", methods=["POST"])
def query_data():
    user_input = request.json.get("query")
    df = DATASETS.get("current_session")
    
    if df is None: 
        return jsonify({"error": "Please upload a dataset first"}), 400

    try:
        # 1. Generate SQL via Gemini
        prompt = (
            f"You are a SQL expert. Return ONLY a valid SQLite query. "
            f"Table name is 'data'. Columns are: {list(df.columns)}. "
            f"User request: {user_input}"
        )
        
        response = model.generate_content(prompt)
        # Clean the response to ensure only the SQL string remains
        sql = response.text.replace("```sql", "").replace("```", "").strip()
        
        # 2. Execute SQL on the DataFrame using an in-memory SQLite instance
        conn = sqlite3.connect(':memory:')
        df.to_sql('data', conn, index=False)
        result_df = pd.read_sql_query(sql, conn)
        
        # Optional: Uncomment below to make the query results the "new" active dataset
        # DATASETS["current_session"] = result_df

        return jsonify({
            "sql": sql,
            "preview": result_df.head(15).to_dict(orient="records"),
            "rows": len(result_df)
        })
    except Exception as e:
        return jsonify({"error": f"Query execution failed: {str(e)}"}), 500

if __name__ == "__main__":
    # Ensure dependencies are installed: 
    # pip install flask flask-cors pandas openpyxl requests google-generativeai
    app.run(debug=True, port=5000)