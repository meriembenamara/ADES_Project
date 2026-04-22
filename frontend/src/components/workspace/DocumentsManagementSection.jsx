function DocumentsManagementSection({
  documents,
  users,
  feedback,
  form,
  onFormChange,
  onAdd,
  onDelete,
}) {
  return (
    <section className="workspace-section">
      <div className="workspace-section-header">
        <div>
          <p className="workspace-section-kicker mb-2">Gestion des documents</p>
          <h3 className="workspace-section-title mb-2">Documents en base</h3>
          <p className="workspace-section-copy mb-0">
            Ajoutez et supprimez les documents relies a votre workflow.
          </p>
        </div>
      </div>

      {feedback ? <div className="alert alert-info workspace-inline-alert">{feedback}</div> : null}

      <div className="control-form-panel mb-4">
        <div className="control-form-row">
          <div className="control-select-card">
            <label className="form-label auth-label">Titre</label>
            <input
              className="form-control auth-input"
              type="text"
              value={form.title}
              onChange={(e) => onFormChange("title", e.target.value)}
              placeholder="Titre document"
            />
          </div>
          <div className="control-select-card">
            <label className="form-label auth-label">Status</label>
            <select
              className="form-select auth-input"
              value={form.status}
              onChange={(e) => onFormChange("status", e.target.value)}
            >
              <option value="draft">draft</option>
              <option value="in_review">in_review</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </div>
          <div className="control-select-card">
            <label className="form-label auth-label">Createur</label>
            <select
              className="form-select auth-input"
              value={form.createdBy}
              onChange={(e) => onFormChange("createdBy", e.target.value)}
            >
              <option value="">Aucun</option>
              {users.map((userItem) => (
                <option key={userItem.id} value={userItem.id}>
                  {userItem.name}
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
              placeholder="Description"
            />
          </div>
          <div className="control-actions-stack">
            <button type="button" className="btn classes-category-btn control-add-btn" onClick={onAdd}>
              Ajouter
            </button>
          </div>
        </div>
      </div>

      <div className="control-table-card">
        <div className="control-table-head">
          <span>Titre</span>
          <span>Status</span>
          <span>Createur</span>
          <span />
        </div>

        {documents.map((item) => (
          <div key={item.id} className="control-table-row">
            <span>{item.title}</span>
            <span>{item.status}</span>
            <span>{item.creator?.name ?? "-"}</span>
            <button type="button" className="table-delete-btn" onClick={() => onDelete(item.id)}>
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default DocumentsManagementSection;
