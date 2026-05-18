import type { StoreData } from "@berg/core";

/** Sync theme, accent, and button tokens on <html> (used before paint in main.tsx and on store updates in App). */
export function applyStoreToDocument(store: StoreData): void {
  const root = document.documentElement;
  root.setAttribute("data-theme", store.theme || "dark");
  if (store.accentColor) root.style.setProperty("--accent", store.accentColor);
  else root.style.removeProperty("--accent");
  const bs = store.buttonStyle;
  if (bs?.backgroundColor)
    root.style.setProperty("--button-bg", bs.backgroundColor);
  else root.style.removeProperty("--button-bg");
  if (bs?.color) root.style.setProperty("--button-color", bs.color);
  else root.style.removeProperty("--button-color");
  if (bs?.fontFamily) root.style.setProperty("--button-font", bs.fontFamily);
  else root.style.removeProperty("--button-font");
  if (bs?.borderRadius)
    root.style.setProperty("--button-radius", bs.borderRadius);
  else root.style.removeProperty("--button-radius");
  if (bs?.padding) root.style.setProperty("--button-padding", bs.padding);
  else root.style.removeProperty("--button-padding");
}
