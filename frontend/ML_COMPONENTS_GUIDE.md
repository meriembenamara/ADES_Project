# Guide d'intégration Frontend - Composants ML

## Vue d'ensemble

Deux nouveaux composants React ont été créés pour intégrer les fonctionnalités ML directement dans l'interface utilisateur:

1. **MLTrainingPanel** - Lancer et suivre les entraînements de modèles
2. **MLPredictionPanel** - Faire des prédictions sur du texte ou des documents

## Installation et utilisation

### 1. Service ML (`frontend/src/services/mlService.js`)

Un service centralisé qui gère toute la communication avec les endpoints ML du backend.

**Fonctions principales:**

```javascript
// Vérifier la santé du service ML
await mlService.checkHealth();

// Lancer un entraînement
await mlService.trainSync('classification', 'Description');
await mlService.trainAsync('extraction', 'Description');

// Lister les entraînements
await mlService.listTrainings(page, perPage);
await mlService.getTraining(trainingId);

// Faire une prédiction
await mlService.predict(text, attributeNames);
await mlService.predictDocument(documentId, attributeNames);

// Utilitaires
mlService.formatMetrics(metrics);
mlService.getStatusColor(status);
mlService.getStatusLabel(status);
```

**Exemple d'utilisation:**

```javascript
import mlService from './services/mlService';

async function startTraining() {
  try {
    const response = await mlService.trainAsync('classification');
    console.log('Training started:', response.training.id);
  } catch (error) {
    console.error('Training failed:', error);
  }
}
```

### 2. Composant MLTrainingPanel

**Localisation:** `frontend/src/components/MLTrainingPanel.jsx`

**Fonctionnalités:**
- 📋 Formulaire pour lancer un nouvel entraînement
- 📊 Historique des entraînements avec statuts en couleur
- ⚙️ Suivi automatique de la progression (rafraîchissement toutes les 5 secondes)
- 📈 Affichage des métriques (accuracy, precision, recall, F1)
- ⚠️ Affichage des erreurs d'entraînement

**Utilisation:**

```javascript
import MLTrainingPanel from './components/MLTrainingPanel';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <MLTrainingPanel />
    </div>
  );
}
```

**Props:** Aucune (état géré en interne)

**Événements gérés:**
- Submit du formulaire → Lance l'entraînement
- Click sur une carte d'entraînement → Affiche/masque les détails
- Rafraîchissement automatique → Mises à jour tous les 5 secondes

**Styles:** Inclus en interne (scoped)

### 3. Composant MLPredictionPanel

**Localisation:** `frontend/src/components/MLPredictionPanel.jsx`

**Fonctionnalités:**
- 🔍 Onglet "Texte libre" pour analyser du texte
- 📄 Onglet "Document" pour analyser un document uploadsé
- 📊 Affichage des résultats de classification
- 🏷️ Affichage des attributs extraits
- 💾 Option pour sauvegarder une prédiction comme labeling

**Utilisation:**

```javascript
import MLPredictionPanel from './components/MLPredictionPanel';

function AnalysisPage() {
  return (
    <div>
      <h1>Analyse de documents</h1>
      <MLPredictionPanel />
    </div>
  );
}
```

**Props:** Aucune (état géré en interne)

**Événements gérés:**
- Changement d'onglet (texte ↔ document)
- Submit du formulaire → Lance la prédiction
- Click "Sauvegarder comme labeling" → Crée un labeling

**Styles:** Inclus en interne (scoped)

## Intégration dans votre application

### Option 1: Ajouter un nouvel onglet/page

Créez une page dédiée aux opérations ML:

```javascript
// frontend/src/pages/MLOperations.jsx
import React from 'react';
import MLTrainingPanel from '../components/MLTrainingPanel';
import MLPredictionPanel from '../components/MLPredictionPanel';

export function MLOperations() {
  return (
    <div className="ml-operations-page">
      <h1>Opérations Machine Learning</h1>
      
      <section>
        <MLTrainingPanel />
      </section>

      <section>
        <MLPredictionPanel />
      </section>
    </div>
  );
}

export default MLOperations;
```

Puis ajouter la route:

```javascript
// frontend/src/App.jsx
import MLOperations from './pages/MLOperations';

function App() {
  return (
    <Router>
      <Routes>
        {/* ... autres routes ... */}
        <Route path="/ml-operations" element={<MLOperations />} />
      </Routes>
    </Router>
  );
}
```

### Option 2: Intégrer dans un dashboard existant

```javascript
// frontend/src/pages/Dashboard.jsx
import MLTrainingPanel from '../components/MLTrainingPanel';
import MLPredictionPanel from '../components/MLPredictionPanel';

export function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Tableau de bord</h1>
      
      <div className="dashboard-grid">
        <aside className="sidebar">
          {/* Navigation, etc. */}
        </aside>

        <main className="content">
          <section>
            <h2>Entraînement des modèles</h2>
            <MLTrainingPanel />
          </section>

          <section>
            <h2>Prédictions</h2>
            <MLPredictionPanel />
          </section>
        </main>
      </div>
    </div>
  );
}
```

### Option 3: Utiliser indépendamment

