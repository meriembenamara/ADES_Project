import { useState } from "react";
import CategoryActionButton from "./CategoryActionButton";

const actionIcons = {
  feedback: (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d="M16 19.5v-1.2a3.3 3.3 0 0 0-3.3-3.3H7.3A3.3 3.3 0 0 0 4 18.3v1.2" />
      <circle cx="10" cy="7.5" r="3.5" />
      <path d="M17 7h3M18.5 5.5v3" />
      <path d="M15.5 13.5h4.2l1.3 1.4V10a2 2 0 0 0-2-2h-2.5" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4.5v5h5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  ),
  upload: (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d="M12 15V4.5" />
      <path d="m7.5 9 4.5-4.5L16.5 9" />
      <path d="M5 16.5v1.8a2.2 2.2 0 0 0 2.2 2.2h9.6a2.2 2.2 0 0 0 2.2-2.2v-1.8" />
    </svg>
  ),
  delete: (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M18 7l-.8 12a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7" />
      <path d="M10 11v5.5M14 11v5.5" />
    </svg>
  ),
};

function ClassManagementSection({
  classrooms,
  feedback,
  onAddClass,
  onAddCategory,
  onAction,
  onUploadDocument,
  onStartLabeling,
}) {
  const [openClassIds, setOpenClassIds] = useState(() => classrooms.map((item) => item.id));

  const toggleClassroom = (classId) => {
    setOpenClassIds((prev) =>
      prev.includes(classId) ? prev.filter((item) => item !== classId) : [...prev, classId],
    );
  };

  return (
    <section className="workspace-section">
      <div className="workspace-section-header">
        <div>
          <h3 className="workspace-hero-title mb-0">Gestion des Classes</h3>
        </div>

        <div className="workspace-header-actions">
          <button type="button" className="btn auth-submit-btn classes-add-btn" onClick={onAddClass}>
            + Ajouter Classe
          </button>
          <button type="button" className="btn classes-category-btn" onClick={onAddCategory}>
            + Ajouter Categorie
          </button>
        </div>
      </div>

      {feedback ? <div className="alert alert-info workspace-inline-alert">{feedback}</div> : null}

      <div className="classes-board">
        {classrooms.map((classroom, classIndex) => {
          const isOpen = openClassIds.includes(classroom.id);

          return (
            <article key={classroom.id} className="class-block">
              <button
                type="button"
                className="class-block-head"
                onClick={() => toggleClassroom(classroom.id)}
              >
                <span>{`Classe ${String.fromCharCode(65 + classIndex)}`}</span>
                <span className="class-chevron">{isOpen ? "v" : ">"}</span>
              </button>

              {isOpen ? (
                <div className="class-block-body">
                  {classroom.categories.map((category, categoryIndex) => (
                    <div key={category.id} className="category-block">
                      <div className="category-line">
                        <div className="category-title-group">
                          <span className="line-chevron">v</span>
                          <span className="category-display-name">{`Categorie ${categoryIndex + 1}`}</span>
                        </div>

                        <div className="category-actions">
                          <CategoryActionButton
                            variant="info"
                            className="icon-only"
                            title="Avis users"
                            onClick={() => onAction("Avis user", category)}
                          >
                            {actionIcons.feedback}
                          </CategoryActionButton>
                          <CategoryActionButton
                            variant="history"
                            className="icon-only"
                            title="Historique"
                            onClick={() => onAction("Historique", category)}
                          >
                            {actionIcons.history}
                          </CategoryActionButton>
                          <label className="category-upload-trigger" title="Upload PDF">
                            <input
                              type="file"
                              accept="application/pdf"
                              className="category-upload-input"
                              aria-label="Upload PDF"
                              onChange={(event) => {
                                const [file] = event.target.files ?? [];
                                onUploadDocument(category.id, file);
                                event.target.value = "";
                              }}
                            />
                            <span className="category-action-btn upload icon-only">{actionIcons.upload}</span>
                          </label>
                          <CategoryActionButton
                            variant="danger"
                            className="icon-only"
                            title="Supprimer"
                            onClick={() => onAction("Delete", category)}
                          >
                            {actionIcons.delete}
                          </CategoryActionButton>
                        </div>
                      </div>

                      {(category.children ?? []).map((child) => (
                        <div key={child} className="subcategory-line">
                          <div className="category-title-group">
                            <span className="line-chevron">{">"}</span>
                            <span className="subcategory-name">{child}</span>
                          </div>

                          <div className="category-actions">
                            <CategoryActionButton
                              variant="info"
                              className="icon-only"
                              title="Avis users"
                              onClick={() => onAction("Avis user", category)}
                            >
                              {actionIcons.feedback}
                            </CategoryActionButton>
                            <CategoryActionButton
                              variant="history"
                              className="icon-only"
                              title="Historique"
                              onClick={() => onAction("Historique", category)}
                            >
                              {actionIcons.history}
                            </CategoryActionButton>
                            <label className="category-upload-trigger" title="Upload PDF">
                              <input
                                type="file"
                                accept="application/pdf"
                                className="category-upload-input"
                                aria-label="Upload PDF"
                                onChange={(event) => {
                                  const [file] = event.target.files ?? [];
                                  onUploadDocument(category.id, file);
                                  event.target.value = "";
                                }}
                              />
                              <span className="category-action-btn upload icon-only">{actionIcons.upload}</span>
                            </label>
                            <CategoryActionButton
                              variant="danger"
                              className="icon-only"
                              title="Supprimer"
                              onClick={() => onAction("Delete", category)}
                            >
                              {actionIcons.delete}
                            </CategoryActionButton>
                          </div>
                        </div>
                      ))}

                      {category.activeDocument ? (
                        <div className="category-document-panel">
                          <div className="category-document-summary">
                            <div>
                              <p className="workspace-section-kicker mb-2">Document PDF</p>
                              <h4 className="labeling-title mb-1">{category.activeDocument.name}</h4>
                              <p className="workspace-section-copy mb-0">
                                Visualisation directe du document avant le labeling.
                              </p>
                            </div>
                            <button
                              type="button"
                              className="btn auth-submit-btn category-labeling-btn"
                              onClick={() => onStartLabeling(category)}
                            >
                              Labeling
                            </button>
                          </div>

                          <div className="category-document-viewer">
                            <iframe
                              title={`preview-${category.id}`}
                              src={category.activeDocument.url}
                              className="category-document-frame"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="category-empty-document">
                          <p className="workspace-section-copy mb-0">
                            Aucun PDF importe pour cette categorie. Utilisez `Upload PDF` puis ouvrez le labeling.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ClassManagementSection;
