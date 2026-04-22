function CategoryActionButton({ children, variant = "default", onClick }) {
  return (
    <button type="button" className={`category-action-btn ${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}

export default CategoryActionButton;
