/**
 * Simple rich text editor for text blocks (paragraph, heading, quote).
 * Toolbar: Bold, Italic, Link. Content stored as HTML.
 */
import { useRef, useEffect, useCallback } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Extra class for the content area (e.g. block-paragraph, block-heading) */
  contentClassName?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  /** Compact mode for short text (title, button, etc.) */
  compact?: boolean;
  /** Inline/bare mode: no border, no background (for use inside styled containers like buttons) */
  bare?: boolean;
}

export function TextEditor({
  value,
  onChange,
  placeholder = 'Write…',
  contentClassName = '',
  onKeyDown,
  compact = false,
  bare = false,
}: Props) {
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    if (el.innerHTML !== value) el.innerHTML = value || '';
  }, [value]);

  const handleInput = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    onChange(el.innerHTML);
  }, [onChange]);

  const exec = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    elRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const handleLink = useCallback(() => {
    const url = prompt('Link URL:', 'https://');
    if (url) exec('createLink', url);
  }, [exec]);

  return (
    <div className={`text-editor ${compact ? 'text-editor-compact' : ''} ${bare ? 'text-editor-bare' : ''}`}>
      <div className="text-editor-toolbar">
        <button type="button" onClick={() => exec('bold')} title="Bold" aria-label="Bold">
          <b>B</b>
        </button>
        <button type="button" onClick={() => exec('italic')} title="Italic" aria-label="Italic">
          <i>I</i>
        </button>
        <button type="button" onClick={handleLink} title="Link" aria-label="Link">
          🔗
        </button>
      </div>
      <div
        ref={elRef}
        className={`text-editor-content ${contentClassName}`}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={(e) => {
          e.stopPropagation();
          onKeyDown?.(e);
        }}
      />
    </div>
  );
}
