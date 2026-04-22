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
  onSnippetPick,
  onSaveLabel,
  onBack,
}) {
  const [selectionMode, setSelectionMode] = useState("attribute");

  const attributePreview = useMemo(() => {
    if (!draftAttributeSnippet) {
      return "Aucun extrait attribut selectionne";
    }

    return draftAttributeSnippet;
  }, [draftAttributeSnippet]);

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

          {category.activeDocument?.url ? (
            <>
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

              <PdfLabelingViewer
                fileData={category.activeDocument.data}
                selectionMode={selectionMode}
                onAttributeSelect={onDraftAttributeSnippetChange}
                onValueSelect={onSnippetPick}
              />
            </>
          ) : (
            <>
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
            </>
          )}
        </article>

        <article className="labeling-side-card">
          <p className="workspace-section-kicker mb-2">Attributs</p>
          <h4 className="labeling-title mb-3">Extraction ciblee</h4>
          <div className="mb-3">
            <label className="form-label auth-label">Attribut</label>
            <select
              className="form-select auth-input"
              value={draftAttribute}
              onChange={(event) => onDraftAttributeChange(event.target.value)}
            >
              <option value="">Choisir un attribut</option>
              {category.attributeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="labeling-selection-preview mb-3">
            <div className="labeling-preview-pill attribute-pill">
              <span>Zone attribut</span>
              <strong>{attributePreview}</strong>
            </div>
            <div className="labeling-preview-pill value-pill">
              <span>Zone valeur</span>
              <strong>{draftValue || "Aucune valeur selectionnee"}</strong>
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label auth-label">Valeur selectionnee</label>
            <textarea
              className="form-control auth-input"
              rows="4"
              value={draftValue}
              onChange={(event) => onDraftValueChange(event.target.value)}
              placeholder="Cliquez sur une zone du document ou tapez la valeur manuellement"
            />
          </div>
          <button type="button" className="btn auth-submit-btn w-100" onClick={onSaveLabel}>
            Enregistrer le labeling
          </button>
          <div className="labeling-result-list">
            {category.labeledFields.map((field) => (
              <div key={field.id} className="labeling-result-item">
                <span className="label-chip" style={{ backgroundColor: field.attributeColor ?? "#f2c94c" }}>
                  {field.attribute}
                </span>
                <span className="label-chip" style={{ backgroundColor: "#fff5c8" }}>
                  {field.attributeSnippet ?? "Zone attribut non definie"}
                </span>
                <strong className="label-chip" style={{ backgroundColor: field.valueColor ?? "#56ccf2" }}>
                  {field.value}
                </strong>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

export default LabelingWorkspace;
