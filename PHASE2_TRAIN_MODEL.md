# Phase 2 — Train the Model

**Goal:** Train and evaluate a Decision Tree classifier on `training_data.csv` that predicts whether a ticket will be `DIGITAL` (0) or `PHYSICAL` (1), then save it as `ticket_classifier.pkl` for the Phase 3 API to load.

---

## 1. Current State (from the repo)

| Item | Status |
|---|---|
| `ml-backend/data/training_data.csv` | ✅ Exists — 600 rows, 10 columns, already numeric/encoded |
| `ml-backend/requirements.txt` | ✅ Has `scikit-learn`, `pandas`, `numpy`, `joblib`, `matplotlib` |
| `ml-backend/train_model.py` | ❌ Missing — this phase creates it |
| `ml-backend/ticket_classifier.pkl` | ❌ Missing — produced by running the script |

### Dataset snapshot

- **Rows:** 600
- **Class balance:** `label` 0 (Digital) = 431 rows (71.8%), `label` 1 (Physical) = 169 rows (28.2%) → moderately imbalanced, so evaluate with more than just accuracy.
- **Columns:**

| Column | Type | Meaning |
|---|---|---|
| `payment_method` | int (0–3) | Encoded payment channel |
| `unit_price` | float | Price per ticket |
| `quantity` | int | Number of tickets in the order |
| `total_amount` | float | `unit_price * quantity` |
| `hour_of_purchase` | int (0–23) | Hour the order was placed |
| `day_of_week` | int (0–6) | Day the order was placed |
| `has_notes` | int (0/1) | Whether the order has special notes (e.g. "please have physical ticket ready") |
| `ticket_tier` | int (0–2) | Encoded ticket tier (GA/Early Bird/VIP) |
| `time_since_purchase_hours` | float | Hours between purchase and event |
| `label` | int (0/1) | **Target** — 0 = Digital, 1 = Physical |

All feature columns are already numeric — no additional encoding step is required before training.

---

## 2. Steps to Finish Phase 2

1. **Load the data** from `data/training_data.csv` with pandas.
2. **Split features/target:** `X` = all columns except `label`, `y` = `label`.
3. **Train/test split:** 80/20, `stratify=y` (important given the 72/28 class imbalance), fixed `random_state` for reproducibility.
4. **Train a `DecisionTreeClassifier`** (scikit-learn). Constrain depth (e.g. `max_depth=6`) and set `class_weight="balanced"` to keep it from just always predicting the majority class (Digital).
5. **Evaluate** on the held-out test set:
   - Accuracy
   - Precision / Recall / F1 (per class, since it's imbalanced)
   - Confusion matrix
   - Feature importances (useful to sanity-check the model, e.g. `has_notes` and `time_since_purchase_hours` should matter most)
6. **Save the trained model** to `ticket_classifier.pkl` with `joblib`, alongside the exact list of feature column names (so Phase 3's API knows the expected input order).
7. **Print a short report** to the console so Phase 2 can be verified by re-running the script.

---

## 3. `train_model.py` (ready to drop into `ml-backend/`)

```python
"""
Phase 2 - Train the Model
Trains a Decision Tree classifier to predict DIGITAL (0) vs PHYSICAL (1)
ticket preference, evaluates it, and saves it as ticket_classifier.pkl
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

DATA_PATH = os.path.join("data", "training_data.csv")
MODEL_PATH = "ticket_classifier.pkl"
LABEL_MAP = {0: "DIGITAL", 1: "PHYSICAL"}


def load_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    if "label" not in df.columns:
        raise ValueError("Expected a 'label' column in training_data.csv")
    return df


def train_and_evaluate(df: pd.DataFrame):
    feature_cols = [c for c in df.columns if c != "label"]
    X = df[feature_cols]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = DecisionTreeClassifier(
        max_depth=6,
        min_samples_leaf=5,
        class_weight="balanced",
        random_state=42,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    print("=" * 55)
    print(" Member 2: Model Training & Evaluation")
    print("=" * 55)
    print(f" Train rows: {len(X_train)}   Test rows: {len(X_test)}")
    print(f" Accuracy:   {accuracy_score(y_test, y_pred):.4f}")
    print("\n Classification report:")
    print(classification_report(y_test, y_pred, target_names=["DIGITAL", "PHYSICAL"]))
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


def save_model(model, feature_cols, path: str):
    payload = {
        "model": model,
        "feature_columns": feature_cols,
        "label_map": LABEL_MAP,
    }
    joblib.dump(payload, path)
    print(f"\n Model saved to: {path}")


if __name__ == "__main__":
    df = load_data(DATA_PATH)
    model, feature_cols = train_and_evaluate(df)
    save_model(model, feature_cols, MODEL_PATH)
```

### Why these choices

- **`joblib.dump` a dict, not just the model** — bundling `feature_columns` and `label_map` with the model means the Phase 3 API can validate/order incoming JSON fields and map `0/1` back to `"DIGITAL"/"PHYSICAL"` without hardcoding that logic twice.
- **`stratify=y` in the split** — keeps the 72/28 class ratio consistent in train and test sets.
- **`class_weight="balanced"`** — without it, a shallow tree could get ~72% accuracy by just always predicting "Digital"; this forces it to actually learn the Physical-ticket pattern.
- **`max_depth=6`, `min_samples_leaf=5`** — light regularization so the tree doesn't overfit to noise in a 600-row dataset.

---

## 4. How to Run It

```bash
cd ml-backend
pip install -r requirements.txt
python train_model.py
```

Expected output: training/test row counts, accuracy, a classification report, a confusion matrix, feature importances, and confirmation that `ticket_classifier.pkl` was saved in `ml-backend/`.

---

## 5. Definition of Done for Phase 2

- [ ] `ml-backend/train_model.py` created
- [ ] Script runs end-to-end without errors on `data/training_data.csv`
- [ ] Console output shows accuracy + classification report + confusion matrix
- [ ] `ml-backend/ticket_classifier.pkl` is generated
- [ ] Feature importances reviewed to sanity-check the model makes sense (e.g. `has_notes`, `time_since_purchase_hours`, `payment_method` should rank high — these were the strongest signals baked into `generate_training_data.py`)

Once this is checked off, Phase 3 (Prediction API) can `joblib.load("ticket_classifier.pkl")`, pull out `model` + `feature_columns`, and serve predictions.
