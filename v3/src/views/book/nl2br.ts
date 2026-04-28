/**
 * Mirror of EJS `<%- (text || '').replace(/\n/g, '<br>') %>` — text first
 * escapes HTML, then newlines become <br>. Returned as a string the JSX layer
 * passes through `dangerouslySetInnerHTML`.
 */
export function nl2br(text: string | null | undefined): string {
  if (!text) return '';
  const escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return escaped.replace(/\n/g, '<br>');
}
