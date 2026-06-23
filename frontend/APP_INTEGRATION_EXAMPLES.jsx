/**
 * Exemple d'intégration des composants ML dans App.jsx
 * 
 * Ce fichier montre différentes façons d'intégrer MLTrainingPanel et MLPredictionPanel
 * dans votre application React.
 */

// ============================================================================
// OPTION 1: Ajouter une nouvelle page dédiée
// ============================================================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MLTrainingPanel from './components/MLTrainingPanel';
import MLPredictionPanel from './components/MLPredictionPanel';

/**
 * Page dédiée aux opérations ML
 */
function MLOperations() {
  return (
    <div className="ml-operations-page">
      <div className="page-header">
        <h1>🤖 Opérations Machine Learning</h1>
        <p>Entraîner des modèles et faire des prédictions</p>
      </div>

      <div className="operations-container">
        {/* Section Entraînement */}
        <section className="operation-section">
          <MLTrainingPanel />
        </section>

        {/* Section Prédictions */}
        <section className="operation-section">
          <MLPredictionPanel />
        </section>
      </div>

      <style>{`
        .ml-operations-page {
          background: #f3f4f6;
          min-height: 100vh;
          padding: 20px;
        }

        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .page-header h1 {
          font-size: 32px;
          margin-bottom: 10px;
          color: #111827;
        }

        .page-header p {
          color: #6b7280;
          font-size: 16px;
        }

        .operations-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .operation-section {
          margin-bottom: 40px;
        }
      `}</style>
    </div>
  );
}

/**
 * Composant principal App avec routes
 */
export function App() {
  return (
    <Router>
      <Routes>
        {/* Routes existantes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/documents" element={<DocumentList />} />

        {/* NOUVELLE ROUTE ML */}
        <Route path="/ml-operations" element={<MLOperations />} />

        {/* Autres routes */}
      </Routes>
    </Router>
  );
}

export default App;

// ============================================================================
// OPTION 2: Intégrer dans un Dashboard existant
// ============================================================================

/**
 * Dashboard avec intégration des panneaux ML
 */
function Dashboard() {
  return (
    <div className="dashboard">
      <nav className="sidebar">
        <ul>
          <li><a href="/">Dashboard</a></li>
          <li><a href="/documents">Documents</a></li>
          <li><a href="/ml-operations">🤖 ML Operations</a></li>
        </ul>
      </nav>

      <main className="main-content">
        <h1>Tableau de bord</h1>

        {/* Grille d'informations */}
        <div className="dashboard-grid">
          <div className="card">
            <h2>Documents</h2>
            {/* Contenu */}
          </div>

          <div className="card">
            <h2>Annotations</h2>
            {/* Contenu */}
          </div>
        </div>

        {/* Panneaux ML visibles directement */}
        <section className="ml-section">
          <h2>Derniers entraînements</h2>
          <MLTrainingPanel />
        </section>

        <section className="ml-section">
          <h2>Tester une prédiction</h2>
          <MLPredictionPanel />
        </section>
      </main>
    </div>
  );
}

// ============================================================================
// OPTION 3: Composant réutilisable avec état partagé
// ============================================================================

import { useState } from 'react';

/**
 * Composant contenant le logique partagée pour ML
 */
function MLContainer() {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [trainingInProgress, setTrainingInProgress] = useState(false);

  return (
    <div className="ml-container">
      {/* Passer des props si nécessaire */}
      <MLTrainingPanel
        onTrainingStart={() => setTrainingInProgress(true)}
        onTrainingComplete={() => setTrainingInProgress(false)}
      />

      <MLPredictionPanel
        disabled={trainingInProgress}
        onDocumentSelect={setSelectedDocument}
      />
    </div>
  );
}

// ============================================================================
// OPTION 4: Intégration minimal dans un composant existant
// ============================================================================

/**
 * Page de détail d'un document avec prédiction
 */
function DocumentDetail({ documentId }) {
  return (
    <div className="document-detail">
      <div className="document-viewer">
        {/* Affichage du document */}
      </div>

      <div className="prediction-section">
        <h3>🔮 Prédictions pour ce document</h3>
        <MLPredictionPanel />
      </div>
    </div>
  );
}

// ============================================================================
// OPTION 5: Layout avec onglets
// ============================================================================

/**
 * Interface avec onglets pour l'expérience utilisateur
 */
function MLTabbedInterface() {
  const [activeTab, setActiveTab] = useState('training');

  return (
    <div className="tabbed-interface">
      <div className="tabs-header">
        <button
          className={`tab ${activeTab === 'training' ? 'active' : ''}`}
          onClick={() => setActiveTab('training')}
        >
          📚 Entraînement
        </button>
        <button
          className={`tab ${activeTab === 'predict' ? 'active' : ''}`}
          onClick={() => setActiveTab('predict')}
        >
          🔮 Prédictions
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📊 Historique
        </button>
      </div>

      <div className="tabs-content">
        {activeTab === 'training' && <MLTrainingPanel />}
        {activeTab === 'predict' && <MLPredictionPanel />}
        {activeTab === 'history' && <TrainingHistory />}
      </div>

      <style>{`
        .tabbed-interface {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .tabs-header {
          display: flex;
          border-bottom: 2px solid #e5e7eb;
        }

        .tab {
          flex: 1;
          padding: 15px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-weight: 500;
          color: #6b7280;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #1f2937;
        }

        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .tabs-content {
          padding: 20px;
        }
      `}</style>
    </div>
  );
}

function TrainingHistory() {
  // TODO: Implémenter la visualisation de l'historique
  return <div>Historique des entraînements</div>;
}

// ============================================================================
// DÉMARRAGE SIMPLE (choisir une option ci-dessus)
// ============================================================================

/**
 * Pour commencer rapidement, choisir l'une de ces intégrations:
 *
 * 1. SIMPLE - Ajouter une page dédiée
 * 2. INTÉGRÉ - Ajouter dans le Dashboard existant
 * 3. RÉUTILISABLE - Créer un composant conteneur
 * 4. LÉGÈRE - Ajouter directement dans une page existante
 * 5. UX - Utiliser des onglets pour une meilleure expérience
 *
 * La plus courante est l'OPTION 1 (nouvelle page) car elle offre:
 * - Séparation claire des responsabilités
 * - Facile à tester indépendamment
 * - Pas d'impact sur le code existant
 * - Navigation intuitive pour l'utilisateur
 */
