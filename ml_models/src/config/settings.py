from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
LOGS_DIR = BASE_DIR / "logs"

CAMEMBERT_MODEL_NAME = "camembert-base"
MAX_SEQUENCE_LENGTH = 256
TRAIN_BATCH_SIZE = 4
EVAL_BATCH_SIZE = 4
TRAIN_EPOCHS = 2

MODEL_DIR = ARTIFACTS_DIR / "camembert_model"
LABELS_FILE = ARTIFACTS_DIR / "labels.json"
FIELDS_FILE = ARTIFACTS_DIR / "fields.json"
METADATA_FILE = ARTIFACTS_DIR / "metadata.json"
RAW_DATASET_FILE = ARTIFACTS_DIR / "raw_dataset.csv"
FINAL_DATASET_FILE = ARTIFACTS_DIR / "final_dataset.csv"
DEFAULT_DATASET = DATA_DIR / "documents.csv"
