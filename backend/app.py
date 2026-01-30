import os
import sqlite3
import pandas as pd
import time
import re
import requests
import google.generativeai as genai
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- Configuration ---
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

API_KEY = os.getenv("GOOGLE_API_KEY") 
# Use your new verified key here
API_KEY = API_KEY
genai.configure(api_key=API_KEY)

# Confirmed model from your previous check
model = genai.GenerativeModel('gemini-3-flash-preview')

DATASETS = {}

def clean_sql(text):
    """Safely extracts SQL from Gemini's response."""
    # Remove markdown formatting
    sql = re.sub(r'```sql|```', '', text, flags=re.IGNORECASE).strip()
    # Remove any trailing semicolons
    return sql.replace(';', '')

# --- ROUTES ---

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

@app.route("/api/upload", methods=["POST"])
def upload():
    file = request.files.get("file")
    if not file: return jsonify({"error": "No file"}), 400

    try:
        # Load Data
        df = pd.read_csv(file) if file.filename.endswith('.csv') else pd.read_excel(file)
        
        # CLEAN COLUMN NAMES: This is crucial for SQL
        # Replaces spaces/special chars with underscores and keeps them lower case
        df.columns = [re.sub(r'[^\w]', '_', c).strip().lower() for c in df.columns]
        
        DATASETS["current_session"] = df
        
        return jsonify({
            "columns": list(df.columns),
            "rows": len(df),
            "preview": df.head(10).to_dict(orient="records")
        })
    except Exception as e:
        print(f"Upload Error: {e}") # Check your console!
        return jsonify({"error": str(e)}), 500

@app.route("/api/query", methods=["POST"])
def query_data():
    user_input = request.json.get("query")
    df = DATASETS.get("current_session")
    
    if df is None: return jsonify({"error": "Upload data first"}), 400

    try:
        # 1. Ask Gemini for SQL
        prompt = (f"Return ONLY valid SQLite code. Table name is 'data'. "
                  f"Columns: {list(df.columns)}. Request: {user_input}")
        
        response = model.generate_content(prompt)
        sql = clean_sql(response.text)
        
        # 2. Run SQL on Data
        conn = sqlite3.connect(':memory:')
        df.to_sql('data', conn, index=False)
        result_df = pd.read_sql_query(sql, conn)
        
        return jsonify({
            "sql": sql,
            "preview": result_df.head(15).to_dict(orient="records"),
            "rows": len(result_df)
        })
    except Exception as e:
        print(f"Query Error: {e}") # This shows the real crash in your terminal
        return jsonify({
            "error": f"Internal Error: {str(e)}",
            "sql_attempted": locals().get('sql', 'Failed to generate')
        }), 500
    
# Add this to your Flask app in the backend
@app.route("/api/export", methods=["GET"])
def export_data():
    df = DATASETS.get("current_session")
    if df is None:
        return jsonify({"error": "No data to export"}), 400

    export_path = os.path.join(UPLOAD_DIR, "processed_data.csv")
    df.to_csv(export_path, index=False)

    return send_file(export_path, as_attachment=True, download_name="cleaned_data.csv")

