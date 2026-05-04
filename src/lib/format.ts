export const money = (n: number | null | undefined) =>
  `${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} Birr`;

export const today = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const startOfTodayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export const dayRange = (date: Date) => {
  const s = new Date(date); s.setHours(0, 0, 0, 0);
  const e = new Date(date); e.setHours(23, 59, 59, 999);
  return { startISO: s.toISOString(), endISO: e.toISOString() };
};

export const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
