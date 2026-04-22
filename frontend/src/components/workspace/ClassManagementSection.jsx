import { useState } from "react";
import CategoryActionButton from "./CategoryActionButton";

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
                          <CategoryActionButton variant="info" onClick={() => onAction("Avis user", category)}>
                            Avis Users
                          </CategoryActionButton>
                          <CategoryActionButton variant="history" onClick={() => onAction("Historique", category)}>
                            Historique
                          </CategoryActionButton>
                          <label className="category-upload-trigger">
                            <input
                              type="file"
                              accept="application/pdf"
                              className="category-upload-input"
                              onChange={(event) => {
                                const [file] = event.target.files ?? [];
                                onUploadDocument(category.id, file);
                                event.target.value = "";
                              }}
                            />
                            <span className="category-action-btn upload">Upload PDF</span>
                          </label>
                          <CategoryActionButton variant="danger" onClick={() => onAction("Delete", category)}>
                            Supprimer
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
                            <CategoryActionButton variant="info" onClick={() => onAction("Avis user", category)}>
                              Avis Users
                            </CategoryActionButton>
                            <CategoryActionButton variant="history" onClick={() => onAction("Historique", category)}>
                              Historique
                            </CategoryActionButton>
                            <label className="category-upload-trigger">
                              <input
                                type="file"
                                accept="application/pdf"
                                className="category-upload-input"
                                onChange={(event) => {
                                  const [file] = event.target.files ?? [];
                                  onUploadDocument(category.id, file);
                                  event.target.value = "";
                                }}
                              />
                              <span className="category-action-btn upload">Upload PDF</span>
                            </label>
                            <CategoryActionButton variant="danger" onClick={() => onAction("Delete", category)}>
                              Supprimer
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
