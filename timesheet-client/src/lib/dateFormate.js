export function formatDateToReadable(dateStr) {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return ''; // Invalid date

  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options); // e.g. "5 Aug 2025"
}

// ✅ Sort an array of objects by date ascending
export function sortByDateAsc(arr, dateKey) {
  return [...arr].sort((a, b) => {
    const dateA = new Date(a[dateKey]);
    const dateB = new Date(b[dateKey]);
    return dateA - dateB; // Ascending order
  });
}
