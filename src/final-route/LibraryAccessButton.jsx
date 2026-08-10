export function LibraryAccessButton({ disabled, onOpen, visible }) {
  if (!visible) {
    return null
  }

  return (
    <div className="library-access-control">
      <button
        type="button"
        className="library-access-button"
        data-library-trigger
        disabled={disabled}
        onClick={(event) => onOpen(event.currentTarget)}
      >
        VOIR TOUTE LA BIBLIOTHÈQUE
      </button>
    </div>
  )
}
