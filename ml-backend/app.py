"""
TicketPass — Python ML Backend API

# Point 19: Backend Architecture
React Frontend / Checkpoint Scanner
        ↓  REST JSON request
TicketPass Backend / API Layer
        ↓  Ticket/Order attributes
Python ML Backend (app.py : port 5000)
        ↓  Loads ticket_classifier.pkl
Decision Tree Model
        ↓  Inference
{"ticket_type": "DIGITAL", "prediction_code": 0}

# Point 20: Development Phase 3 — Prediction API
Provides a live POST /predict HTTP endpoint for ticket validation.
"""

import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from predict import load_classifier, predict_ticket_type

PORT = 5000
model_bundle = None


class MLPredictionHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        # Health check endpoint
        if self.path == "/" or self.path == "/health":
            self.send_response(200)
            self._set_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            response = {
                "status": "online",
                "service": "Passly ML #1 Decision Tree Backend",
                "version": "1.0.0",
                "endpoints": {
                    "POST /predict": "Send JSON order features to predict DIGITAL vs PHYSICAL",
                    "GET /predict": "Interactive browser testing UI"
                }
            }
            self.wfile.write(json.dumps(response).encode("utf-8"))
        elif self.path.startswith("/predict"):
            # Interactive web tester UI for browsers
            self.send_response(200)
            self._set_cors_headers()
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>TicketPass ML #1 Prediction Tester</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; margin: 0; }
        .container { max-width: 650px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
        h1 { margin-top: 0; font-size: 24px; color: #38bdf8; display: flex; align-items: center; gap: 8px; }
        p { color: #94a3b8; font-size: 14px; line-height: 1.5; }
        .badge { display: inline-block; background: #0284c7; color: white; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
        .btn-group { display: flex; gap: 12px; margin: 20px 0; }
        button { flex: 1; padding: 12px 16px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 14px; }
        .btn-digital { background: #0ea5e9; color: white; }
        .btn-digital:hover { background: #0284c7; }
        .btn-physical { background: #f59e0b; color: white; }
        .btn-physical:hover { background: #d97706; }
        pre { background: #0b1120; padding: 16px; border-radius: 8px; font-size: 13px; color: #e2e8f0; overflow-x: auto; border: 1px solid #1e293b; }
        #result-box { margin-top: 20px; padding: 16px; border-radius: 8px; display: none; }
        .res-digital { background: rgba(14, 165, 233, 0.15); border: 1px solid #0ea5e9; color: #38bdf8; }
        .res-physical { background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #fbbf24; }
        .res-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎟️ TicketPass ML #1 <span class="badge">Decision Tree</span></h1>
        <p>This API receives ticket/order attributes and predicts whether the pass is <strong>DIGITAL (0)</strong> or <strong>PHYSICAL (1)</strong>.</p>
        
        <div class="btn-group">
            <button class="btn-digital" onclick="sendTest('digital')">Test Sample 1: Digital (Online ABA)</button>
            <button class="btn-physical" onclick="sendTest('physical')">Test Sample 2: Physical (Cash Walk-in)</button>
        </div>

        <div id="result-box">
            <div id="result-title" class="res-title"></div>
            <div id="result-detail" style="font-size: 13px; opacity: 0.9;"></div>
        </div>

        <p style="margin-top: 24px; font-weight: 600; color: #cbd5e1;">Request Payload Preview:</p>
        <pre id="payload-preview">// Click a test button above to send a live POST request</pre>
    </div>

    <script>
        const samples = {
            digital: {
                payment_method: "ABA",
                unit_price: 15.0,
                quantity: 1,
                total_amount: 15.0,
                hour_of_purchase: 14,
                day_of_week: 0,
                has_notes: "No",
                ticket_tier: "VIP",
                time_since_purchase_hours: 48.0
            },
            physical: {
                payment_method: "CASH",
                unit_price: 20.0,
                quantity: 2,
                total_amount: 40.0,
                hour_of_purchase: 17,
                day_of_week: 5,
                has_notes: "Yes",
                ticket_tier: "GA",
                time_since_purchase_hours: 1.5
            }
        };

        async function sendTest(type) {
            const data = samples[type];
            document.getElementById('payload-preview').textContent = JSON.stringify(data, null, 2);

            try {
                const res = await fetch('/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const json = await res.json();
                
                const box = document.getElementById('result-box');
                const title = document.getElementById('result-title');
                const detail = document.getElementById('result-detail');

                box.style.display = 'block';
                box.className = json.ticket_type === 'DIGITAL' ? 'res-digital' : 'res-physical';
                title.textContent = 'Predicted: ' + json.ticket_type + ' (Code: ' + json.prediction_code + ')';
                detail.textContent = 'Status: ' + json.status + ' • Evaluated by DecisionTreeClassifier';
            } catch (err) {
                alert('Request failed: ' + err);
            }
        }
    </script>
</body>
</html>"""
            self.wfile.write(html.encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/predict":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)

            try:
                data = json.loads(body.decode("utf-8"))
                result = predict_ticket_type(data, model_bundle)
                self.send_response(200)
                self._set_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                response = {
                    "status": "success",
                    "ticket_type": result["ticket_type"],
                    "prediction_code": result["prediction_code"],
                    "confidence": result.get("confidence", 0.95),
                    "input_features": result.get("input_features", {}),
                }
                self.wfile.write(json.dumps(response).encode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self._set_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                error_response = {
                    "status": "error",
                    "message": str(e)
                }
                self.wfile.write(json.dumps(error_response).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()


def run_server(port=PORT):
    global model_bundle
    print("=" * 55)
    print(" TicketPass — Point 19 & 20: ML Backend Server")
    print("=" * 55)
    print(" Loading trained model (ticket_classifier.pkl)...")
    model_bundle = load_classifier()
    print(" Model loaded successfully!")

    server_address = ("", port)
    httpd = HTTPServer(server_address, MLPredictionHandler)
    print(f" ML Prediction API running at: http://localhost:{port}")
    print(f" Ready to accept POST requests at: http://localhost:{port}/predict")
    print("=" * 55)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n Shutting down ML server.")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
