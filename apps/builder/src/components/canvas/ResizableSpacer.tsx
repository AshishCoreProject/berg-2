import { useRef, useCallback, useState } from 'react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

/** Resizable spacer: drag the bottom edge to change height (Gutenberg-style). */
export function ResizableSpacer({ value, onChange, min = 20, max = 400 }: Props) {
  const startY = useRef(0);
  const startHeight = useRef(0);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startY.current = e.clientY;
      startHeight.current = value;
      isDraggingRef.current = true;
      setIsDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [value]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      const delta = e.clientY - startY.current;
      const next = Math.min(max, Math.max(min, startHeight.current + delta));
      onChange(Math.round(next));
    },
    [min, max, onChange]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  return (
    <div
      className={`resizable-spacer-grip ${isDragging ? 'is-dragging' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      title="Drag to resize"
    >
      <span className="resizable-spacer-value">{value}px</span>
      <div className="resizable-spacer-line" />
    </div>
  );
}
