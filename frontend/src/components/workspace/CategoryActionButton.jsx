function CategoryActionButton({ children, variant = "default", onClick, className = "", title, ariaLabel }) {
  return (
    <button
      type="button"
      className={`category-action-btn ${variant} ${className}`.trim()}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel ?? title}
    >
      {children}
    </button>
  );
}

export default CategoryActionButton;
