const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const time = new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));

export const formatTime = (date: Date) => time.format(date);

export const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export const percent = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));
