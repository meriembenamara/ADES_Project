import { useState } from "react";

function UsersManagementSection({ users, feedback, onHistory, onDelete }) {
  const [userToDelete, setUserToDelete] = useState(null);

  const handleRequestDelete = (userItem) => {
    setUserToDelete(userItem);
  };

  const handleCancelDelete = () => {
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) {
      return;
    }

    await onDelete(userToDelete);
    setUserToDelete(null);
  };

  return (
    <>
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
            {users.length === 0 ? (
              <div className="users-table-row">
                <div className="users-cell users-name-cell">
                  <strong>Aucun utilisateur</strong>
                </div>
                <div className="users-cell">
                  <span>Les nouveaux comptes apparaissent ici apres inscription.</span>
                </div>
                <div className="users-cell users-actions-cell" />
              </div>
            ) : (
              users.map((userItem) => (
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
                    <button
                      type="button"
                      className="category-action-btn danger"
                      onClick={() => handleRequestDelete(userItem)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {userToDelete ? (
        <div className="workspace-modal-backdrop" role="presentation" onClick={handleCancelDelete}>
          <div
            className="workspace-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-user-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="workspace-modal-kicker mb-2">Confirmation</p>
            <h4 id="delete-user-modal-title" className="workspace-modal-title mb-2">
              Supprimer cet utilisateur ?
            </h4>
            <p className="workspace-modal-copy mb-0">
              Voulez-vous vraiment supprimer{" "}
              <strong>{userToDelete.fullName ?? userToDelete.name}</strong> ({userToDelete.email}) ?
            </p>
            <div className="workspace-modal-actions">
              <button type="button" className="btn auth-secondary-btn" onClick={handleCancelDelete}>
                Annuler
              </button>
              <button type="button" className="category-action-btn danger" onClick={() => void handleConfirmDelete()}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default UsersManagementSection;
