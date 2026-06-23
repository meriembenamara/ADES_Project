import React, { useMemo, useState } from 'react';
import mlService from '../services/mlService';

const getAttributeList = (attributeNames) =>
  attributeNames
    .split(',')
    .map((attribute) => attribute.trim())
    .filter(Boolean);

const getPredictionAttributes = (predictions) => {
  if (!predictions?.attributes) return [];

  if (Array.isArray(predictions.attributes)) {
    return predictions.attributes.map((attribute, index) => ({
      key: `${attribute.name ?? 'attribute'}-${index}`,
      name: attribute.name ?? `Attribut ${index + 1}`,
      value: attribute.value ?? '-',
      confidence: attribute.confidence,
    }));
  }

  return Object.entries(predictions.attributes).map(([name, value]) => ({
    key: name,
    name,
    value,
  }));
};

export function MLPredictionPanel({ token }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentId, setDocumentId] = useState('');
  const [attributeNames, setAttributeNames] = useState('');
  const [predictionParams, setPredictionParams] = useState({
    className: 'Classe A',
    categoryName: 'Catégorie 1',
    model: 'BERT_A_v2',
    language: 'Français',
  });
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const predictionAttributes = useMemo(() => getPredictionAttributes(predictions), [predictions]);

  const handleParamChange = (field, value) => {
    setPredictionParams((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    setSelectedFile(file);
    setPredictions(null);
    setError(null);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    handleFileSelect(event.dataTransfer.files?.[0]);
  };

  const handlePredictDocument = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError('Veuillez choisir un document PDF.');
      return;
    }

    if (!documentId.trim()) {
      setError("Veuillez renseigner l'ID backend du document pour lancer la prédiction.");
      return;
    }

    setLoading(true);
    setError(null);
    setPredictions(null);

    try {
      const attributes = getAttributeList(attributeNames);
      const response = await mlService.predictDocument(
        Number(documentId),
        attributes.length > 0 ? attributes : null,
        token,
      );
      setPredictions(response.predictions);
    } catch (err) {
      setError(err.message || 'Erreur lors de la prédiction');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsLabeling = async () => {
    if (!predictions || !documentId.trim()) return;

    try {
      await mlService.savePredictionAsLabeling(Number(documentId), predictions, token);
      setError(null);
    } catch (err) {
      setError(`Erreur lors de la sauvegarde: ${err.message}`);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPredictions(null);
    setError(null);
  };

  return (
    <div className="prediction-shell">
      <section className="prediction-window">
        <header className="prediction-window-header">
          <h2>Prediction de document</h2>
        </header>

        <form className="prediction-content" onSubmit={handlePredictDocument}>
          <div
            className={`prediction-drop-zone ${dragActive ? 'is-active' : ''}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <div className="prediction-upload-icon" aria-hidden="true">
              <span></span>
            </div>
            <p>Glissez &amp; déposez votre document ici</p>
            <strong>ou</strong>
            <label className="prediction-browse-btn">
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => {
                  handleFileSelect(event.target.files?.[0]);
                  event.target.value = '';
                }}
                disabled={loading}
              />
              <span className="file-icon" aria-hidden="true"></span>
              Parcourir les fichiers
            </label>

            <div className="prediction-file-row">
              <span className="prediction-file-name">{selectedFile?.name ?? 'facture_test.pdf'}</span>
              <span className="prediction-file-badge">PDF</span>
              <button
                type="button"
                className="prediction-delete-btn"
                aria-label="Retirer le fichier"
                title="Retirer le fichier"
                onClick={removeSelectedFile}
                disabled={loading || !selectedFile}
              >
                <span></span>
              </button>
            </div>
          </div>

          <aside className="prediction-params-card">
            <h3>Paramètres</h3>
            <div className="prediction-param-list">
              <label className="prediction-param-row">
                <span>Classe :</span>
                <input
                  className="prediction-pill-input blue"
                  value={predictionParams.className}
                  onChange={(event) => handleParamChange('className', event.target.value)}
                  disabled={loading}
                />
              </label>
              <label className="prediction-param-row">
                <span>Catégorie :</span>
                <input
                  className="prediction-pill-input blue"
                  value={predictionParams.categoryName}
                  onChange={(event) => handleParamChange('categoryName', event.target.value)}
                  disabled={loading}
                />
              </label>
              <label className="prediction-param-row">
                <span>Modèle :</span>
                <input
                  className="prediction-pill-input green"
                  value={predictionParams.model}
                  onChange={(event) => handleParamChange('model', event.target.value)}
                  disabled={loading}
                />
              </label>
              <label className="prediction-param-row">
                <span>Langue :</span>
                <select
                  value={predictionParams.language}
                  onChange={(event) => handleParamChange('language', event.target.value)}
                  disabled={loading}
                >
                  <option>Français</option>
                  <option>Anglais</option>
                  <option>Arabe</option>
                </select>
              </label>
              <label className="prediction-param-row prediction-document-id-row">
                <span>ID document :</span>
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 12"
                  value={documentId}
                  onChange={(event) => setDocumentId(event.target.value)}
                  disabled={loading}
                />
              </label>
              <label className="prediction-attributes-row">
                <span>Attributs :</span>
                <input
                  type="text"
                  placeholder="Montant, Date, Fournisseur"
                  value={attributeNames}
                  onChange={(event) => setAttributeNames(event.target.value)}
                  disabled={loading}
                />
              </label>
            </div>
            <button type="submit" className="prediction-launch-btn" disabled={loading}>
              {loading ? 'Prédiction en cours...' : 'Lancer la Prédiction'}
            </button>
          </aside>
        </form>

        {error ? <div className="prediction-error">{error}</div> : null}

        {predictions ? (
          <section className="prediction-results">
            <div>
              <h3>Résultats de la prédiction</h3>
              {predictions.label ? (
                <p>
                  Classification: <strong>{predictions.label}</strong>
                  {predictions.confidence ? ` (${(predictions.confidence * 100).toFixed(1)}%)` : ''}
                </p>
              ) : null}
            </div>
            {predictionAttributes.length > 0 ? (
              <div className="prediction-results-grid">
                {predictionAttributes.map((attribute) => (
                  <div key={attribute.key} className="prediction-result-item">
                    <span>{attribute.name}</span>
                    <strong>{attribute.value}</strong>
                    {attribute.confidence ? <small>{(attribute.confidence * 100).toFixed(1)}%</small> : null}
                  </div>
                ))}
              </div>
            ) : null}
            <button type="button" className="prediction-save-btn" onClick={handleSaveAsLabeling}>
              Sauvegarder comme labeling
            </button>
          </section>
        ) : null}
      </section>

      <style>{`
        .prediction-shell {
          background: transparent;
          padding: 0;
          min-height: 100%;
        }

        .prediction-window {
          max-width: none;
          margin: 0;
          background: #ffffff;
          border: 1px solid #d9e2ee;
          border-radius: 0;
          box-shadow: none;
          color: #2d4263;
          overflow: hidden;
        }

        .prediction-window-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px;
          border-bottom: 1px solid #d9e2ee;
          background: #f9fbfe;
        }

        .prediction-window-header h2 {
          margin: 0;
          color: #3a5277;
          font-size: 1.05rem;
          font-weight: 700;
        }

        .prediction-content {
          display: grid;
          grid-template-columns: minmax(280px, 1fr) minmax(290px, 420px);
          gap: 38px;
          padding: 22px 32px 24px;
          align-items: start;
        }

        .prediction-drop-zone {
          min-height: 384px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          border: 2px dashed #ccd7e7;
          border-radius: 6px;
          background: #ffffff;
          padding: 26px;
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .prediction-drop-zone.is-active {
          border-color: #3f7fc9;
          background: #f7fbff;
        }

        .prediction-upload-icon {
          width: 82px;
          height: 58px;
          position: relative;
        }

        .prediction-upload-icon::before,
        .prediction-upload-icon::after {
          content: "";
          position: absolute;
          background: #405b7b;
        }

        .prediction-upload-icon::before {
          left: 13px;
          right: 13px;
          bottom: 0;
          height: 36px;
          border-radius: 22px;
        }

        .prediction-upload-icon::after {
          left: 25px;
          top: 10px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
        }

        .prediction-upload-icon span {
          position: absolute;
          left: 50%;
          top: 26px;
          z-index: 1;
          width: 17px;
          height: 28px;
          background: #ffffff;
          transform: translateX(-50%);
          border-radius: 2px;
        }

        .prediction-upload-icon span::before {
          content: "";
          position: absolute;
          left: 50%;
          top: -12px;
          width: 20px;
          height: 20px;
          border-left: 9px solid #ffffff;
          border-top: 9px solid #ffffff;
          transform: translateX(-50%) rotate(45deg);
        }

        .prediction-drop-zone p,
        .prediction-drop-zone strong {
          margin: 0;
          color: #31496c;
          font-size: 16px;
          font-weight: 700;
        }

        .prediction-drop-zone strong {
          font-size: 14px;
        }

        .prediction-browse-btn {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid #2c70bf;
          border-radius: 4px;
          padding: 0 20px;
          background: linear-gradient(180deg, #3f8bdd 0%, #1e68be 100%);
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24);
        }

        .prediction-browse-btn input {
          display: none;
        }

        .file-icon {
          position: relative;
          width: 15px;
          height: 16px;
          border: 2px solid #ffffff;
          border-radius: 2px;
        }

        .file-icon::after {
          content: "";
          position: absolute;
          left: 3px;
          top: 4px;
          width: 7px;
          height: 4px;
          border-left: 2px solid #ffffff;
          border-bottom: 2px solid #ffffff;
          transform: rotate(-45deg);
        }

        .prediction-file-row {
          width: 100%;
          min-height: 56px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto 34px;
          align-items: center;
          gap: 10px;
          margin-top: 18px;
          padding: 10px 12px 10px 20px;
          border: 1px solid #d8e0ec;
          border-radius: 5px;
          background: #ffffff;
        }

        .prediction-file-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #2b4264;
          font-size: 15px;
          font-weight: 700;
        }

        .prediction-file-badge {
          padding: 5px 8px;
          border-radius: 4px;
          background: #42a85c;
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
        }

        .prediction-delete-btn {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .prediction-delete-btn:disabled {
          opacity: 0.45;
          cursor: default;
        }

        .prediction-delete-btn span {
          position: relative;
          width: 13px;
          height: 15px;
          border-radius: 1px 1px 3px 3px;
          background: #f13d45;
        }

        .prediction-delete-btn span::before {
          content: "";
          position: absolute;
          left: -1px;
          top: -4px;
          width: 15px;
          height: 3px;
          border-radius: 2px;
          background: #f13d45;
        }

        .prediction-params-card {
          border: 1px solid #dce3ed;
          border-radius: 0;
          background: #ffffff;
          overflow: hidden;
        }

        .prediction-params-card h3 {
          margin: 0;
          padding: 15px 18px;
          border-bottom: 1px solid #e5ebf3;
          background: #f9fbfe;
          color: #31496c;
          font-size: 16px;
          font-weight: 800;
        }

        .prediction-param-list {
          display: grid;
          gap: 14px;
          padding: 18px 18px 16px;
        }

        .prediction-param-row,
        .prediction-attributes-row {
          display: grid;
          grid-template-columns: minmax(110px, 1fr) minmax(130px, 170px);
          align-items: center;
          gap: 18px;
          min-height: 36px;
        }

        .prediction-attributes-row {
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .prediction-param-row span,
        .prediction-attributes-row span {
          color: #31496c;
          font-size: 14px;
          font-weight: 800;
        }

        .prediction-pill-input {
          justify-self: start;
          width: auto;
          max-width: 148px;
          min-height: 28px;
          border: 0;
          border-radius: 4px;
          padding: 4px 10px;
          color: #ffffff;
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          text-align: center;
        }

        .prediction-pill-input.blue {
          background: #3f7fc9;
        }

        .prediction-pill-input.green {
          background: #42a85c;
        }

        .prediction-param-row select,
        .prediction-param-row input:not(.prediction-pill-input),
        .prediction-attributes-row input {
          width: 100%;
          min-height: 38px;
          border: 1px solid #cfd8e6;
          border-radius: 4px;
          background: #ffffff;
          color: #31496c;
          font: inherit;
          font-size: 14px;
          font-weight: 700;
          padding: 7px 12px;
        }

        .prediction-document-id-row {
          padding-top: 8px;
          border-top: 1px solid #edf1f6;
        }

        .prediction-launch-btn {
          width: calc(100% - 36px);
          min-height: 44px;
          margin: 0 18px 16px;
          border: 1px solid #3f9f52;
          border-radius: 4px;
          background: linear-gradient(180deg, #62bc70 0%, #3d994e 100%);
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24);
        }

        .prediction-launch-btn:disabled {
          opacity: 0.72;
          cursor: not-allowed;
        }

        .prediction-error {
          margin: 0 32px 22px;
          padding: 11px 14px;
          border: 1px solid #f4b8bd;
          border-radius: 4px;
          background: #fff0f1;
          color: #bd2430;
          font-size: 14px;
          font-weight: 700;
        }

        .prediction-results {
          margin: 0 32px 28px;
          padding: 16px;
          border: 1px solid #dce3ed;
          border-radius: 4px;
          background: #fbfcfe;
        }

        .prediction-results h3,
        .prediction-results p {
          margin: 0 0 12px;
          color: #31496c;
        }

        .prediction-results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 10px;
          margin-bottom: 14px;
        }

        .prediction-result-item {
          display: grid;
          gap: 4px;
          padding: 12px;
          border: 1px solid #d9e8dc;
          border-radius: 4px;
          background: #ffffff;
        }

        .prediction-result-item span {
          color: #31496c;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .prediction-result-item strong {
          color: #23813a;
          font-size: 15px;
        }

        .prediction-result-item small {
          color: #63758f;
          font-weight: 700;
        }

        .prediction-save-btn {
          min-height: 38px;
          border: 1px solid #2c70bf;
          border-radius: 4px;
          padding: 0 16px;
          background: linear-gradient(180deg, #3f8bdd 0%, #1e68be 100%);
          color: #ffffff;
          font-weight: 800;
          cursor: pointer;
        }

        @media (max-width: 860px) {
          .prediction-content {
            grid-template-columns: 1fr;
            gap: 18px;
            padding: 18px;
          }

          .prediction-drop-zone {
            min-height: 320px;
          }

          .prediction-error,
          .prediction-results {
            margin-left: 18px;
            margin-right: 18px;
          }
        }

        @media (max-width: 520px) {
          .prediction-window-header {
            padding: 16px;
          }

          .prediction-window-header h2 {
            font-size: 20px;
          }

          .prediction-param-row {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .prediction-file-row {
            grid-template-columns: minmax(0, 1fr) auto 30px;
            padding-left: 12px;
          }
        }
      `}</style>
    </div>
  );
}

export default MLPredictionPanel;
