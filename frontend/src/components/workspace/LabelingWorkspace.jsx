import { useMemo, useState } from "react";
import PdfLabelingViewer from "./PdfLabelingViewer";

function LabelingWorkspace({
  category,
  draftAttribute,
  draftAttributeSnippet,
  draftValue,
  onDraftAttributeChange,
  onDraftAttributeSnippetChange,
  onDraftValueChange,
  onDraftLabelIdChange,
  onSnippetPick,
  onAddDraftLabel,
  onSaveLabel,
  onGoToTraining,
  onGoToPredictions,
  onBack,
}) {
  const [selectionMode, setSelectionMode] = useState("attribute");

  const handleSaveAndMaybeGo = async () => {
    await onSaveLabel();
  };

  const displayedAttributes = useMemo(() => {
    const rows = new Map();

    category.attributeOptions.forEach((option) => {
      rows.set(option, {
        attribute: option,
        value: "",
        attributeSnippet: "",
        isPending: false,
      });
    });

    category.labeledFields.forEach((field) => {
      rows.set(field.attribute, field);
    });

    const draftAttributeName = (draftAttribute || draftAttributeSnippet).trim();
    if (draftAttributeName) {
      rows.set(draftAttributeName, {
        attribute: draftAttributeName,
        attributeSnippet: draftAttributeSnippet.trim(),
        value: draftValue,
        isDraft: true,
      });
    }

    return Array.from(rows.values());
  }, [category.attributeOptions, category.labeledFields, draftAttribute, draftAttributeSnippet, draftValue]);

  const handleSnippetSelection = (snippet) => {
    if (selectionMode === "attribute") {
      onDraftAttributeSnippetChange(snippet);
      return;
    }

    onSnippetPick(snippet);
  };

  return (
    <section className="workspace-section">
      <div className="workspace-section-header">
        <div>
          <p className="workspace-section-kicker mb-2">Labeling</p>
          <h3 className="workspace-section-title mb-2">{category.name}</h3>
          <p className="workspace-section-copy mb-0">
            Selectionnez une information dans le document puis associez-la a un attribut.
          </p>
        </div>
        <button type="button" className="btn auth-secondary-btn" onClick={onBack}>
          Retour aux classes
        </button>
      </div>

      <div className="labeling-layout">
        <article className="labeling-document-card">
          <div className="labeling-document-head">
            <div>
              <p className="workspace-section-kicker mb-2">Document</p>
              <h4 className="labeling-title mb-0">{category.documentTitle}</h4>
            </div>
            <span className="category-status-chip">{category.status}</span>
          </div>

          <div className="labeling-mode-and-view">
            <div className="labeling-mode-switch">
              <button
                type="button"
                className={`labeling-mode-btn ${selectionMode === "attribute" ? "active attribute-mode" : ""}`}
                onClick={() => setSelectionMode("attribute")}
              >
                Selection Attribut
              </button>
              <button
                type="button"
                className={`labeling-mode-btn ${selectionMode === "value" ? "active value-mode" : ""}`}
                onClick={() => setSelectionMode("value")}
              >
                Selection Valeur
              </button>
            </div>

            <p className="workspace-section-copy mb-3">
              Selectionnez directement du texte dans le PDF. La surbrillance suit l'etape active.
            </p>

            {category.activeDocument?.url ? (
              <PdfLabelingViewer
                fileData={category.activeDocument.data}
                selectionMode={selectionMode}
                onAttributeSelect={onDraftAttributeSnippetChange}
                onValueSelect={onSnippetPick}
              />
            ) : (
              <div className="labeling-document-body">
                {category.documentSnippets.map((snippet) => {
                  const isAttributeSnippet = draftAttributeSnippet === snippet;
                  const isValueSnippet = draftValue === snippet;
                  const stateClass = isAttributeSnippet
                    ? "is-attribute"
                    : isValueSnippet
                      ? "is-value"
                      : "";

                  return (
                    <button
                      key={snippet}
                      type="button"
                      className={`document-snippet ${stateClass}`}
                      onClick={() => handleSnippetSelection(snippet)}
                    >
                      {snippet}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </article>

        <aside className="labeling-side-card attributes-panel">
          <div className="attributes-header">
            <p className="workspace-section-kicker">Attributs & Valeurs</p>
            <h4 className="labeling-title mb-1">Extraction ciblée</h4>
            <p className="workspace-section-copy small">Editez les valeurs detectees puis validez.</p>
          </div>

          <div className="attributes-list">
            {displayedAttributes.map((field) => (
              <div className={`attr-row ${field.isPending ? "is-pending" : ""}`} key={field.id ?? field.attribute}>
                <div className="attr-label">
                  <strong>{field.attribute}</strong>
                  <div className="attr-value">{field.value || '—'}</div>
                  {field.attributeSnippet ? (
                    <small className="attr-snippet">{field.attributeSnippet}</small>
                  ) : null}
                </div>
                <div className="attr-actions">
                  {field.isPending ? <span className="attr-state">En attente</span> : null}
                  <button
                    type="button"
                    className="btn small-btn auth-secondary-btn"
                    onClick={() => {
                      onDraftLabelIdChange(field.id ?? null);
                      onDraftAttributeChange(field.attribute);
                      onDraftAttributeSnippetChange(field.attributeSnippet || field.attribute);
                      onDraftValueChange(field.value || "");
                    }}
                  >
                    Editer
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="attributes-controls">
            <button type="button" className="btn add-attr-btn" onClick={onAddDraftLabel}>
              + Ajouter un Attribut
            </button>
            <button type="button" className="btn validate-btn" onClick={handleSaveAndMaybeGo}>
              Valider
            </button>
          </div>

          <div className="labeling-ml-actions">
            <button type="button" className="btn labeling-ml-btn training" onClick={onGoToTraining}>
              <span className="labeling-ml-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M5 5h14v4H5zM5 11h14v4H5zM5 17h14v2H5z" />
                  <path d="M9 7h2v2H9zM13 7h2v2h-2zM9 13h2v2H9zM13 13h2v2h-2z" />
                </svg>
              </span>
              Entrainer
            </button>
            <button type="button" className="btn labeling-ml-btn prediction" onClick={onGoToPredictions}>
              <span className="labeling-ml-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M4.5 18.5c2.25-4.75 5-7.1 8.25-7.1 2.35 0 4.55 1.18 6.75 3.55" />
                  <path d="M5 6.5h14M5 10h8" />
                  <circle cx="16.5" cy="17" r="2.5" />
                  <path d="m18.35 18.85 1.9 1.9" />
                </svg>
              </span>
              Predire
            </button>
          </div>
        </aside>
      </div>

      <div className="labeling-bottom-strip">
        <div className="strip-inner">
          {displayedAttributes.map((field) => (
            <div className="strip-pill" key={field.id ?? field.attribute}>
              <span className="pill-key">{field.attribute}</span>
              <span className="pill-val">{field.value || '—'}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .labeling-layout {
          display: grid;
          grid-template-columns: 2fr 380px;
          gap: 18px;
          align-items: start;
        }

        .labeling-document-card {
          background: #fff;
          border: 1px solid #e6edf5;
          padding: 12px;
          border-radius: 8px;
        }

        .labeling-mode-switch {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .labeling-mode-btn {
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #cbd8ea;
          background: #f6f9fc;
          cursor: pointer;
          font-weight: 700;
        }

        .labeling-mode-btn.active {
          background: #eaf4ff;
          border-color: #8fb9ff;
        }

        .labeling-side-card.attributes-panel {
          background: #f8fbff;
          border: 1px solid #e1ebfb;
          padding: 16px;
          border-radius: 8px;
          height: fit-content;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .attributes-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 420px;
          overflow: auto;
          padding-right: 6px;
        }

        .attr-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: #ffffff;
          border: 1px solid #e6eef9;
          border-radius: 6px;
        }

        .attr-row.is-pending {
          border-color: #15aabf;
          background: #f0fcff;
        }

        .attr-label {
          display: flex;
          flex-direction: column;
        }

        .attr-value {
          color: #0f172a;
          font-weight: 700;
          margin-top: 4px;
        }

        .attr-snippet {
          color: #58708f;
          margin-top: 3px;
        }

        .attr-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .attr-state {
          color: #0b7285;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        .attr-actions .small-btn {
          padding: 6px 10px;
          font-size: 13px;
        }

        .attributes-controls {
          display: flex;
          gap: 10px;
          justify-content: space-between;
          margin-top: 8px;
        }

        .add-attr-btn {
          background: #15aabf;
          color: #fff;
          padding: 10px 12px;
          border-radius: 6px;
          border: none;
          font-weight: 800;
        }

        .validate-btn {
          background: #2f9e4a;
          color: #fff;
          padding: 10px 18px;
          border-radius: 6px;
          border: none;
          font-weight: 800;
        }

        .labeling-ml-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 2px;
          padding-top: 14px;
          border-top: 1px solid #dbeafe;
        }

        .labeling-ml-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          border: 1px solid transparent;
          border-radius: 8px;
          color: #ffffff;
          font-weight: 800;
          white-space: nowrap;
          letter-spacing: 0;
          box-shadow: 0 10px 18px rgba(15, 23, 42, 0.14);
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            filter 0.18s ease;
        }

        .labeling-ml-btn.training {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #38bdf8 100%);
          border-color: rgba(191, 219, 254, 0.72);
          box-shadow: 0 12px 22px rgba(37, 99, 235, 0.24);
        }

        .labeling-ml-btn.prediction {
          background: linear-gradient(135deg, #047857 0%, #059669 58%, #34d399 100%);
          border-color: rgba(167, 243, 208, 0.72);
          box-shadow: 0 12px 22px rgba(5, 150, 105, 0.22);
        }

        .labeling-ml-btn:hover {
          color: #ffffff;
          filter: saturate(1.06) brightness(1.02);
          transform: translateY(-1px);
        }

        .labeling-ml-btn:active {
          transform: translateY(0);
          box-shadow: 0 8px 14px rgba(15, 23, 42, 0.16);
        }

        .labeling-ml-btn:focus-visible {
          outline: 3px solid rgba(14, 165, 233, 0.28);
          outline-offset: 2px;
        }

        .labeling-ml-icon {
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .labeling-ml-icon svg {
          width: 18px;
          height: 18px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .labeling-bottom-strip {
          margin-top: 14px;
          background: #f3f6fa;
          border-radius: 6px;
          padding: 10px 12px;
        }

        .strip-inner {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .strip-pill {
          background: #fff;
          border: 1px solid #e4eef9;
          padding: 6px 10px;
          border-radius: 20px;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .pill-key { font-weight: 700; color: #234a7a }
        .pill-val { color: #0f172a }
      `}</style>
    </section>
  );
}

export default LabelingWorkspace;
