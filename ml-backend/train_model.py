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
from sklearn.tree import export_text, plot_tree
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend (no GUI window needed)
import matplotlib.pyplot as plt

# Resolve paths relative to script location
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "training_data.csv")
MODEL_PATH = os.path.join(BASE_DIR, "models", "ticket_classifier.pkl")

LABEL_MAP = {
    0: "DIGITAL",
    1: "PHYSICAL"
}

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


def visualize_tree(model, feature_cols, output_path: str = None):
    """Generates a text-based and visual representation of the trained Decision Tree."""
    if output_path is None:
        output_path = os.path.join(BASE_DIR, "outputs", "decision_tree_visual.png")

    # Text-based tree (console-friendly)
    print("\n" + "=" * 55)
    print(" Decision Tree Structure (Text)")
    print("=" * 55)
    tree_text = export_text(
        model,
        feature_names=feature_cols,
    )
    print(tree_text)

    # Visual tree diagram (saved as PNG image)
    plt.figure(figsize=(24, 12))
    plot_tree(
        model,
        feature_names=feature_cols,
        class_names=["DIGITAL", "PHYSICAL"],
        filled=True,
        rounded=True,
        fontsize=8,
        proportion=True,
    )
    plt.title(
        "TicketPass Decision Tree — ML #1 Ticket Type Classifier",
        fontsize=16,
        fontweight="bold",
        pad=20,
    )
    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f" Decision tree visualization saved to: {output_path}")


if __name__ == "__main__":
    df = load_data(DATA_PATH)
    model, feature_cols = train_and_evaluate(df)
    save_model(model, feature_cols, MODEL_PATH)
    visualize_tree(model, feature_cols)
