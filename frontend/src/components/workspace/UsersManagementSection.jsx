function UsersManagementSection({ users, feedback, onHistory, onDelete }) {
  return (
    <section className="workspace-section">
      <div className="workspace-section-header">
        <div>
          <p className="workspace-section-kicker mb-2">Gestion des users</p>
          <h3 className="workspace-section-title mb-2">Liste des utilisateurs</h3>
          <p className="workspace-section-copy mb-0">
            Le super admin peut consulter les comptes, afficher l'historique d'un user
            ou supprimer un utilisateur.
          </p>
        </div>
      </div>

      {feedback ? <div className="alert alert-info workspace-inline-alert">{feedback}</div> : null}

      <div className="users-table-card">
        <div className="users-table-head">
          <span>Full name</span>
          <span>Email</span>
          <span>Actions</span>
        </div>

        <div className="users-table-body">
          {users.map((userItem) => (
            <div key={userItem.id} className="users-table-row">
              <div className="users-cell users-name-cell">
                <strong>{userItem.fullName ?? userItem.name}</strong>
              </div>
              <div className="users-cell">
                <span>{userItem.email}</span>
              </div>
              <div className="users-cell users-actions-cell">
                <button type="button" className="category-action-btn history" onClick={() => onHistory(userItem)}>
                  Historique
                </button>
                <button type="button" className="category-action-btn danger" onClick={() => onDelete(userItem)}>
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default UsersManagementSection;
