import { useState, useEffect } from 'react';
import { slugify, uniqueSlug } from '@berg/schema';

interface Props {
  isOpen: boolean;
  existingSlugs: Set<string>;
  onClose: () => void;
  onConfirm: (title: string, slug: string) => void;
}

export function AddPageModal({ isOpen, existingSlugs, onClose, onConfirm }: Props) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setSlug(uniqueSlug('untitled-page', existingSlugs));
      setSlugManuallyEdited(false);
    }
  }, [isOpen, existingSlugs]);

  useEffect(() => {
    if (isOpen && !slugManuallyEdited && title) {
      const base = slugify(title) || 'page';
      setSlug(uniqueSlug(base, existingSlugs));
    }
  }, [title, isOpen, slugManuallyEdited, existingSlugs]);

  const handleConfirm = () => {
    const baseSlug = slug.trim() ? (slugify(slug.trim()) || 'page') : 'page';
    const finalSlug = uniqueSlug(baseSlug, existingSlugs);
    const finalTitle = title.trim() || 'Untitled Page';
    onConfirm(finalTitle, finalSlug);
    onClose();
  };

  const handleSlugChange = (val: string) => {
    setSlugManuallyEdited(true);
    setSlug(val);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="add-page-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 id="add-page-title" className="modal-title">Add page</h3>
        <p className="modal-desc">Enter a title and route for your new page.</p>
        <label className="modal-field">
          <span>Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          />
        </label>
        <label className="modal-field">
          <span>Route (URL path)</span>
          <div className="modal-field-route">
            <span className="modal-field-prefix">/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="page-slug"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
              }}
            />
          </div>
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm}>
            Create page
          </button>
        </div>
      </div>
    </div>
  );
}
