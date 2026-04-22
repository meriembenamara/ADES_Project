function ControlPointsSection({
  points,
  feedback,
  form,
  documents,
  users,
  onFormChange,
  onReset,
  onAdd,
  onDelete,
}) {
  const completion = [form.name, form.status].filter(Boolean).length;

  return (
    <section className="workspace-section">
      <div className="workspace-section-header">
        <div>
          <h3 className="workspace-hero-title mb-0">Point de Controle</h3>
          <p className="workspace-section-copy mt-2 mb-0">
            Definissez les regles metier de validation documentaire par classe, categorie et attribut.
          </p>
        </div>
      </div>

      {feedback ? <div className="alert alert-info workspace-inline-alert">{feedback}</div> : null}

      <div className="control-panel">
        <div className="control-summary-grid">
          <article className="control-summary-card">
            <span className="control-summary-label">Regles actives</span>
            <strong>{points.length}</strong>
          </article>
          <article className="control-summary-card">
            <span className="control-summary-label">Documents lies</span>
            <strong>{points.filter((item) => item.document).length}</strong>
          </article>
          <article className="control-summary-card">
            <span className="control-summary-label">Configuration</span>
            <strong>{`${completion}/2 champs`}</strong>
          </article>
        </div>

        <div className="control-form-panel">
          <div className="control-form-row">
            <div className="control-select-card">
              <label className="form-label auth-label">Nom</label>
              <input
                className="form-control auth-input"
                type="text"
                value={form.name}
                onChange={(e) => onFormChange("name", e.target.value)}
                placeholder="Ex: Verification date facture"
              />
            </div>

            <div className="control-select-card">
              <label className="form-label auth-label">Status</label>
              <select className="form-select auth-input" value={form.status} onChange={(e) => onFormChange("status", e.target.value)}>
                <option value="todo">todo</option>
                <option value="in_progress">in_progress</option>
                <option value="done">done</option>
                <option value="blocked">blocked</option>
              </select>
            </div>

            <div className="control-select-card">
              <label className="form-label auth-label">Document</label>
              <select className="form-select auth-input" value={form.documentId} onChange={(e) => onFormChange("documentId", e.target.value)}>
                <option value="">Aucun</option>
                {documents.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-select-card">
              <label className="form-label auth-label">Assigne a</label>
              <select className="form-select auth-input" value={form.assignedTo} onChange={(e) => onFormChange("assignedTo", e.target.value)}>
                <option value="">Aucun</option>
                {users.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="control-form-row control-form-row-secondary">
            <div className="control-value-card">
              <label className="form-label auth-label">Description</label>
              <input
                className="form-control auth-input"
                type="text"
                value={form.description}
                onChange={(e) => onFormChange("description", e.target.value)}
                placeholder="Description de la regle"
              />
            </div>

            <div className="control-preview-card">
              <span className="control-summary-label">Date limite</span>
              <input
                className="form-control auth-input"
                type="date"
                value={form.dueDate}
                onChange={(e) => onFormChange("dueDate", e.target.value)}
              />
            </div>

            <div className="control-actions-stack">
              <button type="button" className="btn classes-category-btn control-add-btn" onClick={onAdd}>
                Ajouter
              </button>
              <button type="button" className="btn auth-secondary-btn" onClick={onReset}>
                Reinitialiser
              </button>
            </div>
          </div>
        </div>

        <div className="control-table-card">
          <div className="control-table-head">
            <span>Nom</span>
            <span>Status</span>
            <span>Document</span>
            <span>Assigne a</span>
            <span />
          </div>

          {points.map((point) => (
            <div key={point.id} className="control-table-row">
              <span>{point.name}</span>
              <span>{point.status}</span>
              <span>{point.document?.title ?? "-"}</span>
              <span>{point.assignee?.name ?? "-"}</span>
              <button type="button" className="table-delete-btn" onClick={() => onDelete(point.id)}>
                Supprimer
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ControlPointsSection;
