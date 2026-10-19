const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const time = new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' });

export const formatDateTime = (iso) => dateTime.format(new Date(iso));

export const formatTime = (date) => time.format(date);

export const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

export const percent = (part, whole) => (whole === 0 ? 0 : Math.round((part / whole) * 100));
