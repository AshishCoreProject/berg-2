/** Gutenberg-style 6-dot drag handle for reordering blocks.
 * When gridHandle is true, no native draggable (used by react-grid-layout as draggableHandle). */
export function BlockDragHandle({
  onDragStart,
  onDragEnd,
  gridHandle = false,
  className = '',
}: {
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  gridHandle?: boolean;
  className?: string;
}) {
  if (gridHandle) {
    return (
      <div
        className={`block-drag-handle ${className}`}
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden>
          <circle cx="5" cy="5" r="1.25" />
          <circle cx="13" cy="5" r="1.25" />
          <circle cx="5" cy="9" r="1.25" />
          <circle cx="13" cy="9" r="1.25" />
          <circle cx="5" cy="13" r="1.25" />
          <circle cx="13" cy="13" r="1.25" />
        </svg>
      </div>
    );
  }
  return (
    <div
      className={`block-drag-handle ${className}`}
      draggable
      onDragStart={onDragStart!}
      onDragEnd={onDragEnd}
      onClick={(e) => e.stopPropagation()}
      aria-label="Drag to reorder"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden>
        <circle cx="5" cy="5" r="1.25" />
        <circle cx="13" cy="5" r="1.25" />
        <circle cx="5" cy="9" r="1.25" />
        <circle cx="13" cy="9" r="1.25" />
        <circle cx="5" cy="13" r="1.25" />
        <circle cx="13" cy="13" r="1.25" />
      </svg>
    </div>
  );
}
