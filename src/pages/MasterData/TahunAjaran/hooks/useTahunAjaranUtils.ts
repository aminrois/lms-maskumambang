/** Hitung progress (persentase) antara tanggal mulai dan akhir */
export function calcProgress(mulai: string, akhir: string): number {
  if (!mulai || !akhir) return 0;
  const start = new Date(mulai).getTime();
  const end = new Date(akhir).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

/** Format durasi dalam hari */
export function durationDays(mulai: string, akhir: string): number {
  if (!mulai || !akhir) return 0;
  return Math.round((new Date(akhir).getTime() - new Date(mulai).getTime()) / (1000 * 60 * 60 * 24));
}
