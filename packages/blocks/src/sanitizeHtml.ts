/** Allow only safe inline/block tags from the text editor. */
const ALLOWED_TAGS = new Set(['b', 'i', 'strong', 'em', 'a', 'br', 'p', 'span', 'u', 'div']);

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return Array.from(node.childNodes).map(walk).join('');
    const attrs = tag === 'a' ? [' href="' + (el.getAttribute('href') ?? '#') + '"' ] : [];
    const inner = Array.from(node.childNodes).map(walk).join('');
    if (tag === 'br') return '<br>';
    return '<' + tag + attrs.join('') + '>' + inner + '</' + tag + '>';
  };
  return Array.from(doc.body.childNodes).map(walk).join('');
}

/** True if content looks like HTML from the editor. */
export function isHtml(content: string): boolean {
  return typeof content === 'string' && /<[a-z][\s\S]*>/i.test(content);
}

/** Tags allowed in custom element blocks (layout + Tailwind-compatible structure). */
const CUSTOM_ALLOWED_TAGS = new Set([
  'div', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'strong', 'em', 'b', 'i', 'u',
  'ul', 'ol', 'li', 'img', 'figure', 'figcaption', 'br', 'hr',
  'style', /* inline CSS when not using separate CSS field */
]);

/** Allowed attributes for custom HTML (class for Tailwind, href for links, src/alt for images, style for inline). */
const CUSTOM_ALLOWED_ATTRS: Record<string, string[]> = {
  a: ['href', 'class', 'target', 'rel'],
  img: ['src', 'alt', 'class'],
  '*': ['class', 'style'],
};

function getCustomAttrs(tag: string, el: Element): string[] {
  const allowed = CUSTOM_ALLOWED_ATTRS[tag] ?? CUSTOM_ALLOWED_ATTRS['*'] ?? [];
  const allAllowed = [...new Set([...(CUSTOM_ALLOWED_ATTRS['*'] ?? []), ...allowed])];
  return allAllowed;
}

/** Sanitize HTML for custom element block – allows layout tags and class (Tailwind). */
export function sanitizeCustomHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (!CUSTOM_ALLOWED_TAGS.has(tag)) return Array.from(node.childNodes).map(walk).join('');
    const allowedAttrs = getCustomAttrs(tag, el);
    const attrs: string[] = [];
    for (const name of allowedAttrs) {
      const val = el.getAttribute(name);
      if (val != null) attrs.push(` ${name}="${val.replace(/"/g, '&quot;')}"`);
    }
    const inner = Array.from(node.childNodes).map(walk).join('');
    if (tag === 'br') return '<br>';
    if (tag === 'img') return '<img' + attrs.join('') + ' />';
    return '<' + tag + attrs.join('') + '>' + inner + '</' + tag + '>';
  };
  return Array.from(doc.body.childNodes).map(walk).join('');
}
