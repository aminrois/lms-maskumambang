// src/data/tahfidzPresets.ts

export interface HaditsBookInfo {
  name: string;
  defaultMaxNumber?: number;
  description?: string;
}

export const HADITS_BOOK_PRESETS: HaditsBookInfo[] = [
  { name: "Hadits Arbain/Khamsin", defaultMaxNumber: 50, description: "Kumpulan 42-50 Hadits Pokok Islam oleh Imam Nawawi / Ibnu Rajab" },
  { name: "150 Hadis Abu Hurairah Pilihan", defaultMaxNumber: 150, description: "150 Hadits Pilihan Riwayat Abu Hurairah RA" },
  { name: "Hadits Bahjatul Qulub", defaultMaxNumber: 99, description: "Bahjatul Qulubil Abrar oleh Syaikh As-Sa'di" },
  { name: "Hadits Bulughul Maram", defaultMaxNumber: 1500, description: "Hadits Hukum oleh Ibnu Hajar Al-Asqalani" },
  { name: "Hadits Riyadhush Shalihin", defaultMaxNumber: 1900, description: "Taman Orang-Orang Shalih oleh Imam Nawawi" },
  { name: "Hadits Umdatul Ahkam", defaultMaxNumber: 420, description: "Hadits Hukum Shahihain oleh Al-Maqdisi" },
  { name: "Hadits Shahih Bukhari Ringkasan", defaultMaxNumber: 1000, description: "Mukhtashar Shahih Bukhari" },
  { name: "Hadits Lainnya (Kustom)", description: "Kitab atau kumpulan hadits lainnya" },
];

export interface MatanInfo {
  name: string;
  bidang: string;
  defaultBait?: number;
  description?: string;
}

export const MATAN_PRESETS: MatanInfo[] = [
  { name: "Tuhfatul Athfal", bidang: "Tajwid", defaultBait: 61, description: "Matan kaidah tajwid oleh Syaikh Al-Jamzuri (61 Bait)" },
  { name: "Matan Al-Jazariyyah", bidang: "Tajwid & Makhorijul Huruf", defaultBait: 107, description: "Matan tajwid oleh Imam Ibnul Jazari (107 Bait)" },
  { name: "Matan Al-Jurumiyyah", bidang: "Nahwu / Tata Bahasa Arab", description: "Matan kaidah nahwu dasar oleh Ibnu Ajurrum" },
  { name: "Al-Khulashah / Alfiyah Ibnu Malik", bidang: "Nahwu & Sharaf", defaultBait: 1002, description: "1002 Bait kaidah bahasa Arab oleh Ibnu Malik" },
  { name: "Matan Al-Baiquniyyah", bidang: "Musthalah Hadits", defaultBait: 34, description: "Kaidah ilmu musthalah hadits oleh Al-Baiquni (34 Bait)" },
  { name: "Aqidatul Awam", bidang: "Aqidah", defaultBait: 57, description: "Matan aqidah dasar oleh Syaikh Ahmad Al-Marzuqi" },
  { name: "Matan Al-Ghayah wat Taqrib (Abu Syuja')", bidang: "Fiqih Syafi'i", description: "Ringkasan fiqih Syafi'i oleh Al-Qadhi Abu Syuja'" },
  { name: "Matan Ushul Tsalatsah", bidang: "Aqidah & Tauhid", description: "Tiga Landasan Utama oleh Syaikh Muhammad bin Abdul Wahhab" },
  { name: "Matan Lainnya (Kustom)", bidang: "Lainnya", description: "Matan ilmu lainnya" }
];

export const KELANCARAN_OPTIONS = [
  { label: "Sangat Lancar", value: "Sangat Lancar", color: "bg-emerald-50 text-emerald-700 border-emerald-300" },
  { label: "Lancar", value: "Lancar", color: "bg-blue-50 text-blue-700 border-blue-300" },
  { label: "Kurang Lancar", value: "Kurang Lancar", color: "bg-amber-50 text-amber-700 border-amber-300" },
  { label: "Belum Lancar", value: "Belum Lancar", color: "bg-rose-50 text-rose-700 border-rose-300" }
];
