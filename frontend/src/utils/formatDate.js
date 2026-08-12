export function formatDate(value) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function toInputDate(value) {
  if (!value) return new Date().toISOString().split('T')[0];
  return new Date(value).toISOString().split('T')[0];
}

export function labelText(value) {
  if (!value) return 'N/A';
  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
