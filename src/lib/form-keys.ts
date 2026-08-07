import type * as React from "react";

/**
 * Form-level Enter handling for the dialogs.
 *
 * Shift+Enter must never submit, whichever field the caret is in. In a
 * textarea it becomes a line break at the caret; anywhere else it is simply
 * swallowed, so it can't quietly save a half-finished form.
 *
 * Plain Enter is left alone: it still submits from single-line inputs, which
 * is what people expect.
 */
export function dialogKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
  if (e.key !== "Enter" || !e.shiftKey) return;

  e.preventDefault();
  e.stopPropagation();

  const el = e.target;
  if (!(el instanceof HTMLTextAreaElement)) return;

  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? start;
  const next = `${el.value.slice(0, start)}\n${el.value.slice(end)}`;

  // Assign through the native setter and re-fire `input`, so React's onChange
  // runs and the controlled value actually updates.
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  setter?.call(el, next);
  el.dispatchEvent(new Event("input", { bubbles: true }));

  // React rewrites value on the next paint, so restore the caret after it.
  requestAnimationFrame(() => {
    el.selectionStart = el.selectionEnd = start + 1;
  });
}
