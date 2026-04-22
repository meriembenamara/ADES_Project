function SignInForm({ form, onChange, onSubmit, submitting }) {
  return (
    <form onSubmit={onSubmit} className="auth-form">
      <div className="mb-3">
        <label className="form-label auth-label">Email address</label>
        <input
          className="form-control form-control-lg auth-input"
          type="email"
          required
          value={form.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="mb-3">
        <label className="form-label auth-label">Password</label>
        <input
          className="form-control form-control-lg auth-input"
          type="password"
          required
          value={form.password}
          onChange={(e) => onChange("password", e.target.value)}
          placeholder="Your password"
        />
      </div>

      <button className="btn auth-submit-btn w-100" type="submit" disabled={submitting}>
        {submitting ? "Connecting..." : "Sign in"}
      </button>
    </form>
  );
}

export default SignInForm;
