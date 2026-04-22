function AuthenticatedPanel({ user, submitting, onSignOut }) {
  return (
    <section className="auth-card auth-card-compact">
      <div className="auth-card-body">
        <h2 className="auth-panel-title mb-2">Welcome back, {user?.name}</h2>
        <p className="auth-panel-copy mb-4">
          You are connected as <strong>{user?.email}</strong>.
        </p>
        <div className="d-flex">
          <button
            className="btn auth-secondary-btn"
            type="button"
            onClick={onSignOut}
            disabled={submitting}
          >
            {submitting ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default AuthenticatedPanel;
