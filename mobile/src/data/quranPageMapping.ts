// src/data/quranPageMapping.ts
// Standard Medina Mushaf (604 Pages) mapping dataset

export interface SurahMeta {
  number: number;
  name: string;
  arabic: string;
  totalVerses: number;
  startPage: number;
  juz: number;
}

export const SURAH_PAGE_DATA: SurahMeta[] = [
  { number: 1, name: "Al-Fatihah", arabic: "الفاتحة", totalVerses: 7, startPage: 1, juz: 1 },
  { number: 2, name: "Al-Baqarah", arabic: "البقرة", totalVerses: 286, startPage: 2, juz: 1 },
  { number: 3, name: "Ali 'Imran", arabic: "آل عمران", totalVerses: 200, startPage: 50, juz: 3 },
  { number: 4, name: "An-Nisa'", arabic: "النساء", totalVerses: 176, startPage: 77, juz: 4 },
  { number: 5, name: "Al-Ma'idah", arabic: "المائدة", totalVerses: 120, startPage: 106, juz: 6 },
  { number: 6, name: "Al-An'am", arabic: "الأنعام", totalVerses: 165, startPage: 128, juz: 7 },
  { number: 7, name: "Al-A'raf", arabic: "الأعراف", totalVerses: 206, startPage: 151, juz: 8 },
  { number: 8, name: "Al-Anfal", arabic: "الأنفال", totalVerses: 75, startPage: 177, juz: 9 },
  { number: 9, name: "At-Taubah", arabic: "التوبة", totalVerses: 129, startPage: 187, juz: 10 },
  { number: 10, name: "Yunus", arabic: "يونس", totalVerses: 109, startPage: 208, juz: 11 },
  { number: 11, name: "Hud", arabic: "هود", totalVerses: 123, startPage: 221, juz: 11 },
  { number: 12, name: "Yusuf", arabic: "يوسف", totalVerses: 111, startPage: 235, juz: 12 },
  { number: 13, name: "Ar-Ra'd", arabic: "الرعد", totalVerses: 43, startPage: 249, juz: 13 },
  { number: 14, name: "Ibrahim", arabic: "إبراهيم", totalVerses: 52, startPage: 255, juz: 13 },
  { number: 15, name: "Al-Hijr", arabic: "الحجر", totalVerses: 99, startPage: 262, juz: 14 },
  { number: 16, name: "An-Nahl", arabic: "النحل", totalVerses: 128, startPage: 267, juz: 14 },
  { number: 17, name: "Al-Isra'", arabic: "الإسراء", totalVerses: 111, startPage: 282, juz: 15 },
  { number: 18, name: "Al-Kahf", arabic: "الكهف", totalVerses: 110, startPage: 293, juz: 15 },
  { number: 19, name: "Maryam", arabic: "مريم", totalVerses: 98, startPage: 305, juz: 16 },
  { number: 20, name: "Taha", arabic: "طه", totalVerses: 135, startPage: 312, juz: 16 },
  { number: 21, name: "Al-Anbiya'", arabic: "الأنبياء", totalVerses: 112, startPage: 322, juz: 17 },
  { number: 22, name: "Al-Hajj", arabic: "الحج", totalVerses: 78, startPage: 332, juz: 17 },
  { number: 23, name: "Al-Mu'minun", arabic: "المؤمنون", totalVerses: 118, startPage: 342, juz: 18 },
  { number: 24, name: "An-Nur", arabic: "النور", totalVerses: 64, startPage: 350, juz: 18 },
  { number: 25, name: "Al-Furqan", arabic: "الفرقان", totalVerses: 77, startPage: 359, juz: 18 },
  { number: 26, name: "Asy-Syu'ara'", arabic: "الشعراء", totalVerses: 227, startPage: 367, juz: 19 },
  { number: 27, name: "An-Naml", arabic: "النمل", totalVerses: 93, startPage: 377, juz: 19 },
  { number: 28, name: "Al-Qasas", arabic: "القصص", totalVerses: 88, startPage: 385, juz: 20 },
  { number: 29, name: "Al-'Ankabut", arabic: "العنكبوت", totalVerses: 69, startPage: 396, juz: 20 },
  { number: 30, name: "Ar-Rum", arabic: "الروم", totalVerses: 60, startPage: 404, juz: 21 },
  { number: 31, name: "Luqman", arabic: "لقمان", totalVerses: 34, startPage: 411, juz: 21 },
  { number: 32, name: "As-Sajdah", arabic: "السجدة", totalVerses: 30, startPage: 415, juz: 21 },
  { number: 33, name: "Al-Ahzab", arabic: "الأحزاب", totalVerses: 73, startPage: 418, juz: 21 },
  { number: 34, name: "Saba'", arabic: "سبأ", totalVerses: 54, startPage: 428, juz: 22 },
  { number: 35, name: "Fatir", arabic: "فاطر", totalVerses: 45, startPage: 434, juz: 22 },
  { number: 36, name: "Ya-Sin", arabic: "يس", totalVerses: 83, startPage: 440, juz: 22 },
  { number: 37, name: "As-Saffat", arabic: "الصافات", totalVerses: 182, startPage: 446, juz: 23 },
  { number: 38, name: "Sad", arabic: "ص", totalVerses: 88, startPage: 453, juz: 23 },
  { number: 39, name: "Az-Zumar", arabic: "الزمر", totalVerses: 75, startPage: 458, juz: 23 },
  { number: 40, name: "Ghafir", arabic: "غافر", totalVerses: 85, startPage: 467, juz: 24 },
  { number: 41, name: "Fussilat", arabic: "فصلت", totalVerses: 54, startPage: 477, juz: 24 },
  { number: 42, name: "Asy-Syura", arabic: "الشورى", totalVerses: 53, startPage: 483, juz: 25 },
  { number: 43, name: "Az-Zukhruf", arabic: "الزخرف", totalVerses: 89, startPage: 489, juz: 25 },
  { number: 44, name: "Ad-Dukhan", arabic: "الدخان", totalVerses: 59, startPage: 496, juz: 25 },
  { number: 45, name: "Al-Jasiyah", arabic: "الجاثية", totalVerses: 37, startPage: 499, juz: 25 },
  { number: 46, name: "Al-Ahqaf", arabic: "الأحقاف", totalVerses: 35, startPage: 502, juz: 26 },
  { number: 47, name: "Muhammad", arabic: "محمد", totalVerses: 38, startPage: 507, juz: 26 },
  { number: 48, name: "Al-Fath", arabic: "الفتح", totalVerses: 29, startPage: 511, juz: 26 },
  { number: 49, name: "Al-Hujurat", arabic: "الحجرات", totalVerses: 18, startPage: 515, juz: 26 },
  { number: 50, name: "Qaf", arabic: "ق", totalVerses: 45, startPage: 518, juz: 26 },
  { number: 51, name: "Az-Zariyat", arabic: "الذاريات", totalVerses: 60, startPage: 520, juz: 26 },
  { number: 52, name: "At-Tur", arabic: "الطور", totalVerses: 49, startPage: 523, juz: 27 },
  { number: 53, name: "An-Najm", arabic: "النجم", totalVerses: 62, startPage: 526, juz: 27 },
  { number: 54, name: "Al-Qamar", arabic: "القمر", totalVerses: 55, startPage: 528, juz: 27 },
  { number: 55, name: "Ar-Rahman", arabic: "الرحمن", totalVerses: 78, startPage: 531, juz: 27 },
  { number: 56, name: "Al-Waqi'ah", arabic: "الواقعة", totalVerses: 96, startPage: 534, juz: 27 },
  { number: 57, name: "Al-Hadid", arabic: "الحديد", totalVerses: 29, startPage: 537, juz: 27 },
  { number: 58, name: "Al-Mujadilah", arabic: "المجادلة", totalVerses: 22, startPage: 542, juz: 28 },
  { number: 59, name: "Al-Hasyr", arabic: "الحشر", totalVerses: 24, startPage: 545, juz: 28 },
  { number: 60, name: "Al-Mumtahanah", arabic: "الممتحنة", totalVerses: 13, startPage: 549, juz: 28 },
  { number: 61, name: "As-Saff", arabic: "الصف", totalVerses: 14, startPage: 551, juz: 28 },
  { number: 62, name: "Al-Jumu'ah", arabic: "الجمعة", totalVerses: 11, startPage: 553, juz: 28 },
  { number: 63, name: "Al-Munafiqun", arabic: "المنافقون", totalVerses: 11, startPage: 554, juz: 28 },
  { number: 64, name: "At-Tagabun", arabic: "التغابن", totalVerses: 18, startPage: 556, juz: 28 },
  { number: 65, name: "At-Talaq", arabic: "الطلاق", totalVerses: 12, startPage: 558, juz: 28 },
  { number: 66, name: "At-Tahrim", arabic: "التحريم", totalVerses: 12, startPage: 560, juz: 28 },
  { number: 67, name: "Al-Mulk", arabic: "الملك", totalVerses: 30, startPage: 562, juz: 29 },
  { number: 68, name: "Al-Qalam", arabic: "القلم", totalVerses: 52, startPage: 564, juz: 29 },
  { number: 69, name: "Al-Haqqah", arabic: "الحاقة", totalVerses: 52, startPage: 566, juz: 29 },
  { number: 70, name: "Al-Ma'arij", arabic: "المعارج", totalVerses: 44, startPage: 568, juz: 29 },
  { number: 71, name: "Nuh", arabic: "نوح", totalVerses: 28, startPage: 570, juz: 29 },
  { number: 72, name: "Al-Jinn", arabic: "الجن", totalVerses: 28, startPage: 572, juz: 29 },
  { number: 73, name: "Al-Muzzammil", arabic: "المزمل", totalVerses: 20, startPage: 574, juz: 29 },
  { number: 74, name: "Al-Muddassir", arabic: "المدثر", totalVerses: 56, startPage: 575, juz: 29 },
  { number: 75, name: "Al-Qiyamah", arabic: "القيامة", totalVerses: 40, startPage: 577, juz: 29 },
  { number: 76, name: "Al-Insan", arabic: "الإنسان", totalVerses: 31, startPage: 578, juz: 29 },
  { number: 77, name: "Al-Mursalat", arabic: "المرسلات", totalVerses: 50, startPage: 580, juz: 29 },
  { number: 78, name: "An-Naba'", arabic: "النبأ", totalVerses: 40, startPage: 582, juz: 30 },
  { number: 79, name: "An-Nazi'at", arabic: "النازعات", totalVerses: 46, startPage: 583, juz: 30 },
  { number: 80, name: "'Abasa", arabic: "عبس", totalVerses: 42, startPage: 585, juz: 30 },
  { number: 81, name: "At-Takwir", arabic: "التكوير", totalVerses: 29, startPage: 586, juz: 30 },
  { number: 82, name: "Al-Infitar", arabic: "الانفطار", totalVerses: 19, startPage: 587, juz: 30 },
  { number: 83, name: "Al-Mutaffifin", arabic: "المطففين", totalVerses: 36, startPage: 587, juz: 30 },
  { number: 84, name: "Al-Insyiqaq", arabic: "الانشقاق", totalVerses: 25, startPage: 589, juz: 30 },
  { number: 85, name: "Al-Buruj", arabic: "البروج", totalVerses: 22, startPage: 590, juz: 30 },
  { number: 86, name: "At-Tariq", arabic: "الطارق", totalVerses: 17, startPage: 591, juz: 30 },
  { number: 87, name: "Al-A'la", arabic: "الأعلى", totalVerses: 19, startPage: 591, juz: 30 },
  { number: 88, name: "Al-Gasyiyah", arabic: "الغاشية", totalVerses: 26, startPage: 592, juz: 30 },
  { number: 89, name: "Al-Fajr", arabic: "الفجر", totalVerses: 30, startPage: 593, juz: 30 },
  { number: 90, name: "Al-Balad", arabic: "البلد", totalVerses: 20, startPage: 594, juz: 30 },
  { number: 91, name: "Asy-Syams", arabic: "الشمس", totalVerses: 15, startPage: 595, juz: 30 },
  { number: 92, name: "Al-Lail", arabic: "الليل", totalVerses: 21, startPage: 595, juz: 30 },
  { number: 93, name: "Ad-Duha", arabic: "الضحى", totalVerses: 11, startPage: 596, juz: 30 },
  { number: 94, name: "Asy-Syarh", arabic: "الشرح", totalVerses: 8, startPage: 596, juz: 30 },
  { number: 95, name: "At-Tin", arabic: "التين", totalVerses: 8, startPage: 597, juz: 30 },
  { number: 96, name: "Al-'Alaq", arabic: "العلق", totalVerses: 19, startPage: 597, juz: 30 },
  { number: 97, name: "Al-Qadr", arabic: "القدر", totalVerses: 5, startPage: 598, juz: 30 },
  { number: 98, name: "Al-Bayyinah", arabic: "البينة", totalVerses: 8, startPage: 598, juz: 30 },
  { number: 99, name: "Az-Zalzalah", arabic: "الزلزلة", totalVerses: 8, startPage: 599, juz: 30 },
  { number: 100, name: "Al-'Adiyat", arabic: "العاديات", totalVerses: 11, startPage: 599, juz: 30 },
  { number: 101, name: "Al-Qari'ah", arabic: "القارعة", totalVerses: 11, startPage: 600, juz: 30 },
  { number: 102, name: "At-Takasur", arabic: "التكاثر", totalVerses: 8, startPage: 600, juz: 30 },
  { number: 103, name: "Al-'Asr", arabic: "العصر", totalVerses: 3, startPage: 601, juz: 30 },
  { number: 104, name: "Al-Humazah", arabic: "الهمزة", totalVerses: 9, startPage: 601, juz: 30 },
  { number: 105, name: "Al-Fil", arabic: "الفيل", totalVerses: 5, startPage: 601, juz: 30 },
  { number: 106, name: "Quraisy", arabic: "قريش", totalVerses: 4, startPage: 602, juz: 30 },
  { number: 107, name: "Al-Ma'un", arabic: "الماعون", totalVerses: 7, startPage: 602, juz: 30 },
  { number: 108, name: "Al-Kausar", arabic: "الكوثر", totalVerses: 3, startPage: 602, juz: 30 },
  { number: 109, name: "Al-Kafirun", arabic: "الكافرون", totalVerses: 6, startPage: 603, juz: 30 },
  { number: 110, name: "An-Nasr", arabic: "النصر", totalVerses: 3, startPage: 603, juz: 30 },
  { number: 111, name: "Al-Lahab", arabic: "اللهب", totalVerses: 5, startPage: 603, juz: 30 },
  { number: 112, name: "Al-Ikhlas", arabic: "الإخلاص", totalVerses: 4, startPage: 604, juz: 30 },
  { number: 113, name: "Al-Falaq", arabic: "الفلق", totalVerses: 5, startPage: 604, juz: 30 },
  { number: 114, name: "An-Nas", arabic: "الناس", totalVerses: 6, startPage: 604, juz: 30 }
];

