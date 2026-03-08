export function formatMinutes(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return "-";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins} menit`;
  if (mins === 0) return `${hours} jam`;

  return `${hours} jam ${mins} menit`;
}

export function formatTime(value?: string | null): string {
  if (!value) return "-";

  return new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value?: string | null): string {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function sumMinutes(records: any[]): number {
  return records.reduce((acc, r) => acc + (r.work_minutes || 0), 0);
}