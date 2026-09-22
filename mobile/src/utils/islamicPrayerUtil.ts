// mobile/src/utils/islamicPrayerUtil.ts

export interface PrayerTimesData {
  subuh: string;
  terbit: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  nextPrayer: {
    name: string;
    time: string;
    countdown: string; // e.g. "03:12 lagi"
  };
  gregorianDateFormatted: string; // e.g. "Selasa, 23 September 2025"
  hijriDateFormatted: string; // e.g. "30 Rabiul Awal 1447 H"
  locationName: string;
}

export interface DoaItem {
  id: string;
  judul: string;
  kategori: string;
  arab: string;
  latin: string;
  arti: string;
  riwayat?: string;
}

// Konversi tanggal Masehi ke Hijriah (Algoritma Umm al-Qura estimasi akurat)
export function getHijriDate(date: Date = new Date()): { day: number; monthName: string; year: number } {
  const hijriMonths = [
    "Muharram",
    "Safar",
    "Rabiul Awal",
    "Rabiul Akhir",
    "Jumadil Ula",
    "Jumadil Akhir",
    "Rajab",
    "Sya'ban",
    "Ramadhan",
    "Syawwal",
    "Dzulqa'dah",
    "Dzulhijjah",
  ];

  // Rumus estimasi Julian Day Number ke Kalender Hijriah
  const jd = Math.floor((date.getTime() + 86400000 * 2440587.5) / 86400000);
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const m = Math.floor((24 * l3) / 709);
  const d = l3 - Math.floor((709 * m) / 24);
  const y = 30 * n + j - 30;

  const safeMonthIdx = Math.max(0, Math.min(11, m - 1));
  return {
    day: Math.max(1, Math.min(30, d)),
    monthName: hijriMonths[safeMonthIdx] || "Rabiul Awal",
    year: y,
  };
}