/**
 * Get Surah metadata by number (1-114)
 */
export function getSurahMeta(surahNumber: number): SurahMeta | undefined {
  return SURAH_PAGE_DATA.find((s) => s.number === Number(surahNumber));
}

/**
 * Convert a specific Surah & Verse to estimated/accurate Page Number in 604-page Mushaf
 */
export function getPageForVerse(surahNumber: number, verseNumber: number): number {
  const currentSurah = getSurahMeta(surahNumber);
  if (!currentSurah) return 1;

  // If next surah exists, calculate page span
  const nextSurah = getSurahMeta(surahNumber + 1);
  const startPage = currentSurah.startPage;
  const endPage = nextSurah ? nextSurah.startPage : 604;
  const totalPagesInSurah = Math.max(1, endPage - startPage);

  const safeVerse = Math.max(1, Math.min(Number(verseNumber) || 1, currentSurah.totalVerses));

  // Interpolate page position within surah
  const ratio = (safeVerse - 1) / Math.max(1, currentSurah.totalVerses);
  const calculatedPage = Math.floor(startPage + ratio * totalPagesInSurah);

  return Math.min(604, Math.max(1, calculatedPage));
}

/**
 * Calculate total verses between 2 coordinates
 */
export function calculateTotalVerses(
  surahMulai: number,
  ayatMulai: number,
  suratSelesai: number,
  ayatSelesai: number
): number {
  if (surahMulai === suratSelesai) {
    return Math.max(1, Number(ayatSelesai) - Number(ayatMulai) + 1);
  }

  let total = 0;
  for (let s = surahMulai; s <= suratSelesai; s++) {
    const meta = getSurahMeta(s);
    if (!meta) continue;

    if (s === surahMulai) {
      total += Math.max(1, meta.totalVerses - Number(ayatMulai) + 1);
    } else if (s === suratSelesai) {
      total += Math.max(1, Number(ayatSelesai));
    } else {
      total += meta.totalVerses;
    }
  }
  return Math.max(1, total);
}

/**
 * Convert start & end verse to page range and total pages
 */
export function calculatePagesAndStats(
  surahMulai: number,
  ayatMulai: number,
  suratSelesai: number,
  ayatSelesai: number
) {
  const pageStart = getPageForVerse(surahMulai, ayatMulai);
  const pageEnd = getPageForVerse(suratSelesai, ayatSelesai);
  const totalVerses = calculateTotalVerses(surahMulai, ayatMulai, suratSelesai, ayatSelesai);

  // Total pages: if on same page, min 1 or partial (e.g. 1)
  const totalPages = Math.max(1, pageEnd - pageStart + 1);

  return {
    pageStart,
    pageEnd,
    totalPages,
    totalVerses,
  };
}
