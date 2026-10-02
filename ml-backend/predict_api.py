"""
Phase 3 - Prediction API
--------------------------------------------------------------------
Flask API that loads the trained Decision Tree model
(ticket_classifier.pkl) and returns a DIGITAL / PHYSICAL prediction
for a given ticket/order, applying the SAME preprocessing that was
used during training.

Run:
    python predict_api.py

Then POST to http://localhost:5000/predict
--------------------------------------------------------------------
"""

import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ticket_classifier.pkl")

payload = joblib.load(MODEL_PATH)
model = payload["model"]
FEATURE_COLUMNS = payload["feature_columns"]
LABEL_MAP = payload["label_map"]

# ---------------------------------------------------------------
# ⚠️ ACTION NEEDED — categorical encoding maps
#
# training_data.csv already stores payment_method / ticket_tier /
# day_of_week as integers (0,1,2,3...), but the mapping from the
# ORIGINAL category name (e.g. "ABA", "VIP") to that integer was not
# saved anywhere in ticket_classifier.pkl or train_model.py.
#
# The values below are PLACEHOLDERS in the order they first appear
# in training_data.csv. You must replace them with whatever mapping
# was actually used when the CSV was generated (check whatever
# script/notebook created training_data.csv, or a saved
# LabelEncoder, if either still exists). Getting this wrong means
# every prediction the API makes will be silently wrong.
# ---------------------------------------------------------------
PAYMENT_METHOD_MAP = {
    "CASH": 0,    # <-- confirm against your real encoding
    "CARD": 1,    # <-- confirm
    "ABA": 2,     # <-- confirm
    "WING": 3,    # <-- confirm
}

TICKET_TIER_MAP = {
    "REGULAR": 0,  # <-- confirm
    "VIP": 1,      # <-- confirm
    "VVIP": 2,     # <-- confirm
}

DAY_OF_WEEK_MAP = {
    "MONDAY": 0, "TUESDAY": 1, "WEDNESDAY": 2, "THURSDAY": 3,
    "FRIDAY": 4, "SATURDAY": 5, "SUNDAY": 6,
}

REQUIRED_FIELDS = [
    "payment_method", "unit_price", "quantity", "total_amount",
    "hour_of_purchase", "day_of_week", "ticket_tier",
    "time_since_purchase_hours",
]

app = Flask(__name__)


def _encode(value, mapping, field_name):
    """Accept either the already-encoded integer or the human-readable
    category name, and return the integer the model expects."""
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return int(value)
    key = str(value).strip().upper()
    if key not in mapping:
        raise ValueError(
            f"Unknown {field_name}: {value!r}. Expected one of {list(mapping)} "
            f"or an already-encoded integer."
        )
    return mapping[key]


def build_feature_row(data: dict) -> pd.DataFrame:
    row = {
        "payment_method": _encode(data["payment_method"], PAYMENT_METHOD_MAP, "payment_method"),
        "unit_price": float(data["unit_price"]),
        "quantity": int(data["quantity"]),
        "total_amount": float(data["total_amount"]),
        "hour_of_purchase": int(data["hour_of_purchase"]),
        "day_of_week": _encode(data["day_of_week"], DAY_OF_WEEK_MAP, "day_of_week"),
        "has_notes": int(bool(data.get("has_notes", False))),
        "ticket_tier": _encode(data["ticket_tier"], TICKET_TIER_MAP, "ticket_tier"),
        "time_since_purchase_hours": float(data["time_since_purchase_hours"]),
    }
    # Order columns exactly as the model was trained on
    return pd.DataFrame([[row[c] for c in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "features": FEATURE_COLUMNS})


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    missing = [f for f in REQUIRED_FIELDS if f not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {missing}"}), 400

    try:
        features_df = build_feature_row(data)
    except (ValueError, KeyError, TypeError) as e:
        return jsonify({"error": str(e)}), 400

    prediction = model.predict(features_df)[0]
    probabilities = model.predict_proba(features_df)[0]

    return jsonify({
        "ticket_type": LABEL_MAP[int(prediction)],
        "confidence": round(float(max(probabilities)), 4),
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
