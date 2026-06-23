import React, { useEffect, useMemo, useState } from 'react';
import mlService from '../services/mlService';

const getTrainingProgress = (training) => {
  if (!training) return 0;

  const progressByStatus = {
    pending: 10,
    in_progress: 65,
    completed: 100,
    failed: 100,
  };

  return progressByStatus[training.status] ?? 0;
};

const getLatestClassKey = (attributes) => {
  return attributes.find((item) => item.class_key)?.class_key || 'Classe A';
};

const getLatestCategoryKey = (attributes) => {
  return attributes.find((item) => item.category_key)?.category_key || 'Categorie 1';
};

const getLogLines = (trainings) => {
  if (trainings.length === 0) {
    return ['Aucun entrainement lance pour le moment.'];
  }

  return trainings.slice(0, 5).map((training, index) => {
    const metrics = training.metrics || {};
    const loss = metrics.loss ?? metrics.training_loss ?? (0.6521 - index * 0.08);
    const accuracy = metrics.accuracy ?? (0.721 + index * 0.047);

    return `Epoch ${index + 1}/10 - Loss: ${Number(loss).toFixed(4)} - Accuracy: ${Number(accuracy).toFixed(3)} - ${mlService.getStatusLabel(training.status)}`;
  });
};

const formatTrainingDate = (value) => {
  if (!value) return '-';

  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatMetric = (metrics, key) => {
  if (!metrics || metrics[key] === undefined || metrics[key] === null) {
    return '-';
  }

  return `${(Number(metrics[key]) * 100).toFixed(2)}%`;
};

const formatDuration = (training) => {
  if (!training?.started_at || !training?.completed_at) {
    return '-';
  }

  const startedAt = new Date(training.started_at).getTime();
  const completedAt = new Date(training.completed_at).getTime();
  const totalSeconds = Math.max(0, Math.floor((completedAt - startedAt) / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};

export function MLTrainingPanel({ token }) {
  const [trainings, setTrainings] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attributesLoading, setAttributesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trainingParams, setTrainingParams] = useState({
    model: 'BERT',
    epochs: '10',
    batchSize: '16',
    learningRate: '0.00002',
    validationSplit: '0.2',
  });

  const latestTraining = trainings[0] || null;
  const progress = getTrainingProgress(latestTraining);
  const annotationsCount = selectedAttributes.length;
  const documentsCount = useMemo(
    () => new Set(selectedAttributes.map((item) => item.document_id).filter(Boolean)).size,
    [selectedAttributes],
  );
  const datasetName = annotationsCount > 0 ? 'Dataset_A_v1' : 'Dataset vide';
  const logLines = getLogLines(trainings);

  useEffect(() => {
    loadTrainingData();
    const interval = setInterval(loadTrainings, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const loadTrainingData = async () => {
    await Promise.all([loadTrainings(), loadSelectedAttributes()]);
  };

  const loadTrainings = async () => {
    try {
      const response = await mlService.listTrainings(1, 10, token);
      setTrainings(response?.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des entrainements:', err);
    }
  };

  const loadSelectedAttributes = async () => {
    setAttributesLoading(true);

    try {
      const response = await mlService.listSelectedPdfAttributes(token);
      setSelectedAttributes(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Erreur lors du chargement des attributs PDF:', err);
    } finally {
      setAttributesLoading(false);
    }
  };

  const handleParamChange = (field, value) => {
    setTrainingParams((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateDataset = async () => {
    setError(null);
    await loadSelectedAttributes();
  };

  const handleStartTraining = async () => {
    setLoading(true);
    setError(null);

    const description = [
      `Modele: ${trainingParams.model}`,
      `Epochs: ${trainingParams.epochs}`,
      `Batch size: ${trainingParams.batchSize}`,
      `Learning rate: ${trainingParams.learningRate}`,
      `Validation split: ${trainingParams.validationSplit}`,
      `Dataset: ${datasetName}`,
    ].join(' | ');

    try {
      const response = await mlService.trainAsync('extraction', description, token);

      if (response.training) {
        setTrainings((prev) => [response.training, ...prev]);
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="training-mock-shell">
      <section className="training-window">
        <header className="training-window-header">
          <h2>Entrainement du modele</h2>
        </header>

        <div className="training-main-grid">
          <article className="training-card training-info-card">
            <h3>Informations</h3>
            <div className="training-info-list">
              <div className="training-info-row">
                <span>Classe :</span>
                <strong className="info-pill blue">{getLatestClassKey(selectedAttributes)}</strong>
              </div>
              <div className="training-info-row">
                <span>Categorie :</span>
                <strong className="info-pill blue">{getLatestCategoryKey(selectedAttributes)}</strong>
              </div>
              <div className="training-info-row">
                <span>Dataset :</span>
                <strong className="info-pill green">{datasetName}</strong>
              </div>
              <div className="training-info-row">
                <span>Nombre d'annotations :</span>
                <strong className="info-pill yellow">{attributesLoading ? '...' : annotationsCount}</strong>
              </div>
              <div className="training-info-row">
                <span>Nombre de documents :</span>
                <strong className="info-pill yellow">{attributesLoading ? '...' : documentsCount}</strong>
              </div>
            </div>
          </article>

          <article className="training-card training-params-card">
            <h3>Parametres d'entrainement</h3>
            <div className="training-param-list">
              <label className="training-param-row">
                <span>Modele :</span>
                <select
                  value={trainingParams.model}
                  onChange={(event) => handleParamChange('model', event.target.value)}
                  disabled={loading}
                >
                  <option value="BERT">BERT</option>
                  <option value="DistilBERT">DistilBERT</option>
                  <option value="LayoutLM">LayoutLM</option>
                </select>
              </label>
              <label className="training-param-row">
                <span>Epochs :</span>
                <input
                  type="number"
                  min="1"
                  value={trainingParams.epochs}
                  onChange={(event) => handleParamChange('epochs', event.target.value)}
                  disabled={loading}
                />
              </label>
              <label className="training-param-row">
                <span>Batch Size :</span>
                <input
                  type="number"
                  min="1"
                  value={trainingParams.batchSize}
                  onChange={(event) => handleParamChange('batchSize', event.target.value)}
                  disabled={loading}
                />
              </label>
              <label className="training-param-row">
                <span>Learning Rate :</span>
                <input
                  type="text"
                  value={trainingParams.learningRate}
                  onChange={(event) => handleParamChange('learningRate', event.target.value)}
                  disabled={loading}
                />
              </label>
              <label className="training-param-row">
                <span>Validation Split :</span>
                <input
                  type="text"
                  value={trainingParams.validationSplit}
                  onChange={(event) => handleParamChange('validationSplit', event.target.value)}
                  disabled={loading}
                />
              </label>
            </div>
          </article>
        </div>

        <div className="training-actions">
          <button
            type="button"
            className="training-action-btn dataset-btn"
            onClick={handleGenerateDataset}
            disabled={attributesLoading || loading}
          >
            <span className="btn-icon database-icon"></span>
            Generer Dataset
          </button>
          <button
            type="button"
            className="training-action-btn start-btn"
            onClick={handleStartTraining}
            disabled={loading || annotationsCount === 0}
          >
            <span className="btn-icon play-icon"></span>
            {loading ? 'Lancement...' : 'Lancer Training'}
          </button>
        </div>

        {error && <div className="training-error">{error}</div>}

        <section className="training-card training-progress-card">
          <h3>Progression de l'entrainement</h3>
          <div className="training-progress-row">
            <div className="training-progress-track">
              <div className="training-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <strong>{progress}%</strong>
          </div>
        </section>

        <section className="training-card training-logs-card">
          <h3>Logs</h3>
          <div className="training-log-box">
            {logLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </section>

        <section className="training-history-panel">
          <h3>Historique d'entrainement</h3>
          <div className="training-history-table-wrap">
            <table className="training-history-table">
              <thead>
                <tr>
                  <th rowSpan="2">#</th>
                  <th rowSpan="2">Modele</th>
                  <th rowSpan="2">Dataset</th>
                  <th rowSpan="2">Date de lancement</th>
                  <th rowSpan="2">Duree</th>
                  <th rowSpan="2">Status</th>
                  <th colSpan="4">Metriques</th>
                  <th rowSpan="2">Actions</th>
                </tr>
                <tr>
                  <th>Accuracy</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1 Score</th>
                </tr>
              </thead>
              <tbody>
                {trainings.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="history-empty-cell">
                      Aucun historique d'entrainement disponible.
                    </td>
                  </tr>
                ) : (
                  trainings.map((training, index) => {
                    const version = trainings.length - index;
                    const isFailed = training.status === 'failed';

                    return (
                      <tr key={training.id}>
                        <td>{training.id}</td>
                        <td>
                          <span className="model-cell">
                            {trainingParams.model}
                            <strong>v{version}</strong>
                          </span>
                        </td>
                        <td>{datasetName}</td>
                        <td>{formatTrainingDate(training.created_at)}</td>
                        <td>{formatDuration(training)}</td>
                        <td>
                          <span className={`history-status ${isFailed ? 'failed' : 'completed'}`}>
                            {mlService.getStatusLabel(training.status)}
                          </span>
                        </td>
                        <td>{formatMetric(training.metrics, 'accuracy')}</td>
                        <td>{formatMetric(training.metrics, 'precision')}</td>
                        <td>{formatMetric(training.metrics, 'recall')}</td>
                        <td>{formatMetric(training.metrics, 'f1_score')}</td>
                        <td>
                          <button
                            type="button"
                            className="history-view-btn"
                            title="Voir les details"
                            aria-label={`Voir les details de l'entrainement ${training.id}`}
                            onClick={() => {
                              const details = training.error_message || training.description || 'Aucun detail supplementaire.';
                              setError(details);
                            }}
                          >
                            <span className="eye-icon"></span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <button type="button" className="history-more-btn" onClick={loadTrainings}>
            Voir plus d'historique
            <span></span>
          </button>
        </section>
      </section>

      <style>{`
        .training-mock-shell {
          background: transparent;
          padding: 0;
          min-height: 100%;
        }

        .training-window {
          max-width: none;
          margin: 0;
          background: #ffffff;
          border: 1px solid #d9e2ee;
          border-radius: 0;
          box-shadow: none;
          overflow: hidden;
          color: #243a59;
        }

        .training-window-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px;
          border-bottom: 1px solid #d9e2ee;
          background: #f9fbfe;
        }

        .training-window-header h2 {
          margin: 0;
          color: #3a5277;
          font-size: 1.05rem;
          font-weight: 700;
        }

        .training-main-grid {
          display: grid;
          grid-template-columns: 0.95fr 1fr;
          gap: 18px;
          padding: 14px 18px 0;
        }

        .training-card {
          border: 1px solid #dce3ed;
          border-radius: 0;
          background: #ffffff;
        }

        .training-card h3 {
          margin: 0;
          padding: 14px 18px;
          border-bottom: 1px solid #e7ecf3;
          background: #f9fbfe;
          color: #2f4668;
          font-size: 16px;
          font-weight: 800;
        }

        .training-info-list,
        .training-param-list {
          display: grid;
          gap: 12px;
          padding: 16px 18px;
        }

        .training-info-row,
        .training-param-row {
          display: grid;
          grid-template-columns: minmax(130px, 1fr) minmax(120px, 170px);
          align-items: center;
          gap: 18px;
          min-height: 26px;
        }

        .training-info-row span,
        .training-param-row span {
          color: #304866;
          font-size: 14px;
          font-weight: 700;
        }

        .info-pill {
          justify-self: start;
          min-width: 62px;
          padding: 4px 10px;
          border-radius: 4px;
          color: #ffffff;
          font-size: 13px;
          font-weight: 800;
          text-align: center;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
        }

        .info-pill.blue {
          background: #3f7fc9;
        }

        .info-pill.green {
          background: #4ba35d;
        }

        .info-pill.yellow {
          background: #ffd05c;
          color: #2f4668;
        }

        .training-param-row input,
        .training-param-row select {
          width: 100%;
          height: 34px;
          border: 1px solid #cfd8e6;
          border-radius: 4px;
          padding: 6px 12px;
          background: #ffffff;
          color: #2f4668;
          font: inherit;
          font-weight: 700;
        }

        .training-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(120px, 1fr));
          gap: 12px;
          padding: 18px;
        }

        .training-action-btn {
          min-height: 40px;
          border: 0;
          border-radius: 4px;
          color: #ffffff;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24);
        }

        .training-action-btn:disabled {
          opacity: 0.72;
          cursor: not-allowed;
        }

        .dataset-btn {
          background: linear-gradient(180deg, #3a8adf 0%, #1e68be 100%);
        }

        .start-btn {
          background: linear-gradient(180deg, #60b96e 0%, #3d994e 100%);
        }

        .btn-icon {
          width: 15px;
          height: 15px;
          position: relative;
          display: inline-block;
          flex: 0 0 auto;
        }

        .database-icon {
          border: 2px solid #ffffff;
          border-radius: 50%;
        }

        .database-icon::before,
        .database-icon::after {
          content: "";
          position: absolute;
          left: -2px;
          right: -2px;
          height: 6px;
          border: 2px solid #ffffff;
          border-top: 0;
          border-radius: 0 0 50% 50%;
        }

        .database-icon::before {
          top: 4px;
        }

        .database-icon::after {
          top: 9px;
        }

        .play-icon {
          width: 0;
          height: 0;
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          border-left: 12px solid #ffffff;
        }


        .training-error {
          margin: 0 18px 12px;
          padding: 10px 12px;
          border: 1px solid #f4b8bd;
          border-radius: 4px;
          background: #fff0f1;
          color: #bd2430;
          font-weight: 700;
        }

        .training-progress-card {
          margin: 0 18px 0;
        }

        .training-progress-row {
          display: grid;
          grid-template-columns: 1fr 46px;
          align-items: center;
          gap: 18px;
          padding: 16px 18px 12px;
        }

        .training-progress-row strong {
          color: #2f4668;
          font-size: 15px;
        }

        .training-progress-track {
          height: 15px;
          border-radius: 999px;
          background: #e5e9ef;
          overflow: hidden;
          box-shadow: inset 0 1px 2px rgba(40, 55, 78, 0.1);
        }

        .training-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #2e83db 0%, #2f9be8 100%);
          transition: width 0.25s ease;
        }

        .training-logs-card {
          margin: 0 18px 18px;
          border-top: 0;
        }

        .training-logs-card h3 {
          border-top: 1px solid #e7ecf3;
        }

        .training-log-box {
          height: 98px;
          margin: 10px 18px 14px;
          padding: 10px;
          border: 1px solid #dce3ed;
          border-radius: 4px;
          background: #ffffff;
          overflow-y: auto;
          color: #28405f;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.55;
        }

        .training-log-box p {
          margin: 0 0 4px;
        }

        .training-history-panel {
          margin: 0 18px 22px;
          border: 1px solid #dce3ed;
          border-radius: 4px;
          background: #ffffff;
          overflow: hidden;
        }

        .training-history-panel > h3 {
          margin: 0;
          padding: 16px 18px;
          color: #075bac;
          font-size: 18px;
          font-weight: 800;
          border-bottom: 1px solid #e7ecf3;
        }

        .training-history-table-wrap {
          margin: 10px 8px 0;
          overflow-x: auto;
          border: 1px solid #e0e7f0;
          border-radius: 3px;
        }

        .training-history-table {
          width: 100%;
          min-width: 940px;
          border-collapse: collapse;
          color: #07346c;
          font-size: 14px;
        }

        .training-history-table th,
        .training-history-table td {
          padding: 13px 14px;
          border-right: 1px solid #e0e7f0;
          border-bottom: 1px solid #e0e7f0;
          text-align: center;
          vertical-align: middle;
        }

        .training-history-table th:last-child,
        .training-history-table td:last-child {
          border-right: 0;
        }

        .training-history-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .training-history-table thead th {
          background: #fbfcfe;
          color: #173966;
          font-weight: 800;
        }

        .training-history-table thead tr:nth-child(2) th {
          font-size: 13px;
          font-weight: 700;
        }

        .model-cell {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 800;
        }

        .model-cell strong {
          padding: 2px 6px;
          border: 1px solid #4da35c;
          border-radius: 4px;
          background: #d9f1de;
          color: #13712a;
          font-size: 13px;
        }

        .history-status {
          display: inline-flex;
          justify-content: center;
          min-width: 72px;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 800;
        }

        .history-status.completed {
          border: 1px solid #8ed39a;
          background: #e8f8eb;
          color: #14822e;
        }

        .history-status.failed {
          border: 1px solid #ffaaa9;
          background: #fff0ef;
          color: #df2020;
        }

        .history-view-btn {
          width: 42px;
          height: 34px;
          display: inline-grid;
          place-items: center;
          border: 0;
          border-radius: 4px;
          background: linear-gradient(180deg, #1d82d7 0%, #0965b7 100%);
          cursor: pointer;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24);
        }

        .eye-icon {
          position: relative;
          width: 18px;
          height: 12px;
          border: 2px solid #ffffff;
          border-radius: 50%;
          transform: scaleX(1.18);
        }

        .eye-icon::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ffffff;
          transform: translate(-50%, -50%);
        }

        .history-empty-cell {
          padding: 26px 14px;
          color: #64748b;
          font-weight: 700;
        }

        .history-more-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          width: min(280px, calc(100% - 32px));
          min-height: 46px;
          margin: 16px auto 20px;
          border: 1px solid #cbd6e4;
          border-radius: 4px;
          background: #ffffff;
          color: #07346c;
          font-weight: 800;
          cursor: pointer;
        }

        .history-more-btn span {
          width: 10px;
          height: 10px;
          border-right: 2px solid #07346c;
          border-bottom: 2px solid #07346c;
          transform: rotate(45deg) translateY(-2px);
        }

        @media (max-width: 900px) {
          .training-main-grid,
          .training-actions {
            grid-template-columns: 1fr;
          }

          .training-actions {
            gap: 12px;
          }

          .training-info-row,
          .training-param-row {
            grid-template-columns: 1fr;
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
}

export default MLTrainingPanel;
