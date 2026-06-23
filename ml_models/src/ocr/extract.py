from pathlib import Path
import logging

import numpy as np
import pandas as pd
from PIL import Image

try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    pytesseract = None
    PYTESSERACT_AVAILABLE = False

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    easyocr = None
    EASYOCR_AVAILABLE = False

try:
    from pdf2image import convert_from_path
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    convert_from_path = None
    PDF2IMAGE_AVAILABLE = False


OCR_IMAGE_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".tiff",
    ".bmp",
    ".gif"
}

OCR_PDF_EXTENSIONS = {".pdf"}

logger = logging.getLogger(__name__)


def _get_easyocr_reader():
    """
    Initialise EasyOCR reader.
    """

    if not EASYOCR_AVAILABLE:
        return None

    try:
        return easyocr.Reader(
            ["fr", "en"],
            gpu=False
        )

    except Exception as exc:
        logger.warning(
            "EasyOCR init failed: %s",
            exc
        )

        return None


def _extract_text_from_pil_image(
    image: Image.Image
) -> str:
    """
    Extract text from a PIL image.
    """

    try:
        image = image.convert("RGB")

        reader = _get_easyocr_reader()

        # -------------------------------
        # EasyOCR
        # -------------------------------
        if reader is not None:

            result = reader.readtext(
                np.array(image),
                detail=0,
                paragraph=True
            )

            text = " ".join(result).strip()

            if text:
                return text

        # -------------------------------
        # Fallback: pytesseract
        # -------------------------------
        if PYTESSERACT_AVAILABLE:

            return pytesseract.image_to_string(
                image,
                lang="fra+eng"
            ).strip()

        return ""

    except Exception as exc:

        logger.warning(
            "OCR extraction failed: %s",
            exc
        )

        return ""


def _extract_text_from_image(
    path: Path
) -> str:
    """
    Extract text from image file path.
    """

    try:
        image = Image.open(path)

        return _extract_text_from_pil_image(
            image
        )

    except Exception as exc:

        logger.warning(
            "OCR extraction failed for image %s: %s",
            path,
            exc
        )

        return ""


def _extract_text_from_pdf(
    path: Path
) -> str:
    """
    Extract text from PDF file.
    """

    if not PDF2IMAGE_AVAILABLE:

        logger.warning(
            "pdf2image is not installed, cannot extract text from PDF %s",
            path
        )

        return ""

    try:

        # Convert PDF pages to PIL images
        pages = convert_from_path(
            str(path),
            dpi=200
        )

        page_texts = []

        for page in pages:

            if page is not None:

                text = _extract_text_from_pil_image(
                    page
                )

                if text:
                    page_texts.append(text)

        return " ".join(page_texts).strip()

    except Exception as exc:

        logger.warning(
            "PDF OCR extraction failed for %s: %s",
            path,
            exc
        )

        return ""


def _extract_text_from_path(
    source_path: str
) -> str:
    """
    Detect file type and extract text.
    """

    if not source_path:
        return ""

    location = Path(source_path)

    if not location.exists():

        logger.warning(
            "File does not exist: %s",
            source_path
        )

        return ""

    suffix = location.suffix.lower()

    # -------------------------------
    # Image OCR
    # -------------------------------
    if suffix in OCR_IMAGE_EXTENSIONS:

        return _extract_text_from_image(
            location
        )

    # -------------------------------
    # PDF OCR
    # -------------------------------
    if suffix in OCR_PDF_EXTENSIONS:

        return _extract_text_from_pdf(
            location
        )

    logger.warning(
        "Unsupported file type: %s",
        suffix
    )

    return ""


def _normalize_text_value(value) -> str:
    if value is None or pd.isna(value):
        return ""

    return str(value).strip()


def run_ocr_stage(
    dataframe: pd.DataFrame
) -> pd.DataFrame:
    """
    Run OCR pipeline on dataframe.
    """

    records = []

    for _, row in dataframe.iterrows():

        # Existing text
        ocr_text_value = _normalize_text_value(row.get("ocr_text"))
        text_value = _normalize_text_value(row.get("text"))

        text_source = ocr_text_value or text_value

        # File path
        document_path_value = _normalize_text_value(row.get("document_path"))
        image_path_value = _normalize_text_value(row.get("image_path"))

        document_path = document_path_value or image_path_value

        # Run OCR if text missing
        if not text_source and document_path:

            text_source = _extract_text_from_path(
                document_path
            )

        # Save result
        records.append({
            **row.to_dict(),
            "ocr_text": text_source
        })

    return pd.DataFrame(records)

