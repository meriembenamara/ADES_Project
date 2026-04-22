function DashboardSection({
  usersCount,
  classroomsCount,
  dashboardsCount,
  documentsCount,
  controlPointsCount,
  recentDocuments,
  feedback,
}) {
  return (
    <section className="workspace-section">
      <div className="workspace-section-header">
        <div>
          <p className="workspace-section-kicker mb-2">Dashboard</p>
          <h3 className="workspace-hero-title mb-2">Vue globale de la plateforme</h3>
          <p className="workspace-section-copy mb-0">
            Suivez rapidement l'etat des users, des classes documentaires et des points de controle.
          </p>
        </div>
      </div>

      {feedback ? <div className="alert alert-info workspace-inline-alert">{feedback}</div> : null}

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <span className="dashboard-card-label">Users</span>
          <strong className="dashboard-card-value">{usersCount}</strong>
          <p className="dashboard-card-copy mb-0">Comptes disponibles dans l'espace super admin.</p>
        </article>
        <article className="dashboard-card">
          <span className="dashboard-card-label">Classes</span>
          <strong className="dashboard-card-value">{classroomsCount}</strong>
          <p className="dashboard-card-copy mb-0">Classes documentaires organisees dans le systeme.</p>
        </article>
        <article className="dashboard-card">
          <span className="dashboard-card-label">Dashboards</span>
          <strong className="dashboard-card-value">{dashboardsCount}</strong>
          <p className="dashboard-card-copy mb-0">Configurations dashboard disponibles.</p>
        </article>
        <article className="dashboard-card">
          <span className="dashboard-card-label">Points de controle</span>
          <strong className="dashboard-card-value">{controlPointsCount}</strong>
          <p className="dashboard-card-copy mb-0">Regles actives appliquees a l'analyse documentaire.</p>
        </article>
      </div>

      <div className="dashboard-detail-grid">
        <article className="dashboard-panel">
          <div className="dashboard-panel-head">
            <h4 className="dashboard-panel-title mb-0">Activite recente</h4>
            <span className="category-status-chip">{documentsCount} documents</span>
          </div>
          <div className="dashboard-activity-list">
            {recentDocuments.map((item) => (
              <div key={item.id} className="dashboard-activity-item">
                <div>
                  <strong>{item.title}</strong>
                  <p className="mb-0">{item.creator?.name ?? "Sans createur"}</p>
                </div>
                <div className="dashboard-activity-meta">
                  <span>{item.status}</span>
                  <small>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}</small>
                </div>
              </div>
            ))}
            {!recentDocuments.length ? <p className="mb-0">Aucune activite pour le moment.</p> : null}
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-head">
            <h4 className="dashboard-panel-title mb-0">Resume metier</h4>
          </div>
          <div className="dashboard-summary-stack">
            <div className="dashboard-summary-line">
              <span>Modules admin disponibles</span>
              <strong>5</strong>
            </div>
            <div className="dashboard-summary-line">
              <span>Documents en base</span>
              <strong>{documentsCount}</strong>
            </div>
            <div className="dashboard-summary-line">
              <span>Points de controle actifs</span>
              <strong>{controlPointsCount}</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export default DashboardSection;
