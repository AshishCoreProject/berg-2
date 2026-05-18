/**
 * Rich text editor for builder blocks.
 * Supports always-on or selection-only floating toolbar modes.
 */
import { useRef, useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  value: string;
  onChange: (html: string) => void;
  onTextAlignChange?: (align: 'left' | 'center' | 'right') => void;
  placeholder?: string;
  /** Extra class for the content area (e.g. block-paragraph, block-heading) */
  contentClassName?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  /** Compact mode for short text (title, button, etc.) */
  compact?: boolean;
  /** Inline/bare mode: no border, no background (for use inside styled containers like buttons) */
  bare?: boolean;
  /** Toolbar behavior. auto: selection mode in canvas, always in sidebar. */
  toolbarMode?: 'auto' | 'always' | 'selection' | 'hidden';
}

interface ToolbarState {
  format: 'p' | 'h1' | 'h2' | 'h3';
  bold: boolean;
  italic: boolean;
  underline: boolean;
  unorderedList: boolean;
  orderedList: boolean;
  align: 'left' | 'center' | 'right';
}

export function TextEditor({
  value,
  onChange,
  onTextAlignChange,
  placeholder = 'Write…',
  contentClassName = '',
  onKeyDown,
  compact = false,
  bare = false,
  toolbarMode = 'auto',
}: Props) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const selectionRangeRef = useRef<Range | null>(null);
  const [selectionActive, setSelectionActive] = useState(false);
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [isCanvasEditor, setIsCanvasEditor] = useState(true);
  const toolbarInteractingRef = useRef(false);
  const [toolbarState, setToolbarState] = useState<ToolbarState>({
    format: 'p',
    bold: false,
    italic: false,
    underline: false,
    unorderedList: false,
    orderedList: false,
    align: 'left',
  });

  useEffect(() => {
    if (toolbarMode !== 'auto') return;
    const el = elRef.current;
    if (!el) return;
    const inCanvas = !!el.closest('.block-content');
    setIsCanvasEditor(inCanvas);
  }, [toolbarMode, value]);

  const resolvedToolbarMode = toolbarMode === 'auto' ? (isCanvasEditor ? 'selection' : 'always') : toolbarMode;

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    onChange(el.innerHTML);
  }, [onChange]);

  const restoreSelection = useCallback(() => {
    const savedRange = selectionRangeRef.current;
    const el = elRef.current;
    if (!savedRange || !el) return false;
    const sel = window.getSelection();
    if (!sel) return false;
    if (!el.contains(savedRange.startContainer) || !el.contains(savedRange.endContainer)) return false;
    sel.removeAllRanges();
    sel.addRange(savedRange);
    return true;
  }, []);

  const getCommandState = useCallback((command: string): boolean => {
    try {
      return !!document.queryCommandState(command);
    } catch {
      return false;
    }
  }, []);

  const getCommandValue = useCallback((command: string): string => {
    try {
      return String(document.queryCommandValue(command) ?? '');
    } catch {
      return '';
    }
  }, []);

  const resolveAlignFromSelection = useCallback((): ToolbarState['align'] => {
    const el = elRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return 'left';
    const range = sel.getRangeAt(0);
    let current: Node | null = range.commonAncestorContainer;
    while (current && current !== el) {
      if (current instanceof HTMLElement) {
        const inlineAlign = current.style.textAlign.trim().toLowerCase();
        if (inlineAlign === 'left' || inlineAlign === 'center' || inlineAlign === 'right') return inlineAlign;
      }
      current = current.parentNode;
    }
    const queryAlign = getCommandValue('justify').toLowerCase();
    if (queryAlign.includes('center')) return 'center';
    if (queryAlign.includes('right') || queryAlign.includes('end')) return 'right';
    return 'left';
  }, [getCommandValue]);

  const refreshToolbarState = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const anchor = sel.anchorNode;
    const focus = sel.focusNode;
    if (!anchor || !focus || !el.contains(anchor) || !el.contains(focus)) return;

    const formatBlockValue = getCommandValue('formatBlock').toLowerCase().replace(/[<>]/g, '');
    const format: ToolbarState['format'] = formatBlockValue.includes('h1')
      ? 'h1'
      : formatBlockValue.includes('h2')
        ? 'h2'
        : formatBlockValue.includes('h3')
          ? 'h3'
          : 'p';

    const align = resolveAlignFromSelection();

    setToolbarState({
      format,
      bold: getCommandState('bold'),
      italic: getCommandState('italic'),
      underline: getCommandState('underline'),
      unorderedList: getCommandState('insertUnorderedList'),
      orderedList: getCommandState('insertOrderedList'),
      align,
    });
  }, [getCommandState, getCommandValue, resolveAlignFromSelection]);

  const exec = useCallback((cmd: string, value?: string) => {
    restoreSelection();
    document.execCommand(cmd, false, value);
    elRef.current?.focus();
    if (cmd === 'justifyLeft' || cmd === 'justifyCenter' || cmd === 'justifyRight') {
      const nextAlign: ToolbarState['align'] = cmd === 'justifyCenter' ? 'center' : cmd === 'justifyRight' ? 'right' : 'left';
      onTextAlignChange?.(nextAlign);
    }
    handleInput();
    refreshToolbarState();
  }, [handleInput, onTextAlignChange, refreshToolbarState, restoreSelection]);

  const applyInlineCode = useCallback(() => {
    restoreSelection();
    const sel = window.getSelection();
    const el = elRef.current;
    if (!sel || !el || sel.rangeCount === 0) return;
    if (!el.contains(sel.anchorNode) || !el.contains(sel.focusNode)) return;
    if (sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const selectedText = range.toString();
    if (!selectedText.trim()) return;
    range.deleteContents();
    const codeEl = document.createElement('code');
    codeEl.textContent = selectedText;
    range.insertNode(codeEl);
    range.setStartAfter(codeEl);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    selectionRangeRef.current = range.cloneRange();
    handleInput();
    refreshToolbarState();
  }, [handleInput, refreshToolbarState, restoreSelection]);

  const refreshSelectionToolbar = useCallback(() => {
    if (resolvedToolbarMode !== 'selection') {
      setSelectionActive(false);
      return;
    }
    if (toolbarInteractingRef.current) {
      return;
    }
    const sel = window.getSelection();
    const el = elRef.current;
    if (!sel || !el || sel.rangeCount === 0 || sel.isCollapsed) {
      setSelectionActive(false);
      return;
    }
    const anchor = sel.anchorNode;
    const focus = sel.focusNode;
    if (!anchor || !focus || !el.contains(anchor) || !el.contains(focus)) {
      setSelectionActive(false);
      return;
    }
    const range = sel.getRangeAt(0);
    selectionRangeRef.current = range.cloneRange();
    const rangeRect = range.getBoundingClientRect();
    const clientRects = Array.from(range.getClientRects());
    const anchorRect = clientRects.length > 0
      ? clientRects.reduce((topMost, current) => (current.top < topMost.top ? current : topMost))
      : rangeRect;
    if (!anchorRect || (anchorRect.width === 0 && anchorRect.height === 0)) {
      setSelectionActive(false);
      return;
    }
    const spacing = 8;
    const toolbarWidth = toolbarRef.current?.offsetWidth ?? 640;
    const halfToolbar = toolbarWidth / 2;
    const leftAnchor = clientRects.length > 0
      ? anchorRect.left + anchorRect.width / 2
      : rangeRect.left + rangeRect.width / 2;
    const topRaw = anchorRect.top - spacing;
    const left = Math.max(halfToolbar + 12, Math.min(window.innerWidth - halfToolbar - 12, leftAnchor));
    const top = Math.max(12, topRaw);
    setToolbarPos({ left, top });
    setSelectionActive(true);
    refreshToolbarState();
  }, [refreshToolbarState, resolvedToolbarMode, selectionActive]);

  useEffect(() => {
    if (resolvedToolbarMode !== 'selection') return undefined;
    const onSelectionChange = () => refreshSelectionToolbar();
    const onScroll = () => refreshSelectionToolbar();
    const onResize = () => refreshSelectionToolbar();
    document.addEventListener('selectionchange', onSelectionChange);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [refreshSelectionToolbar, resolvedToolbarMode]);

  const handleLink = useCallback(() => {
    restoreSelection();
    const url = prompt('Link URL:', 'https://');
    if (url) exec('createLink', url);
  }, [exec, restoreSelection]);

  const handleFormatChange = useCallback((value: string) => {
    const map: Record<string, string> = {
      p: 'P',
      h1: 'H1',
      h2: 'H2',
      h3: 'H3',
    };
    const format = map[value] ?? 'P';
    exec('formatBlock', format);
  }, [exec]);

  const renderToolbar = () => (
    <div className="text-editor-toolbar-inner">
      <div className="text-editor-toolbar-group text-editor-toolbar-group-format">
        <label className="text-editor-toolbar-style-select-wrap" aria-label="Text style">
          <select
            className="text-editor-toolbar-style-select"
            value={toolbarState.format}
            onMouseDown={() => {
              toolbarInteractingRef.current = true;
            }}
            onBlur={() => {
              toolbarInteractingRef.current = false;
            }}
            onChange={(e) => handleFormatChange(e.target.value)}
          >
            <option value="p">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
        </label>
      </div>
      <span className="text-editor-toolbar-separator" aria-hidden="true" />
      <div className="text-editor-toolbar-group">
        <button type="button" className={`text-editor-toolbar-icon-btn ${toolbarState.bold ? 'is-active' : ''}`} aria-pressed={toolbarState.bold} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')} title="Bold" aria-label="Bold">
          <b>B</b>
        </button>
        <button type="button" className={`text-editor-toolbar-icon-btn ${toolbarState.italic ? 'is-active' : ''}`} aria-pressed={toolbarState.italic} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')} title="Italic" aria-label="Italic">
          <i>I</i>
        </button>
        <button type="button" className={`text-editor-toolbar-icon-btn ${toolbarState.underline ? 'is-active' : ''}`} aria-pressed={toolbarState.underline} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')} title="Underline" aria-label="Underline">
          <u>U</u>
        </button>
      </div>
      <span className="text-editor-toolbar-separator" aria-hidden="true" />
      <div className="text-editor-toolbar-group">
        <button type="button" className={`text-editor-toolbar-icon-btn ${toolbarState.unorderedList ? 'is-active' : ''}`} aria-pressed={toolbarState.unorderedList} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')} title="Bulleted list" aria-label="Bulleted list">
          UL
        </button>
        <button type="button" className={`text-editor-toolbar-icon-btn ${toolbarState.orderedList ? 'is-active' : ''}`} aria-pressed={toolbarState.orderedList} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertOrderedList')} title="Numbered list" aria-label="Numbered list">
          OL
        </button>
      </div>
      <span className="text-editor-toolbar-separator" aria-hidden="true" />
      <div className="text-editor-toolbar-group">
        <button type="button" className={`text-editor-toolbar-icon-btn ${toolbarState.align === 'left' ? 'is-active' : ''}`} aria-pressed={toolbarState.align === 'left'} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyLeft')} title="Align left" aria-label="Align left">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className="text-editor-toolbar-icon">
            <path d="M2 4h10M2 8h7M2 12h10" />
          </svg>
        </button>
        <button type="button" className={`text-editor-toolbar-icon-btn ${toolbarState.align === 'center' ? 'is-active' : ''}`} aria-pressed={toolbarState.align === 'center'} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyCenter')} title="Align center" aria-label="Align center">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className="text-editor-toolbar-icon">
            <path d="M3 4h10M5 8h6M3 12h10" />
          </svg>
        </button>
        <button type="button" className={`text-editor-toolbar-icon-btn ${toolbarState.align === 'right' ? 'is-active' : ''}`} aria-pressed={toolbarState.align === 'right'} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyRight')} title="Align right" aria-label="Align right">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className="text-editor-toolbar-icon">
            <path d="M4 4h10M7 8h7M4 12h10" />
          </svg>
        </button>
      </div>
      <span className="text-editor-toolbar-separator" aria-hidden="true" />
      <div className="text-editor-toolbar-group">
        <button type="button" className="text-editor-toolbar-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={handleLink} title="Link" aria-label="Link">
          Link
        </button>
        <button type="button" className="text-editor-toolbar-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('unlink')} title="Unlink" aria-label="Unlink">
          Unlink
        </button>
        <button type="button" className="text-editor-toolbar-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={applyInlineCode} title="Inline code" aria-label="Inline code">
          {"</>"}
        </button>
        <button type="button" className="text-editor-toolbar-icon-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => { exec('removeFormat'); exec('unlink'); }} title="Clear formatting" aria-label="Clear formatting">
          Tx
        </button>
      </div>
    </div>
  );

  return (
    <div className={`text-editor ${compact ? 'text-editor-compact' : ''} ${bare ? 'text-editor-bare' : ''}`}>
      {resolvedToolbarMode === 'always' && (
        <div className="text-editor-toolbar">{renderToolbar()}</div>
      )}
      {resolvedToolbarMode === 'selection' && selectionActive &&
        createPortal(
          <div
            ref={toolbarRef}
            className="text-editor-toolbar text-editor-toolbar-floating"
            style={{ top: toolbarPos.top, left: toolbarPos.left }}
          >
            {renderToolbar()}
          </div>,
          document.body
        )}
      <div
        ref={elRef}
        className={`text-editor-content ${contentClassName}`}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={handleInput}
        onBlur={() => {
          handleInput();
          if (resolvedToolbarMode === 'selection' && !toolbarInteractingRef.current) {
            setSelectionActive(false);
          }
        }}
        onMouseUp={() => {
          if (resolvedToolbarMode === 'selection') refreshSelectionToolbar();
        }}
        onKeyUp={() => {
          if (resolvedToolbarMode === 'selection') refreshSelectionToolbar();
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          onKeyDown?.(e);
        }}
      />
    </div>
  );
}
