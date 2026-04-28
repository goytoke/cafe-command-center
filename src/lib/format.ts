export const money = (n: number | null | undefined) =>
  `${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} Birr`;

export const today = () => new Date().toISOString().slice(0, 10);

export const startOfTodayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};
