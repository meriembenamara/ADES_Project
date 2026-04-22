function SignUpForm({ form, onChange, onSubmit, submitting }) {
  return (
    <form onSubmit={onSubmit} className="auth-form">
      <div className="mb-3">
        <label className="form-label auth-label">Full name</label>
        <input
          className="form-control form-control-lg auth-input"
          type="text"
          required
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Your full name"
        />
      </div>

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
          placeholder="Strong password"
        />
      </div>

      <button className="btn auth-submit-btn w-100" type="submit" disabled={submitting}>
        {submitting ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}

export default SignUpForm;
