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

### Phase 2. Prediction

1. Envoyer un texte ou un document pretraite vers `POST /predict`
2. Charger le modele sauvegarde
3. Retourner la classe predite et le score

## Dataset minimal attendu

Le fichier CSV doit contenir au minimum :

- `label`
- et au moins une source parmi `text`, `ocr_text`, `document_path`, `image_path`

Exemple :

```csv
document_path,text,label
"docs/facture_001.pdf","Facture fournisseur mars 2026 montant 4850",facture
"docs/contrat_001.pdf","Contrat CDI responsable qualite",contrat
```

## Lancement local

```powershell
cd C:\Users\HP\Desktop\ADES_M\ml_models
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload --host 0.0.0.0 --port 8001
```

## Endpoints

- `GET /health`
- `POST /train`
- `POST /predict`

## Suite logique

Les prochaines etapes utiles seront :

1. brancher `backend` sur ce service ML
2. alimenter le training avec vos labels reels
3. remplacer le modele baseline par CamemBERT/BERT