// Format waktu jam:menit
function formatHHMM(hours: number): string {
  const h = Math.floor(hours) % 24;
  const m = Math.floor((hours - Math.floor(hours)) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Hitung Jadwal Sholat untuk Gresik / Jawa Timur (Lat: -6.93, Lon: 112.56, GMT+7)
export function getPrayerTimes(date: Date = new Date()): PrayerTimesData {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );

  // Perkiraan deklinasi matahari dan persamaan waktu
  const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b); // Equation of Time in mins
  const declination = 23.45 * Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365); // Sun Declination in deg

  const lat = -6.93; // Gresik
  const lon = 112.56;
  const timezone = 7; // WIB

  // Transit matahari (Dzuhur)
  const noon = 12 + timezone - lon / 15 - eot / 60;

  // Sudut zenith
  const rad = Math.PI / 180;
  const latRad = lat * rad;
  const decRad = declination * rad;

  // Subuh (sun -20 deg di bawah horizon standar Kemenag RI)
  const subuhHourAngle =
    Math.acos(
      (Math.sin(-20 * rad) - Math.sin(latRad) * Math.sin(decRad)) /
        (Math.cos(latRad) * Math.cos(decRad))
    ) / rad;

  // Terbit (sun -0.833 deg)
  const sunriseHourAngle =
    Math.acos(
      (Math.sin(-0.833 * rad) - Math.sin(latRad) * Math.sin(decRad)) /
        (Math.cos(latRad) * Math.cos(decRad))
    ) / rad;

  // Ashar (bayangan = panjang benda + bayangan saat dzuhur, standar Syafi'i)
  const asharAltitude =
    Math.atan(1 / (1 + Math.tan(Math.abs(lat - declination) * rad))) / rad;
  const asharHourAngle =
    Math.acos(
      (Math.sin(asharAltitude * rad) - Math.sin(latRad) * Math.sin(decRad)) /
        (Math.cos(latRad) * Math.cos(decRad))
    ) / rad;

  // Maghrib (sun -0.833 deg)
  const maghribHourAngle = sunriseHourAngle;

  // Isya (sun -18 deg di bawah horizon standar Kemenag RI)
  const isyaHourAngle =
    Math.acos(
      (Math.sin(-18 * rad) - Math.sin(latRad) * Math.sin(decRad)) /
        (Math.cos(latRad) * Math.cos(decRad))
    ) / rad;

  // Waktu dalam jam desimal (ditambah ikhtiyat / safety 2 menit = 2/60 = 0.033 jam)
  const subuhDec = noon - subuhHourAngle / 15 + 0.033;
  const terbitDec = noon - sunriseHourAngle / 15 - 0.033;
  const dzuhurDec = noon + 0.033;
  const asharDec = noon + asharHourAngle / 15 + 0.033;
  const maghribDec = noon + maghribHourAngle / 15 + 0.033;
  const isyaDec = noon + isyaHourAngle / 15 + 0.033;

  const nowHours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

  // Tentukan sholat berikutnya & countdown
  const schedule = [
    { name: "Subuh", dec: subuhDec, formatted: formatHHMM(subuhDec) },
    { name: "Dzuhur", dec: dzuhurDec, formatted: formatHHMM(dzuhurDec) },
    { name: "Ashar", dec: asharDec, formatted: formatHHMM(asharDec) },
    { name: "Maghrib", dec: maghribDec, formatted: formatHHMM(maghribDec) },
    { name: "Isya", dec: isyaDec, formatted: formatHHMM(isyaDec) },
  ];

  let next = schedule.find((s) => s.dec > nowHours);
  let diffHours = 0;

  if (!next) {
    // Lewat Isya, sholat berikutnya adalah Subuh besok
    next = schedule[0];
    diffHours = 24 - nowHours + subuhDec;
  } else {
    diffHours = next.dec - nowHours;
  }

  const cdHours = Math.floor(diffHours);
  const cdMinutes = Math.floor((diffHours - cdHours) * 60);
  const countdownStr = `${String(cdHours).padStart(2, "0")}:${String(cdMinutes).padStart(2, "0")} lagi`;

  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const gregorianDateFormatted = `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;

  const hijri = getHijriDate(date);
  const hijriDateFormatted = `${hijri.day} ${hijri.monthName} ${hijri.year} H`;

  return {
    subuh: formatHHMM(subuhDec),
    terbit: formatHHMM(terbitDec),
    dzuhur: formatHHMM(dzuhurDec),
    ashar: formatHHMM(asharDec),
    maghrib: formatHHMM(maghribDec),
    isya: formatHHMM(isyaDec),
    nextPrayer: {
      name: next.name,
      time: next.formatted,
      countdown: countdownStr,
    },
    gregorianDateFormatted,
    hijriDateFormatted,
    locationName: "Pondok Pesantren Maskumambang, Gresik",
  };
}

// Kumpulan Doa & Dzikir Harian Pilihan Pesantren
export const DOA_DZIKIR_LIST: DoaItem[] = [
  {
    id: "dzikir_pagi_1",
    judul: "Sayyidul Istighfar",
    kategori: "Dzikir Pagi & Petang",
    arab: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    latin: "Allahumma anta rabbi laa ilaaha illaa anta khalaqtanii wa anaa 'abduka wa anaa 'alaa 'ahdika wa wa'dika mastatha'tu, a'uudzu bika min syarri maa shana'tu, abuu-u laka bini'matika 'alayya wa abuu-u bidzanbii faghfirlii fa-innahu laa yaghfirudz-dzunuuba illaa anta.",
    arti: "Ya Allah, Engkau adalah Tuhanku, tidak ada Tuhan yang berhak disembah selain Engkau. Engkaulah yang menciptakanku dan aku adalah hamba-Mu. Aku akan setia pada janji-Mu semampuku. Aku berlindung kepada-Mu dari keburukan apa yang telah kuperbuat. Aku mengakui segala nikmat-Mu kepadaku dan aku mengakui dosaku, maka ampunilah aku. Sungguh tiada yang mengampuni dosa selain Engkau.",
    riwayat: "HR. Bukhari no. 6306",
  },
  {
    id: "doa_belajar",
    judul: "Doa Sebelum Belajar / Menuntut Ilmu",
    kategori: "KBM & Pelajaran",
    arab: "رَبِّ زِدْنِي عِلْمًا وَارْزُقْنِي فَهْمًا وَاجْعَلْنِي مِنَ الصَّالِحِينَ",
    latin: "Robbi zidnii 'ilman warzuqnii fahman waj'alnii minash-shoolihiin.",
    arti: "Ya Tuhanku, tambahkanlah kepadaku ilmu pengetahuan, dan berilah aku karunia untuk memahaminya, serta jadikanlah aku termasuk golongan orang-orang yang shaleh.",
    riwayat: "QS. Thaha: 114 & Doa Salaf",
  },
  {
    id: "doa_kemudahan",
    judul: "Doa Memohon Kemudahan Segala Urusan",
    kategori: "Doa Harian",
    arab: "اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا",
    latin: "Allahumma laa sahla illaa maa ja'altahu sahlaa, wa anta taj'alul hazna idza syi'ta sahlaa.",
    arti: "Ya Allah, tidak ada kemudahan kecuali apa yang Engkau jadikan mudah. Dan Engkau menjadikan kesulitan, jika Engkau kehendaki, menjadi mudah.",
    riwayat: "HR. Ibnu Hibban no. 327",
  },
  {
    id: "dzikir_sore",
    judul: "Doa Perlindungan Pagi & Petang",
    kategori: "Dzikir Pagi & Petang",
    arab: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    latin: "Bismillahilladzi laa yadhurru ma'asmihi syai-un fil ardhi wa laa fis-samaa-i wa huwas-samii'ul 'aliim. (3x)",
    arti: "Dengan menyebut nama Allah yang dengan sebab nama-Nya tidak ada sesuatu pun di bumi maupun di langit yang dapat membahayakan, dan Dia Maha Mendengar lagi Maha Mengetahui.",
    riwayat: "HR. Abu Dawud & Tirmidzi",
  },
  {
    id: "doa_kedua_orang_tua",
    judul: "Doa untuk Kedua Orang Tua & Guru",
    kategori: "Doa Harian",
    arab: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا وَلِمَشَايِخِنَا وَمُعَلِّمِينَا",
    latin: "Rabbighfirlii waliwaalidayya warhamhumaa kamaa rabbayaanii shaghiiraa, wali masyaayikhinaa wa mu'allimiinaa.",
    arti: "Ya Tuhanku, ampunilah aku dan kedua orang tuaku, sayangilah mereka sebagaimana mereka telah menyayangiku di waktu kecil, serta ampunilah guru-guru dan masyayikh kami.",
    riwayat: "QS. Al-Isra: 24",
  },
];
