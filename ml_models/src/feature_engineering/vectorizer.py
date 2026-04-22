from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


def build_training_pipeline() -> Pipeline:
    return Pipeline(
        steps=[
            ("vectorizer", TfidfVectorizer(ngram_range=(1, 2), max_features=5000)),
            ("classifier", LogisticRegression(max_iter=1000)),
        ]
    )
