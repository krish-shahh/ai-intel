import type { Note } from './vault';

export function cap(s?: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : '';
}

export function fmtDate(d?: string, long?: boolean): string {
  if (!d) return '';
  const dt = new Date(d + 'T12:00:00');
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('en-US', long
    ? { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }
    : { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

const SESSION_SHORT: Record<string, string> = { morning: 'AM', evening: 'PM' };

export function briefLabel(b: Note): string {
  const session = SESSION_SHORT[b.data.session as string] || cap(b.data.session as string || '');
  return `${fmtDate(b.data.date as string) || b.slug}${session ? ' ' + session : ''}`;
}
