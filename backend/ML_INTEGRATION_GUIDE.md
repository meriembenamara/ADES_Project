# Intégration ML-Backend - Guide Complet

## Vue d'ensemble

L'intégration ML-Backend permet à votre application ADES de:
1. **Collecter des annotations** (labels) depuis l'interface utilisateur
2. **Exporter les données** de façon structurée pour l'entraînement
3. **Déclencher l'entraînement** des modèles ML via le backend
4. **Suivre les sessions** d'entraînement en base de données
5. **Utiliser les modèles** pour faire des prédictions automatiques

## Architecture complète

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (React)                           │
│  - Upload documents (PDF, images)                            │
│  - Créer annotations (labels, attributs)                     │
│  - Déclencher entraînement                                   │
│  - Afficher résultats de prédiction                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend Laravel (Port 8000)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Endpoints API                                        │   │
│  │ - POST /api/documents (upload)                       │   │
│  │ - POST /api/labelings (créer annotations)            │   │
│  │ - GET /api/labelings/export (exporter pour ML)       │   │
│  │ - POST /api/ml/train (démarrer entraînement)         │   │
│  │ - GET /api/ml/trainings (lister sessions)            │   │
│  │ - POST /api/ml/predict (faire prédiction)            │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Base de données MySQL                                │   │
│  │ - documents (fichiers uploadés)                      │   │
│  │ - labelings (annotations utilisateur)                │   │
│  │ - ml_trainings (sessions d'entraînement)             │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           Service ML (FastAPI - Port 8001)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Pipeline d'entraînement                              │   │
│  │ 1. Récupère les données via /api/labelings/export    │   │
│  │ 2. Exécute OCR sur les documents                     │   │
│  │ 3. Prétraite le texte                                │   │
│  │ 4. Génère données synthétiques                       │   │
│  │ 5. Entraîne le modèle CamemBERT                      │   │
│  │ 6. Évalue les performances                           │   │
│  │ 7. Retourne les métriques au backend                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Endpoints                                            │   │
│  │ - POST /train (démarrer entraînement)                │   │
│  │ - POST /predict (faire prédiction)                   │   │
│  │ - GET /health (vérifier santé)                       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Stockage des modèles                                 │   │
│  │ - artifacts/classification_model/                    │   │
│  │ - artifacts/extraction_model/                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Composants créés

### 1. Contrôleur MLTrainingController
- **Fichier**: `app/Http/Controllers/Api/MLTrainingController.php`
- **Responsabilités**:
  - Valider les requêtes d'entraînement
  - Créer des sessions d'entraînement en base
  - Communiquer avec le service ML
  - Mettre à jour les statuts et métriques
  - Gérer les erreurs

### 2. Contrôleur MLPredictionController
- **Fichier**: `app/Http/Controllers/Api/MLPredictionController.php`
- **Responsabilités**:
  - Accepter du texte pour prédiction
  - Prédire depuis un document spécifique
  - Formater et retourner les résultats

### 3. Modèle Eloquent MLTraining
- **Fichier**: `app/Models/MLTraining.php`
- **Attributs**:
  - `user_id`: Qui a lancé l'entraînement
  - `model_type`: Type de modèle (classification|extraction)
  - `status`: État (pending|in_progress|completed|failed)
  - `started_at`, `completed_at`: Chronologie
  - `metrics`: Résultats JSON (accuracy, precision, recall, F1)
  - `error_message`: Message d'erreur si échoué

### 4. Job Queue TrainMLModel
- **Fichier**: `app/Jobs/TrainMLModel.php`
- **Responsabilités**:
  - Exécuter l'entraînement en arrière-plan
  - Récupérer le token pour authentifier auprès du backend
  - Appeler le service ML avec les données
  - Mettre à jour la base de données avec les résultats
  - Gérer les erreurs et relancer en cas d'échec

### 5. Routes API
- **Fichier**: `routes/api/ml-training.php`
- **Endpoints**:
  - `GET /api/ml/health` - Vérifier santé du service ML
  - `POST /api/ml/train` - Entraîner en synchrone
  - `POST /api/ml/train-async` - Entraîner en asynchrone (queue)
  - `GET /api/ml/trainings` - Lister tous les entraînements
  - `GET /api/ml/trainings/{id}` - Détails d'un entraînement
  - `POST /api/ml/predict` - Prédire depuis du texte
  - `POST /api/ml/predict/document/{id}` - Prédire depuis un document

### 6. Migration Database
- **Fichier**: `database/migrations/2026_06_10_100000_create_ml_trainings_table.php`
- **Crée**: Table `ml_trainings` avec indices optimisés

## Flux d'utilisation complet

### Étape 1: Upload document
```http
POST /api/documents
Content-Type: multipart/form-data

file=<PDF file>
title=Facture ABC
description=Facture fournisseur janvier 2026
```

Réponse:
```json
{
  "id": 1,
  "original_filename": "facture.pdf",
  "file_path": "documents/uuid.pdf",
  "created_by": 6
}
```

### Étape 2: Créer annotations
```http
POST /api/labelings
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "document_id": 1,
  "label": "facture",
  "attribute_name": "Montant",
  "attribute_value": "1500"
}
```

Répétez plusieurs fois pour créer un dataset d'entraînement.

### Étape 3: Vérifier les données
```http
GET /api/labelings/export
Authorization: Bearer TOKEN
```

Réponse:
```json
{
  "count": 45,
  "items": [
    {
      "document_id": 1,
      "document_path": "documents/uuid.pdf",
      "text": "Facture du 15 janvier...",
      "label": "facture",
      "attribute_name": "Montant",
      "attribute_value": "1500"
    }
  ]
}
```

### Étape 4: Lancer entraînement
```http
POST /api/ml/train
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "model_type": "classification",
  "description": "Entraînement initial avec 45 factures"
}
```

Réponse (en synchrone):
```json
{
  "message": "Entraînement du modèle réussi",
  "training": {
    "id": 1,
    "status": "completed",
    "metrics": {
      "accuracy": 0.92,
      "precision": 0.89,
      "recall": 0.95,
      "f1_score": 0.92
    }
  }
}
```

### Étape 5: Utiliser le modèle pour prédire
```http
POST /api/ml/predict
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "text": "Facture fournisseur janvier pour montant 2500 euros"
}
```

Réponse:
```json
{
  "message": "Prédiction réussie",
  "predictions": {
    "label": "facture",
    "confidence": 0.98
  }
}
```

## Configuration

### Variables d'environnement nécessaires
Dans `backend/.env`:

```env
# Existant
APP_URL=http://localhost:8000
APP_NAME=ADES

# Queue (pour entraînements asynchrones)
QUEUE_CONNECTION=database
```

### Configuration du service ML
Le backend accède au service ML via:
```
http://ml_models:8001
```

Cette URL est définie en dur dans les contrôleurs (const ML_SERVICE_URL).
Pour changer, modifiez les classes:
- `app/Http/Controllers/Api/MLTrainingController.php`
- `app/Http/Controllers/Api/MLPredictionController.php`
- `app/Jobs/TrainMLModel.php`

## Testing

### Script de test automatisé
```bash
bash backend/test_ml_integration.sh
```

Ce script:
1. Vérifie la connexion au backend
2. Authentifie l'utilisateur
3. Vérifie la santé du service ML
4. Récupère les labelings
5. Lance un entraînement
6. Vérifie le statut
7. Teste les prédictions

### Tests manuels avec curl

#### Santé du service
```bash
curl http://localhost:8000/api/ml/health
```

#### Lancer un entraînement
```bash
TOKEN="votre_token_api"
curl -X POST http://localhost:8000/api/ml/train \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model_type":"classification"}'
```

#### Lister les entraînements
```bash
curl http://localhost:8000/api/ml/trainings \
  -H "Authorization: Bearer $TOKEN"
```

#### Faire une prédiction
```bash
curl -X POST http://localhost:8000/api/ml/predict \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Facture du mois de janvier"}'
```

## Gestion des erreurs

### Service ML indisponible
```json
{
  "status": "unavailable",
  "service": "ml_models",
  "error": "Connection refused"
}
```
→ Vérifiez que le service ML est lancé: `docker compose logs ml_models`

### Pas de données pour l'entraînement
```json
{
  "message": "Entraînement du modèle échoué",
  "error": "Aucune annotation exploitable n'a été récupérée"
}
```
→ Créez des labelings d'abord via `POST /api/labelings`

### Token invalide
```json
{
  "message": "Unauthenticated"
}
```
→ Vérifiez votre token API et qu'il est valide

### Entraînement timeout
```json
{
  "message": "Entraînement du modèle échoué",
  "error": "ML service did not respond in time"
}
```
→ L'entraînement prend trop longtemps, utilisez `POST /api/ml/train-async` (queue)

## Prochaines étapes recommandées

### 1. Frontend Integration
Créer des composants React pour:
- Afficher le formulaire de création d'entraînement
- Afficher la progression de l'entraînement
- Afficher les métriques (accuracy, precision, recall)
- Utiliser les prédictions pour pré-remplir les formulaires

### 2. Webhooks / WebSocket
Pour notifier le frontend en temps réel:
- Status WebSocket pour suivre progression d'entraînement
- Webhooks POST quand entraînement terminé

### 3. Versioning des modèles
Garder l'historique des modèles:
- Stocker la version du modèle
- Permettre rollback à une version précédente
- Comparer métriques entre versions

### 4. Intégration des prédictions
Utiliser les prédictions pour:
- Pré-remplir automatiquement les formulaires
- Suggérer des catégories/attributs aux utilisateurs
- Valider les annotations contre le modèle

### 5. Monitoring et Logging
Ajouter:
- Dashboard des entraînements
- Logs détaillés de chaque entraînement
- Alertes sur les entraînements qui échouent

## Déploiement en production

### Considérations importantes

1. **Authentication**: Le job TrainMLModel utilise le token de l'utilisateur qui a lancé l'entraînement
   - S'assurer que les tokens ne expirent pas pendant l'entraînement (qui peut durer plusieurs minutes)
   - Ou créer un token de service spécifique

2. **Queue**: 
   - Utiliser `QUEUE_CONNECTION=redis` ou `QUEUE_CONNECTION=sqs` au lieu de `database`
   - Configurer un worker Laravel pour traiter les jobs

3. **Timeouts**:
   - Augmenter le timeout pour les gros datasets (entraînements peuvent prendre 10+ minutes)
   - Utiliser toujours le mode asynchrone en production

4. **Storage**:
   - S'assurer que les documents et modèles sont persistés (volume Docker)
   - Implémenter un système de backup des modèles entraînés

5. **Monitoring**:
   - Logger tous les entraînements
   - Monitorer l'espace disque du service ML
   - Alerter si un entraînement échoue

## Dépannage

### Les entraînements sont très lents
- Vérifier les ressources CPU/RAM disponibles
- Réduire la taille du dataset de test
- Augmenter `BATCH_SIZE` dans le service ML

### Les prédictions sont imprécises
- Ajouter plus de données d'entraînement
- Vérifier la qualité des annotations
- Essayer une augmentation de données plus agresssive
- Augmenter le nombre d'epochs d'entraînement

### Le service ML crash pendant l'entraînement
- Vérifier les logs: `docker compose logs ml_models`
- Augmenter la mémoire RAM disponible
- Réduire la taille du batch d'entraînement

## Support et Documentation

- **Documentation API**: Voir [INTEGRATION_ML.md](./INTEGRATION_ML.md)
- **ML Service**: Voir [../ml_models/README.md](../ml_models/README.md)
- **Frontend**: À implémenter dans `frontend/src/services/mlService.js`

