export function getNextFirstTuesday(from: Date = new Date()): Date {
  const result = new Date(from.getFullYear(), from.getMonth(), 1);
  while (result.getDay() !== 2) result.setDate(result.getDate() + 1);
  if (result < from) {
    const next = new Date(from.getFullYear(), from.getMonth() + 1, 1);
    while (next.getDay() !== 2) next.setDate(next.getDate() + 1);
    return next;
  }
  return result;
}

export function formatMeetingDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function daysUntil(d: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
