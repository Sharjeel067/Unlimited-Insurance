const isDST = (d: Date) => {
  const jan = new Date(d.getFullYear(), 0, 1);
  const jul = new Date(d.getFullYear(), 6, 1);
  const std = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  return d.getTimezoneOffset() < std;
};

export const getTodayDateEST = (): string => {
  const now = new Date();
  const estOffset = isDST(now) ? -4 : -5;
  const estDate = new Date(now.getTime() + estOffset * 60 * 60 * 1000);
  return estDate.toISOString().split("T")[0];
};
