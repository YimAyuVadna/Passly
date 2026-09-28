"""
TicketPass — Prediction Engine

# Point 16: How Ticket Scanning Connects to ML
Workflow:
  1. Attendee scans QR code at entrance checkpoint
  2. TicketPass decodes token and validates entry
  3. Associated order details are extracted
  4. 9 features are preprocessed
  5. Decision Tree predicts: DIGITAL or PHYSICAL

# Point 17: Example Prediction
Demonstrates taking a sample validated order and returning the predicted ticket type.

# Point 18: Important Distinction: Existing System vs ML
  - Existing System (Core Software):
      QR generation, camera scanning, ticket validation, database lookups, order CRUD.
  - Machine Learning (#1 Classifier):
      Pattern learning, feature extraction, and DIGITAL vs PHYSICAL classification.
  * ML is an added intelligence layer, NOT a replacement for the ticketing engine.
"""

import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "ticket_classifier.pkl")


def load_classifier(path: str = MODEL_PATH):
    """Loads the trained Decision Tree model and metadata bundle."""
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model file not found at: {path}. Run train_model.py first.")
    return joblib.load(path)


def predict_ticket_type(order_data: dict, model_bundle: dict = None) -> dict:
    """
    Point 16 & 17: Takes validated ticket/order data and returns DIGITAL or PHYSICAL prediction.
    """
    if model_bundle is None:
        model_bundle = load_classifier()

    model = model_bundle["model"]
    feature_columns = model_bundle["feature_columns"]
    label_map = model_bundle["label_map"]
    payment_map = model_bundle.get("payment_method_map", {})
    tier_map = model_bundle.get("ticket_tier_map", {})

    # 1. Preprocess categorical values to numeric formats (Point 10)
    raw_payment = order_data.get("payment_method", 0)
    if isinstance(raw_payment, str):
        payment_method = payment_map.get(raw_payment.upper(), 0)
    else:
        payment_method = int(raw_payment)

    raw_tier = order_data.get("ticket_tier", 0)
    if isinstance(raw_tier, str):
        ticket_tier = tier_map.get(raw_tier.upper(), 0)
    else:
        ticket_tier = int(raw_tier)

    raw_notes = order_data.get("has_notes", 0)
    if isinstance(raw_notes, str):
        has_notes = 1 if raw_notes.strip().lower() in ["1", "true", "yes"] else 0
    else:
        has_notes = 1 if bool(raw_notes) else 0

    unit_price = float(order_data.get("unit_price", 15.0))
    quantity = int(order_data.get("quantity", 1))
    total_amount = float(order_data.get("total_amount", unit_price * quantity))
    hour_of_purchase = int(order_data.get("hour_of_purchase", 12))
    day_of_week = int(order_data.get("day_of_week", 0))
    time_since_purchase_hours = float(order_data.get("time_since_purchase_hours", 24.0))

    # 2. Build feature dictionary ordered exactly by feature_columns (Point 8)
    row = {
        "payment_method": payment_method,
        "unit_price": unit_price,
        "quantity": quantity,
        "total_amount": total_amount,
        "hour_of_purchase": hour_of_purchase,
        "day_of_week": day_of_week,
        "has_notes": has_notes,
        "ticket_tier": ticket_tier,
        "time_since_purchase_hours": time_since_purchase_hours,
    }

    df_input = pd.DataFrame([row])[feature_columns]

    # 3. Model inference (Point 6 & Point 16)
    pred_class_id = int(model.predict(df_input)[0])
    pred_label = label_map.get(pred_class_id, "UNKNOWN")

    return {
        "prediction_code": pred_class_id,
        "ticket_type": pred_label,
        "input_features": row,
    }


if __name__ == "__main__":
    print("=" * 55)
    print(" TicketPass — Predict DIGITAL or PHYSICAL")
    print("=" * 55)

    # Example 1: Digital Ticket Profile (Point 17 example)
    digital_sample = {
        "payment_method": "ABA",           # Online e-wallet (3)
        "unit_price": 15.0,
        "quantity": 1,
        "total_amount": 15.0,
        "hour_of_purchase": 14,
        "day_of_week": 0,                  # Monday
        "has_notes": "No",                 # 0
        "ticket_tier": "VIP",              # 2
        "time_since_purchase_hours": 48.0, # Booked 2 days in advance
    }

    result1 = predict_ticket_type(digital_sample)
    print(f"\n[Sample 1] Scanned Ticket Order:")
    print(f"  Payment: {digital_sample['payment_method']} | Tier: {digital_sample['ticket_tier']} | Lead Time: {digital_sample['time_since_purchase_hours']}h")
    print(f"  Predicted Ticket Type: >>> {result1['ticket_type']} <<< (Code: {result1['prediction_code']})")

    # Example 2: Physical Ticket Profile
    physical_sample = {
        "payment_method": "CASH",          # Cash at counter (0)
        "unit_price": 20.0,
        "quantity": 2,
        "total_amount": 40.0,
        "hour_of_purchase": 17,            # 5 PM walk-in
        "day_of_week": 5,                  # Saturday
        "has_notes": "Yes",                # Printed badge requested (1)
        "ticket_tier": "GA",               # General admission (0)
        "time_since_purchase_hours": 1.5,  # Bought 1.5 hours before event
    }

    result2 = predict_ticket_type(physical_sample)
    print(f"\n[Sample 2] Scanned Ticket Order:")
    print(f"  Payment: {physical_sample['payment_method']} | Tier: {physical_sample['ticket_tier']} | Lead Time: {physical_sample['time_since_purchase_hours']}h")
    print(f"  Predicted Ticket Type: >>> {result2['ticket_type']} <<< (Code: {result2['prediction_code']})")
    print("=" * 55)
