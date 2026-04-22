function FeedbackMessage({ type, message }) {
  if (!message) {
    return null;
  }

  const alertType = type === "error" ? "danger" : "success";

  return (
    <div className={`alert alert-${alertType} auth-feedback mt-3 mb-0`} role="alert">
      {message}
    </div>
  );
}

export default FeedbackMessage;
