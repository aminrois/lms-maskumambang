import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizePostgrestSearch(query: string): string {
  if (!query) return "";
  return query.replace(/[\(\),*%\\]/g, "").trim();
}

export function formatDateIndo(dateVal: any): string {
  if (!dateVal || dateVal === "—" || dateVal === "-") return "-";

  if (typeof dateVal === "string" && /[a-zA-Z]/.test(dateVal)) {
    return dateVal;
  }

  let d: Date | null = null;
  if (typeof dateVal === "string") {
    const cleanStr = dateVal.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
      const datePart = cleanStr.slice(0, 10);
      const [y, m, day] = datePart.split("-").map(Number);
      d = new Date(y, m - 1, day);
    } else if (/^\d{2}[-/]\d{2}[-/]\d{4}/.test(cleanStr)) {
      const parts = cleanStr.split(/[-/]/).map(Number);
      d = new Date(parts[2], parts[1] - 1, parts[0]);
    } else {
      d = new Date(cleanStr);
    }
  } else if (dateVal instanceof Date) {
    d = dateVal;
  } else {
    d = new Date(dateVal);
  }

  if (!d || isNaN(d.getTime())) {
    return typeof dateVal === "string" ? dateVal : "-";
  }

  const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

