import { useState, useEffect } from 'react';
import type { PageMeta } from '@berg/schema';
import { slugify, uniqueSlug } from '@berg/schema';

interface Props {
  meta: PageMeta;
  slug: string;
  published?: boolean;
  otherSlugs: Set<string>;
  onChange: (meta: Partial<PageMeta>) => void;
  onSlugChange: (slug: string) => void;
  onPublishedChange: (published: boolean) => void;
}

export function PageMetaEditor({ meta, slug, published = true, otherSlugs, onChange, onSlugChange, onPublishedChange }: Props) {
  const [slugInput, setSlugInput] = useState(slug);
  useEffect(() => {
    setSlugInput(slug);
  }, [slug]);

  const handleSlugBlur = () => {
    const cleaned = slugify(slugInput.trim()) || 'page';
    const unique = uniqueSlug(cleaned, otherSlugs);
    setSlugInput(unique);
    if (unique !== slug) onSlugChange(unique);
  };

  return (
    <section className="meta-editor">
      <h3 className="sidebar-title">Page</h3>
      <label>
        <span>Title</span>
        <input
          type="text"
          value={meta.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Page title"
        />
      </label>
      <label className="meta-editor-route">
        <span>Route (URL path)</span>
        <div className="meta-editor-route-input">
          <span className="meta-editor-route-prefix">/</span>
          <input
            type="text"
            value={slugInput}
            onChange={(e) => setSlugInput(e.target.value)}
            onBlur={handleSlugBlur}
            placeholder="page-slug"
            aria-label="Page route"
          />
        </div>
      </label>
      <label>
        <span>Description</span>
        <textarea
          value={meta.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Meta description (SEO)"
          rows={2}
        />
      </label>
      <div className="meta-editor-publish">
        <span className="meta-editor-publish-label">Status</span>
        <button
          type="button"
          className={`meta-editor-publish-btn ${published ? 'is-published' : 'is-draft'}`}
          onClick={() => onPublishedChange(!published)}
        >
          {published ? 'Published' : 'Draft'}
        </button>
      </div>
    </section>
  );
}
