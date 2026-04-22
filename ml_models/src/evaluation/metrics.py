from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score


def compute_classification_metrics(y_true, y_pred) -> dict[str, float]:
    return {
        "accuracy": float(round(accuracy_score(y_true, y_pred), 4)),
        "precision": float(round(precision_score(y_true, y_pred, average="weighted", zero_division=0), 4)),
        "recall": float(round(recall_score(y_true, y_pred, average="weighted", zero_division=0), 4)),
        "f1_score": float(round(f1_score(y_true, y_pred, average="weighted", zero_division=0), 4)),
    }
