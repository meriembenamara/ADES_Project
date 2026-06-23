# ML Models

Ce module regroupe la partie machine learning du projet ADES, separee du `frontend` et du `backend`.

## Objectif

Le dossier `ml_models` couvre les deux phases du workflow PFE :

1. Construction et entrainement du modele
2. Prediction / utilisation du modele

## Structure

- `api/` : endpoints HTTP pour entrainement, prediction et health check
- `src/config/` : configuration centrale
- `src/ocr/` : extraction de texte depuis document/image
- `src/preprocessing/` : nettoyage et normalisation
- `src/augmentation/` : generation de donnees synthetiques
- `src/feature_engineering/` : tokenisation / vectorisation / embeddings
- `src/training/` : orchestration de l'entrainement
- `src/evaluation/` : accuracy, precision, recall, f1-score
- `src/inference/` : chargement modele et prediction
- `src/common/` : utilitaires partages
- `data/` : jeux de donnees d'entrainement
- `artifacts/` : modele entraine et metadata
- `logs/` : journaux applicatifs

## Workflow cible

### Phase 1. Entrainement

1. Document PDF / image
2. Labeling human-in-the-loop
3. OCR
4. Pretraitement texte
5. Generation de donnees synthetiques
6. Data augmentation
7. Dataset final
8. Feature engineering
9. Entrainement du modele
10. Evaluation
11. Sauvegarde du modele pret

Les donnees d'entrainement peuvent venir de deux sources :

- un fichier CSV local
- les annotations sauvegardees dans le backend Laravel

### Phase 2. Prediction

1. Envoyer un texte ou un document pretraite vers `POST /predict`
2. Charger le modele sauvegarde
3. Retourner les paires `attribute_name` / `attribute_value` extraites avec leur confiance

## Dataset minimal attendu

Pour un entrainement de classification :

- `label`
- et au moins une source parmi `text`, `ocr_text`, `document_path`, `image_path`

Exemple :

```csv
document_path,text,label
"docs/facture_001.pdf","Facture fournisseur mars 2026 montant 4850",facture
"docs/contrat_001.pdf","Contrat CDI responsable qualite",contrat
```

Pour un entrainement d'extraction :

- `attribute_name`
- `attribute_value`
- et au moins une source parmi `text`, `ocr_text`, `document_path`, `image_path`

Exemple :

```csv
document_path,text,attribute_name,attribute_value
"docs/facture_001.pdf","Facture fournisseur mars 2026 montant 4850","Montant","4850"
"docs/facture_001.pdf","Facture fournisseur mars 2026 montant 4850","Date","mars 2026"
```

## Lancement local

```powershell
cd C:\Users\HP\Desktop\ADES_M\ml_models
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload --host 0.0.0.0 --port 8001
```

> Note: le pipeline OCR utilise `pytesseract`, `easyocr`, `Pillow` et `pdf2image`.
> Si vous utilisez les fichiers PDF, installez aussi Poppler sur Windows et assurez-vous que `tesseract` est disponible dans le PATH.

## Endpoints

- `GET /health`
- `POST /train`
- `POST /predict`

### Train depuis le backend

Vous pouvez entrainer directement depuis les annotations du backend :

```json
{
  "data_source": "backend",
  "backend_api_url": "http://127.0.0.1:8000/api/labelings/export",
  "backend_token": "VOTRE_TOKEN"
}
```

### Integration avec le backend Laravel

Le backend expose déjà l’endpoint sécurisé :

- `GET /api/labelings/export`

Il renvoie les annotations avec : `document_path`, `text`, `ocr_text`, `label`, `class_key`, `category_key`.

La pipeline ML récupère ces données, applique une vraie étape OCR sur le document/image, nettoie le texte, génère des exemples synthétiques, puis entraine un modèle CamemBERT.

## Suite logique

Les prochaines etapes utiles seront :

1. brancher `backend` sur ce service ML
2. alimenter le training avec vos labels reels
3. remplacer le modele baseline par CamemBERT/BERT
