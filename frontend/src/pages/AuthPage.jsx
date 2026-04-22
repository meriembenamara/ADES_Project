import { useEffect, useMemo, useState } from "react";
import AuthHeader from "../components/auth/AuthHeader";
import AuthTabs from "../components/auth/AuthTabs";
import SignInForm from "../components/auth/SignInForm";
import SignUpForm from "../components/auth/SignUpForm";
import FeedbackMessage from "../components/auth/FeedbackMessage";
import AppWorkspace from "../components/workspace/AppWorkspace";
import { TOKEN_KEY } from "../constants/auth";
import { fetchCurrentUser, signIn, signOut, signUp } from "../services/authApi";

function AuthPage() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("signin");
  const [loadingMe, setLoadingMe] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [signInForm, setSignInForm] = useState({
    email: "",
    password: "",
  });

  const [signUpForm, setSignUpForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const isAuthenticated = useMemo(() => Boolean(user && token), [user, token]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoadingMe(false);
      return;
    }

    setLoadingMe(true);
    fetchCurrentUser(token)
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setLoadingMe(false));
  }, [token]);

  const updateSignInField = (field, value) => {
    setSignInForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateSignUpField = (field, value) => {
    setSignUpForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const data = await signIn(signInForm);
      localStorage.setItem(TOKEN_KEY, data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      setSuccess("Signed in successfully.");
      setSignInForm({ email: "", password: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const data = await signUp(signUpForm);
      localStorage.setItem(TOKEN_KEY, data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      setSuccess("Account created and connected.");
      setSignUpForm({ name: "", email: "", password: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (!token) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await signOut(token);
      setSuccess("Signed out successfully.");
    } catch {
      // Ignore backend sign-out failure and clear session client side.
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      setSubmitting(false);
    }
  };

  if (loadingMe) {
    return (
      <main className="auth-shell auth-shell-centered">
        <section className="auth-simple-card">
          <AuthHeader />
          <div className="auth-loading-state">Checking your session...</div>
        </section>
      </main>
    );
  }

  if (isAuthenticated) {
    return (
      <main className="dashboard-shell">
        <AppWorkspace user={user} token={token} submitting={submitting} onSignOut={handleSignOut} />
        <FeedbackMessage type="error" message={error} />
        <FeedbackMessage type="success" message={success} />
      </main>
    );
  }

  return (
    <main className="auth-shell auth-shell-centered">
      <section className="auth-simple-card">
        <AuthHeader />
        <AuthTabs mode={mode} onModeChange={setMode} />
        {mode === "signin" ? (
          <SignInForm
            form={signInForm}
            onChange={updateSignInField}
            onSubmit={handleSignIn}
            submitting={submitting}
          />
        ) : (
          <SignUpForm
            form={signUpForm}
            onChange={updateSignUpField}
            onSubmit={handleSignUp}
            submitting={submitting}
          />
        )}
        <FeedbackMessage type="error" message={error} />
        <FeedbackMessage type="success" message={success} />
      </section>
    </main>
  );
}

export default AuthPage;
