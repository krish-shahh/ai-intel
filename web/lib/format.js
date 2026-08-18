export function cap(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : '';
}

export function fmtDate(d, long) {
  if (!d) return '';
  const dt = new Date(d + 'T12:00:00');
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('en-US', long
    ? { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }
    : { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

const SESSION_SHORT = { morning: 'AM', evening: 'PM' };

export function briefLabel(b) {
  const session = SESSION_SHORT[b.data.session] || cap(b.data.session || '');
  return `${fmtDate(b.data.date) || b.slug}${session ? ' ' + session : ''}`;
}
