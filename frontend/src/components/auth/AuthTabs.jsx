function AuthTabs({ mode, onModeChange }) {
  return (
    <div className="auth-tabs mb-4" role="tablist" aria-label="Authentication mode">
      <button
        type="button"
        className={`auth-tab ${mode === "signin" ? "active" : ""}`}
        onClick={() => onModeChange("signin")}
      >
        Sign in
      </button>
      <button
        type="button"
        className={`auth-tab ${mode === "signup" ? "active" : ""}`}
        onClick={() => onModeChange("signup")}
      >
        Sign up
      </button>
    </div>
  );
}

export default AuthTabs;
