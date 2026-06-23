# Intégration ML Service avec Backend Laravel

## Vue d'ensemble

L'intégration permet au backend Laravel de déclencher l'entraînement du modèle ML en utilisant les annotations créées par les utilisateurs.

## Architecture

```
Frontend 
  ↓
Backend Laravel (Documents + Labelings)
  ↓
ML Service (Entraînement + Prédiction)
```

## Endpoints

### 1. Vérifier la santé du service ML

```
GET /api/ml/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "ml_models",
  "url": "http://ml_models:8001"
}
```

### 2. Entraîner un modèle (synchrone)

```
POST /api/ml/train
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "model_type": "classification|extraction",
  "description": "Optional description"
}
```

**Model Types:**
- `classification` : Classifier les documents par catégorie
- `extraction` : Extraire les attributs (montant, date, etc.)

**Response (202 - Accepted - Async):**
```json
{
  "message": "Entraînement du modèle lancé",
  "training": {
    "id": 1,
    "user_id": 6,
    "model_type": "classification",
    "status": "in_progress",
    "started_at": "2026-06-10T10:30:00Z",
    "metrics": null
  }
}
```

**Response (200 - Synchrone - Completed):**
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
      "f1_score": 0.92,
      "samples_count": 245
    },
    "completed_at": "2026-06-10T10:45:00Z"
  },
  "result": {
    "message": "Modèle de classification entraîné avec succès.",
    "labels_count": 5,
    "samples_count": 245,
    "accuracy": 0.92
  }
}
```

### 3. Lister les entraînements

```
GET /api/ml/trainings
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "user_id": 6,
      "model_type": "classification",
      "status": "completed",
      "created_at": "2026-06-10T10:30:00Z",
      "metrics": {
        "accuracy": 0.92
      }
    }
  ],
  "links": { ... },
  "meta": { ... }
}
```

### 4. Afficher un entraînement spécifique

```
GET /api/ml/trainings/{id}
```

## Flux d'utilisation

### Workflow complet

1. **Utilisateur upload un document**
   ```
   POST /api/documents
   ```

2. **Utilisateur crée des annotations (labels)**
   ```
   POST /api/labelings
   ```

3. **Backend exporte les annotations**
   ```
   GET /api/labelings/export
   ```

4. **Déclencher l'entraînement du modèle**
   ```
   POST /api/ml/train
   ```

5. **ML Service reçoit les données**
   - Récupère les annotations depuis `/api/labelings/export`
   - Lance OCR sur les documents
   - Prétraite le texte
   - Génère des données synthétiques
   - Entraîne le modèle
   - Retourne les métriques

## Configuration

### Variables d'environnement (optionnel)

Dans `backend/.env`:

```env
# Connexion au service ML
ML_SERVICE_URL=http://ml_models:8001
ML_SERVICE_TIMEOUT=600
```

### Configuration Laravel

Les paramètres sont définis dans `config/app.php`:

```php
'url' => env('APP_URL', 'http://localhost:8000'),
```

## Exemple d'utilisation cURL

### Entraîner un modèle

```bash
curl -X POST "http://localhost:8000/api/ml/train" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_type": "classification",
    "description": "Modèle pour classification des factures"
  }'
```

### Lister les entraînements

```bash
curl -X GET "http://localhost:8000/api/ml/trainings" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Vérifier la santé du service ML

```bash
curl -X GET "http://localhost:8000/api/ml/health"
```

## Format des données attendues par le ML Service

Le ML Service s'attend à un export structuré de labelings au format suivant:

```json
{
  "count": 245,
  "items": [
    {
      "document_id": 1,
      "document_path": "documents/facture_001.pdf",
      "text": "Facture fournisseur mars 2026",
      "ocr_text": "Facture fournisseur mars 2026",
      "label": "facture",
      "class_key": "documents",
      "category_key": "invoices",
      "attribute_name": "Montant",
      "attribute_snippet": "4850 €",
      "attribute_value": "4850"
    }
  ]
}
```

## Statuts d'entraînement

- `pending` : En attente de traitement
- `in_progress` : Entraînement en cours
- `completed` : Entraînement réussi
- `failed` : Entraînement échoué

## Gestion des erreurs

### Le service ML n'est pas accessible

```json
{
  "status": "unavailable",
  "service": "ml_models",
  "error": "Connection refused"
}
```

**Solution:**
```bash
docker compose logs ml_models
```

### Entraînement échoué - Pas de données

```json
{
  "message": "Entraînement du modèle échoué",
  "error": "Aucune annotation exploitable n'a été récupérée"
}
```

**Solution:** Assurez-vous que des labelings ont été créés avant de lancer l'entraînement.

### Entraînement échoué - Espaces insuffisant

```json
{
  "message": "Entraînement du modèle échoué",
  "error": "Espace disque insuffisant"
}
```

**Solution:** Libérez de l'espace disque ou nettoyez les anciens modèles.

## Prochaines étapes

1. **Implémenter les jobs en queue** pour les entraînements asynchrones
2. **Ajouter les webhooks** pour notifier le frontend quand l'entraînement est terminé
3. **Implémenter le versioning des modèles** pour conserver l'historique
4. **Ajouter des endpoints de prédiction** au backend pour appeler le service ML

## Architecture visée

```
Frontend (React)
  ↓
Backend Laravel (Gestion des documents + Labelings)
  ↓
ML Service (Entraînement + Prédiction)
  ↓
Storage (Modèles entraînés)
```
