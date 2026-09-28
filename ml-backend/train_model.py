"""
TicketPass — Machine Learning Implementation

# Point 3: ML #1 — Decision Tree Ticket Type Classifier
# Point 3.1: Purpose
The purpose of ML #1 is to predict the ticket type:
  - DIGITAL (0)
  - PHYSICAL (1)

# Point 15: Training Script Responsibilities
This script (train_model.py) fulfills the 8 core training tasks:
  1. Load the training dataset (data/training_data.csv)
  2. Prepare the 9 input features (X)
  3. Prepare the target label (y = 0/1)
  4. Preprocess categorical data (payment_method, ticket_tier, has_notes)
  5. Split the dataset into training (80%) and testing (20%) sets
  6. Train the Decision Tree classifier
  7. Evaluate the model (accuracy, classification report, confusion matrix)
  8. Save the trained model and metadata (ticket_classifier.pkl)
"""

import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

# Resolve paths relative to script location
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "training_data.csv")
MODEL_PATH = os.path.join(BASE_DIR, "ticket_classifier.pkl")

# Point 3.1 & Point 5: Binary Classification Task
# Classification means predicting a discrete category/class rather than a continuous number (e.g. not $15.72).
# Because there are exactly two target classes, this is a Binary Classification problem:
#   - Class 0: DIGITAL
#   - Class 1: PHYSICAL
LABEL_MAP = {
    0: "DIGITAL",
    1: "PHYSICAL"
}


# Point 10: Data Preprocessing
# Categorical string-to-numeric mappings
PAYMENT_METHOD_MAP = {
    "CASH": 0,
    "COUNTER": 1,
    "CARD": 2,
    "ABA": 3,
}

TICKET_TIER_MAP = {
    "GA": 0,
    "EARLY_BIRD": 1,
    "VIP": 2,
}


def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """Preprocesses raw ticket/order data, encoding categorical values to numeric formats."""
    df = df.copy()
    if df["payment_method"].dtype == object:
        df["payment_method"] = df["payment_method"].str.upper().map(PAYMENT_METHOD_MAP).fillna(0).astype(int)
    if df["ticket_tier"].dtype == object:
        df["ticket_tier"] = df["ticket_tier"].str.upper().map(TICKET_TIER_MAP).fillna(0).astype(int)
    if "has_notes" in df.columns and df["has_notes"].dtype == object:
        df["has_notes"] = df["has_notes"].apply(lambda v: 1 if str(v).strip().lower() in ["1", "true", "yes"] else 0)
    return df


def load_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    if "label" not in df.columns:
        raise ValueError("Expected a 'label' column in training_data.csv")
    return preprocess_data(df)


def train_and_evaluate(df: pd.DataFrame):
    # Point 4: Supervised Learning — Separate Features (X) and Ground-Truth Labels (y)
    # The Decision Tree learns to map: Features (X) -> Ticket Type Label (y).
    #
    # Point 8: Input Features (9 order attributes used to detect patterns)
    #   1. payment_method           - Encoded payment channel (0-3)
    #   2. unit_price               - Price of one ticket in USD
    #   3. quantity                 - Number of tickets in order (1-6)
    #   4. total_amount             - Total order value (unit_price * quantity)
    #   5. hour_of_purchase         - Hour order was placed (0-23)
    #   6. day_of_week              - Day order was placed (0-6, Mon-Sun)
    #   7. has_notes                - Whether order has special notes (0/1)
    #   8. ticket_tier              - Ticket tier: GA(0), EarlyBird(1), VIP(2)
    #   9. time_since_purchase_hours - Hours between purchase & event (lead time)
    feature_cols = [c for c in df.columns if c != "label"]
    X = df[feature_cols]
    y = df["label"]

    # Point 11: Training Process — 80/20 Train/Test Split
    #   - 80% (480 rows): Training data used to TEACH the Decision Tree
    #   - 20% (120 rows): Testing data held out to TEST accuracy on unseen data
    #   - stratify=y: Preserves the 72% Digital / 28% Physical class ratio
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Point 6 & Point 12: Decision Tree Configuration (Hyperparameters)
    #   - max_depth=6: Limits tree levels to avoid overfitting / memorizing training noise.
    #   - min_samples_leaf=5: Requires at least 5 samples per rule, preventing outlier rules.
    #   - class_weight="balanced": Adjusts weights to handle the 72/28 class imbalance.
    #   - random_state=42: Ensures reproducible training runs.
    model = DecisionTreeClassifier(
        max_depth=6,
        min_samples_leaf=5,
        class_weight="balanced",
        random_state=42,
    )
    model.fit(X_train, y_train)

    # Point 13: Model Evaluation (Evaluated on held-out 20% test set)
    y_pred = model.predict(X_test)

    print("=" * 55)
    print(" Member 2: Model Training & Evaluation")
    print("=" * 55)
    print(f" Train rows: {len(X_train)}   Test rows: {len(X_test)}")
    # 1. Accuracy: Overall percentage of correct predictions
    print(f" Accuracy:   {accuracy_score(y_test, y_pred):.4f}")
    # 2. Precision, Recall, F1: Performance per class (Digital vs Physical)
    print("\n Classification report:")
    print(classification_report(y_test, y_pred, target_names=["DIGITAL", "PHYSICAL"]))
    # 3. Confusion Matrix: Shows correct vs confused predictions between classes
    print(" Confusion matrix (rows=actual, cols=predicted):")
    print(confusion_matrix(y_test, y_pred))

    print("\n Feature importances:")
    importances = sorted(
        zip(feature_cols, model.feature_importances_),
        key=lambda x: x[1],
        reverse=True,
    )
    for name, score in importances:
        print(f"   {name:<28} {score:.4f}")

    return model, feature_cols


# Point 14: Model File (ticket_classifier.pkl)
# Saves the trained model using joblib serialization.
# This eliminates the need to retrain the model on every incoming ticket scan.
# Bundles the model, expected feature column order, label map, and preprocessing maps.
def save_model(model, feature_cols, path: str):
    payload = {
        "model": model,
        "feature_columns": feature_cols,
        "label_map": LABEL_MAP,
        "payment_method_map": PAYMENT_METHOD_MAP,
        "ticket_tier_map": TICKET_TIER_MAP,
    }
    joblib.dump(payload, path)
    print(f"\n Model saved to: {path}")


if __name__ == "__main__":
    # Point 11: Complete Training Pipeline Flow
    # 1. Load CSV -> 2. Preprocess Data -> 3. Split Features & Label
    # 4. 80/20 Train/Test Split -> 5. Fit Decision Tree -> 6. Evaluate -> 7. Save Model
    df = load_data(DATA_PATH)
    model, feature_cols = train_and_evaluate(df)
    save_model(model, feature_cols, MODEL_PATH)
