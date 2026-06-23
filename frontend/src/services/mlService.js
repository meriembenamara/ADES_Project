import { apiRequest, formDataRequest } from './workspaceApi';

export const mlService = {
  /**
   * Vérifier la santé du service ML
   * @returns {Promise<{status: string, service: string}>}
   */
  async checkHealth(token) {
    return apiRequest('/ml/health', {
      method: 'GET',
      token,
    });
  },

  /**
   * Lancer un entraînement du modèle (synchrone)
   * @param {string} modelType - 'classification' ou 'extraction'
   * @param {string} description - Description optionnelle
   * @param {string|null} token - Jeton d'authentification
   * @returns {Promise<{training: Object, metrics: Object}>}
   */
  async trainSync(modelType, description = '', token = null) {
    return apiRequest('/ml/train', {
      method: 'POST',
      body: {
        model_type: modelType,
        description,
      },
      token,
    });
  },

  /**
   * Lancer un entraînement du modèle (asynchrone via queue)
   * @param {string} modelType - 'classification' ou 'extraction'
   * @param {string} description - Description optionnelle
   * @param {string|null} token - Jeton d'authentification
   * @returns {Promise<{training: Object}>}
   */
  async trainAsync(modelType, description = '', token = null) {
    return apiRequest('/ml/train-async', {
      method: 'POST',
      body: {
        model_type: modelType,
        description,
      },
      token,
    });
  },

  /**
   * Lister tous les entraînements
   * @param {number} page - Numéro de page (défaut: 1)
   * @param {number} perPage - Éléments par page (défaut: 15)
   * @param {string|null} token - Jeton d'authentification
   * @returns {Promise<{data: Array, meta: Object}>}
   */
  async listTrainings(page = 1, perPage = 15, token = null) {
    return apiRequest(`/ml/trainings?page=${page}&per_page=${perPage}`, {
      method: 'GET',
      token,
    });
  },

  /**
   * Lister les attributs PDF selectionnes pour l'entrainement
   * @param {string|null} token - Jeton d'authentification
   * @returns {Promise<Array>}
   */
  async listSelectedPdfAttributes(token = null) {
    return apiRequest('/labelings', {
      method: 'GET',
      token,
    });
  },

  /**
   * Obtenir les détails d'un entraînement spécifique
   * @param {number} trainingId - ID de l'entraînement
   * @param {string|null} token - Jeton d'authentification
   * @returns {Promise<{data: Object}>}
   */
  async getTraining(trainingId, token = null) {
    return apiRequest(`/ml/trainings/${trainingId}`, {
      method: 'GET',
      token,
    });
  },

  /**
   * Faire une prédiction sur du texte
   * @param {string} text - Texte à prédire
   * @param {Array<string>} attributeNames - Noms d'attributs optionnels
   * @param {string|null} token - Jeton d'authentification
   * @returns {Promise<{predictions: Object}>}
   */
  async predict(text, attributeNames = null, token = null) {
    return apiRequest('/ml/predict', {
      method: 'POST',
      body: {
        text,
        attribute_names: attributeNames,
      },
      token,
    });
  },

  /**
   * Faire une prédiction sur un document spécifique
   * @param {number} documentId - ID du document
   * @param {Array<string>} attributeNames - Noms d'attributs optionnels
   * @param {string|null} token - Jeton d'authentification
   * @returns {Promise<{predictions: Object}>}
   */
  async predictDocument(documentId, attributeNames = null, token = null) {
    return apiRequest(`/ml/predict/document/${documentId}`, {
      method: 'POST',
      body: {
        document_id: documentId,
        attribute_names: attributeNames,
      },
      token,
    });
  },

  /**
   * Récupérer les statuts possibles d'entraînement
   * @returns {Array<string>}
   */
  getTrainingStatuses() {
    return ['pending', 'in_progress', 'completed', 'failed'];
  },

  /**
   * Récupérer les types de modèles disponibles
   * @returns {Array<{value: string, label: string}>}
   */
  getModelTypes() {
    return [
      { value: 'classification', label: 'Classification de documents' },
      { value: 'extraction', label: 'Extraction d\'attributs' },
    ];
  },

  /**
   * Formater les métriques pour l'affichage
   * @param {Object} metrics - Métriques brutes
   * @returns {Array<{key: string, label: string, value: string, percentage: number}>}
   */
  formatMetrics(metrics) {
    if (!metrics) return [];

    const formatted = [];

    if (metrics.accuracy !== undefined) {
      formatted.push({
        key: 'accuracy',
        label: 'Précision',
        value: (metrics.accuracy * 100).toFixed(2) + '%',
        percentage: metrics.accuracy * 100,
      });
    }

    if (metrics.precision !== undefined) {
      formatted.push({
        key: 'precision',
        label: 'Précision (Positive)',
        value: (metrics.precision * 100).toFixed(2) + '%',
        percentage: metrics.precision * 100,
      });
    }

    if (metrics.recall !== undefined) {
      formatted.push({
        key: 'recall',
        label: 'Rappel',
        value: (metrics.recall * 100).toFixed(2) + '%',
        percentage: metrics.recall * 100,
      });
    }

    if (metrics.f1_score !== undefined) {
      formatted.push({
        key: 'f1_score',
        label: 'Score F1',
        value: (metrics.f1_score * 100).toFixed(2) + '%',
        percentage: metrics.f1_score * 100,
      });
    }

    if (metrics.samples_count !== undefined) {
      formatted.push({
        key: 'samples_count',
        label: 'Nombre d\'échantillons',
        value: metrics.samples_count.toString(),
        percentage: 0,
      });
    }

    if (metrics.training_time !== undefined) {
      formatted.push({
        key: 'training_time',
        label: 'Temps d\'entraînement',
        value: metrics.training_time.toFixed(2) + 's',
        percentage: 0,
      });
    }

    return formatted;
  },

  /**
   * Obtenir la couleur basée sur le statut
   * @param {string} status - Statut d'entraînement
   * @returns {string}
   */
  getStatusColor(status) {
    const colors = {
      pending: '#fbbf24',      // amber
      in_progress: '#3b82f6',  // blue
      completed: '#10b981',    // green
      failed: '#ef4444',       // red
    };
    return colors[status] || '#6b7280'; // gray
  },

  /**
   * Obtenir l'icône basée sur le statut
   * @param {string} status - Statut d'entraînement
   * @returns {string}
   */
  getStatusIcon(status) {
    const icons = {
      pending: '⏳',
      in_progress: '⚙️',
      completed: '✓',
      failed: '✗',
    };
    return icons[status] || '?';
  },

  /**
   * Obtenir le libellé du statut en français
   * @param {string} status - Statut d'entraînement
   * @returns {string}
   */
  getStatusLabel(status) {
    const labels = {
      pending: 'En attente',
      in_progress: 'En cours',
      completed: 'Terminé',
      failed: 'Échoué',
    };
    return labels[status] || status;
  },

  /**
   * Sauvegarder une prédiction comme labeling
   * @param {number} documentId - ID du document
   * @param {Object} prediction - Résultat de la prédiction
   * @returns {Promise<Object>}
   */
  async savePredictionAsLabeling(documentId, prediction, token = null) {
    const attributeName =
      prediction.attribute_name ||
      (Array.isArray(prediction.attributes) && prediction.attributes[0]?.name) ||
      'prediction';
    const attributeValue =
      prediction.attribute_value ||
      (Array.isArray(prediction.attributes) && prediction.attributes[0]?.value) ||
      prediction.label ||
      JSON.stringify(prediction);

    return apiRequest('/labelings', {
      method: 'POST',
      body: {
        document_id: documentId,
        label: prediction.label || null,
        attribute_name: attributeName,
        attribute_value: attributeValue,
        confidence: prediction.confidence || null,
      },
      token,
    });
  },
};

export default mlService;
