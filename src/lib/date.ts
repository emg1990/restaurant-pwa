/**
 * Date helpers that operate in the user's local timezone.
 * All functions accept either a Date or a string in YYYY-MM-DD format.
 */
export const isYMD = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export const localYYYYMMDD = (input?: Date | string): string => {
  if (!input) {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (typeof input === 'string' && isYMD(input)) return input;
  const d = typeof input === 'string' ? new Date(input) : input;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const parseYMD = (s: string) => {
  if (isYMD(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return { year: y, monthIndex: m - 1, day: d };
  }
  const dt = new Date(s);
  return { year: dt.getFullYear(), monthIndex: dt.getMonth(), day: dt.getDate() };
};

export const startOfDayMs = (input?: string | Date): number => {
  if (!input) return startOfDayMs(new Date());
  if (typeof input === 'string') {
    const { year, monthIndex, day } = parseYMD(input);
    return new Date(year, monthIndex, day, 0, 0, 0, 0).getTime();
  }
  return new Date(input.getFullYear(), input.getMonth(), input.getDate(), 0, 0, 0, 0).getTime();
};

export const endOfDayMs = (input?: string | Date): number => {
  if (!input) return endOfDayMs(new Date());
  if (typeof input === 'string') {
    const { year, monthIndex, day } = parseYMD(input);
    return new Date(year, monthIndex, day, 23, 59, 59, 999).getTime();
  }
  return new Date(input.getFullYear(), input.getMonth(), input.getDate(), 23, 59, 59, 999).getTime();
};

export const toDate = (input?: number | Date | string): Date => {
  if (input == null) return new Date();
  if (typeof input === 'number') return new Date(input);
  if (typeof input === 'string') return new Date(input);
  return input;
};

export const formatTime = (input?: number | Date | string): string => {
  return toDate(input).toLocaleTimeString();
};

export const formatDateTime = (input?: number | Date | string, options?: Intl.DateTimeFormatOptions): string => {
  return toDate(input).toLocaleString(undefined, options);
};

export const formatDate = (input?: number | Date | string, options?: Intl.DateTimeFormatOptions): string => {
  return toDate(input).toLocaleDateString(undefined, options);
};

export default {
  localYYYYMMDD,
  startOfDayMs,
  endOfDayMs,
  toDate,
  formatTime,
  formatDateTime,
  formatDate,
};