```javascript
// frontend/src/components/DocumentUploadForm.jsx
import MLPredictionPanel from './MLPredictionPanel';

export function DocumentUploadForm() {
  const [document, setDocument] = useState(null);

  return (
    <div>
      <input type="file" onChange={handleUpload} />
      
      {document && (
        <div>
          <h3>Analyze document</h3>
          <MLPredictionPanel />
        </div>
      )}
    </div>
  );
}
```

## Personnalisation

### Styles personnalisés

Les composants incluent leurs styles en interne, mais vous pouvez les surcharger:

```css
/* Augmenter la taille de la police */
.ml-training-panel .ml-container h2 {
  font-size: 28px;
}

/* Changer les couleurs */
.btn-primary {
  background: #your-color !important;
}

/* Modifier les espaces */
.training-card {
  padding: 20px !important;
}
```

### Configuration du service

Modifier les paramètres par défaut dans `mlService.js`:

```javascript
// Ajouter un paramètre de timeout personnalisé
export const mlService = {
  // ...
  async trainSync(modelType, description = '', timeout = 600) {
    // Utiliser timeout personnalisé
  }
};
```

## Gestion des états

### MLTrainingPanel

```javascript
const [trainings, setTrainings] = useState([]);      // Liste des entraînements
const [selectedTraining, setSelectedTraining] = useState(null); // Sélectionné
const [loading, setLoading] = useState(false);       // En cours
const [error, setError] = useState(null);            // Erreur
const [formData, setFormData] = useState({
  model_type: 'classification',
  description: '',
});
```

### MLPredictionPanel

```javascript
const [activeTab, setActiveTab] = useState('text');  // 'text' ou 'document'
const [text, setText] = useState('');                // Texte à analyser
const [documentId, setDocumentId] = useState('');    // ID document
const [predictions, setPredictions] = useState(null); // Résultats
const [loading, setLoading] = useState(false);       // En cours
const [error, setError] = useState(null);            // Erreur
const [attributeNames, setAttributeNames] = useState(''); // Attributs
```

## Bonnes pratiques

### 1. Authentification
Les composants utilisent automatiquement le token du `workspaceApi.js`. Assurez-vous qu'il est valide:

```javascript
// Vérifier avant d'utiliser les composants
async function checkAuth() {
  try {
    const response = await mlService.checkHealth();
    return response.status === 'healthy';
  } catch (error) {
    // Pas authentifié ou service indisponible
    return false;
  }
}
```

### 2. Gestion des erreurs
Les composants gèrent les erreurs en interne, mais vous pouvez ajouter un handler global:

```javascript
// frontend/src/services/mlService.js
async predict(text, attributeNames = null) {
  try {
    return await apiRequest('/api/ml/predict', { ... });
  } catch (err) {
    // Log centralisé
    console.error('ML Prediction error:', err);
    throw err;
  }
}
```

### 3. Performance
- Les entraînements sont asynchrones par défaut (queue)
- Le rafraîchissement se fait toutes les 5 secondes
- Utilisez le rafraîchissement manuel si nécessaire:

```javascript
// Force le rafraîchissement
const trainings = await mlService.listTrainings(1, 10);
```

### 4. Accessibilité
Les composants utilisent des labels HTML appropriés et des sémantiques ARIA:

```javascript
<label htmlFor="model_type">Type de modèle:</label>
<select id="model_type" aria-label="Sélectionner le type de modèle">
```

## Tests

### Test manual avec le script

```bash
cd backend
bash test_ml_integration.sh
```

### Test unitaire

```javascript
// test/mlService.test.js
import mlService from '../services/mlService';

describe('mlService', () => {
  test('checkHealth returns status', async () => {
    const response = await mlService.checkHealth();
    expect(response.status).toEqual('healthy');
  });

  test('predict returns predictions', async () => {
    const response = await mlService.predict('Test text');
    expect(response.predictions).toBeDefined();
  });
});
```

## Troubleshooting

### Les composants ne s'affichent pas

1. Vérifier que le service ML fonctionne:
   ```javascript
   const health = await mlService.checkHealth();
   console.log(health);
   ```

2. Vérifier que vous êtes authentifié:
   ```javascript
   // Le token doit être dans localStorage
   console.log(localStorage.getItem('api_token'));
   ```

3. Vérifier les logs du navigateur (F12 → Console)

### Les entraînements ne se mettent pas à jour

Le composant rafraîchit automatiquement toutes les 5 secondes. Pour forcer un rafraîchissement:

```javascript
// Dans MLTrainingPanel, ajouter un bouton:
<button onClick={() => loadTrainings()}>
  🔄 Rafraîchir
</button>
```

### Les prédictions sont lentes

Utilisez le formulaire "Document" si possible car il optimise l'OCR côté serveur.

Pour le texte libre, limitez la longueur:

```javascript
// Valider dans handlePredictText:
if (text.length > 5000) {
  setError('Le texte ne doit pas dépasser 5000 caractères');
  return;
}
```

## API Documentation

Voir [INTEGRATION_ML.md](./INTEGRATION_ML.md) pour la documentation complète des endpoints API.

