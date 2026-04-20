/**
 * Shared formatting utilities — keeps date/currency display consistent
 * across all pages regardless of the user's browser locale.
 */

/** Format a monetary value in Ghana Cedis */
export const fmtCurrency = (v) =>
  `GHS ${(v || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Format a date string in a consistent, international-friendly format (e.g. "06 Apr 2026") */
export const fmtDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/** Format a date with time (e.g. "06 Apr 2026, 14:30") */
export const fmtDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
