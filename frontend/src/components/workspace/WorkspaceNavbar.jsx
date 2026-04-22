import { useState } from "react";
import { primaryNavItems } from "../../data/mockWorkspace";

function NavIcon({ icon }) {
  return <span className="workspace-nav-icon" aria-hidden="true">{icon}</span>;
}

const navIcons = {
  dashboard: (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M4 5.5h7v5.5H4zM13 5.5h7v8h-7zM4 13h7v5.5H4zM13 15.5h7V21h-7z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M12 12a3.75 3.75 0 1 0-3.75-3.75A3.75 3.75 0 0 0 12 12zm-6.5 7a6.5 6.5 0 0 1 13 0" />
      <path d="M18.75 11.25a2.75 2.75 0 1 0-2.38-4.12M19.5 19a5.4 5.4 0 0 0-1.38-3.63" />
    </svg>
  ),
  documents: (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M7 3.75h7l4 4V20.25H7z" />
      <path d="M14 3.75v4h4M9 12h6M9 15.5h6" />
    </svg>
  ),
  classes: (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M3.75 8 12 4l8.25 4L12 12zM6 10.5v4.25c0 1.8 2.68 3.25 6 3.25s6-1.45 6-3.25V10.5" />
    </svg>
  ),
  "control-points": (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M6 12h12M6 7h8M6 17h5" />
      <circle cx="16.5" cy="7" r="1.5" />
      <circle cx="10.5" cy="17" r="1.5" />
      <circle cx="13.5" cy="12" r="1.5" />
    </svg>
  ),
};

function WorkspaceNavbar({ activeSection, onSectionChange, user, onSignOut, submitting }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`workspace-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="workspace-sidebar-top">
        <div className="workspace-brand">
          <div className="workspace-brand-badge">A</div>
          <div className="workspace-brand-copy">
            <p className="workspace-kicker mb-1">ADES Document Platform</p>
            <h2 className="workspace-title mb-0">Espace Super Admin</h2>
          </div>
        </div>
        <button
          type="button"
          className="workspace-sidebar-toggle"
          onClick={() => setIsCollapsed((collapsed) => !collapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={isCollapsed}
        >
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      </div>

      <nav className="workspace-nav" aria-label="Main navigation">
        {primaryNavItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`workspace-nav-link ${activeSection === item.id ? "active" : ""}`}
            onClick={() => onSectionChange(item.id)}
            aria-label={item.label}
            title={isCollapsed ? item.label : undefined}
          >
            <NavIcon icon={navIcons[item.id]} />
            <span className="workspace-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="workspace-userbox">
        <div className="workspace-user-meta">
          <p className="workspace-user-label mb-1">Session active</p>
          <p className="workspace-user-value mb-0">{user?.name}</p>
          <p className="workspace-user-email mb-0">{user?.email}</p>
        </div>
        <button
          className="btn auth-secondary-btn"
          type="button"
          onClick={onSignOut}
          disabled={submitting}
        >
          <span className="workspace-signout-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M14 7l5 5-5 5M19 12H9" />
              <path d="M11 5H6.75A1.75 1.75 0 0 0 5 6.75v10.5A1.75 1.75 0 0 0 6.75 19H11" />
            </svg>
          </span>
          <span className="workspace-signout-label">
            {submitting ? "Signing out..." : "Sign out"}
          </span>
        </button>
      </div>
    </aside>
  );
}

export default WorkspaceNavbar;
