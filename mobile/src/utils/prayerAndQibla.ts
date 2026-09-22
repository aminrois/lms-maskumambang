// mobile/src/utils/prayerAndQibla.ts

export interface CityLocation {
  id: string;
  name: string;
  province: string;
  latitude: number;
  longitude: number;
  timezoneOffset: number; // WIB: 7, WITA: 8, WIT: 9
}

export const INDONESIAN_CITIES: CityLocation[] = [
  { id: "gresik", name: "Gresik", province: "Jawa Timur", latitude: -6.9325, longitude: 112.5642, timezoneOffset: 7 },
  { id: "surabaya", name: "Surabaya", province: "Jawa Timur", latitude: -7.2575, longitude: 112.7521, timezoneOffset: 7 },
  { id: "sidoarjo", name: "Sidoarjo", province: "Jawa Timur", latitude: -7.4478, longitude: 112.7183, timezoneOffset: 7 },
  { id: "lamongan", name: "Lamongan", province: "Jawa Timur", latitude: -7.1199, longitude: 112.4145, timezoneOffset: 7 },
  { id: "tuban", name: "Tuban", province: "Jawa Timur", latitude: -6.8976, longitude: 112.0649, timezoneOffset: 7 },
  { id: "mojokerto", name: "Mojokerto", province: "Jawa Timur", latitude: -7.4726, longitude: 112.4381, timezoneOffset: 7 },
  { id: "malang", name: "Malang", province: "Jawa Timur", latitude: -7.9797, longitude: 112.6304, timezoneOffset: 7 },
  { id: "pasuruan", name: "Pasuruan", province: "Jawa Timur", latitude: -7.6453, longitude: 112.9075, timezoneOffset: 7 },
  { id: "jombang", name: "Jombang", province: "Jawa Timur", latitude: -7.5468, longitude: 112.2331, timezoneOffset: 7 },
  { id: "kediri", name: "Kediri", province: "Jawa Timur", latitude: -7.8480, longitude: 112.0178, timezoneOffset: 7 },
  { id: "madiun", name: "Madiun", province: "Jawa Timur", latitude: -7.6298, longitude: 111.5239, timezoneOffset: 7 },
  { id: "banyuwangi", name: "Banyuwangi", province: "Jawa Timur", latitude: -8.2192, longitude: 114.3691, timezoneOffset: 7 },
  { id: "semarang", name: "Semarang", province: "Jawa Tengah", latitude: -6.9667, longitude: 110.4167, timezoneOffset: 7 },
  { id: "solo", name: "Surakarta (Solo)", province: "Jawa Tengah", latitude: -7.5755, longitude: 110.8243, timezoneOffset: 7 },
  { id: "yogyakarta", name: "Yogyakarta", province: "D.I. Yogyakarta", latitude: -7.7956, longitude: 110.3695, timezoneOffset: 7 },
  { id: "bandung", name: "Bandung", province: "Jawa Barat", latitude: -6.9175, longitude: 107.6191, timezoneOffset: 7 },
  { id: "jakarta", name: "DKI Jakarta", province: "DKI Jakarta", latitude: -6.2088, longitude: 106.8456, timezoneOffset: 7 },
  { id: "tangerang", name: "Tangerang", province: "Banten", latitude: -6.1783, longitude: 106.6319, timezoneOffset: 7 },
  { id: "bekasi", name: "Bekasi", province: "Jawa Barat", latitude: -6.2383, longitude: 106.9756, timezoneOffset: 7 },
  { id: "bogor", name: "Bogor", province: "Jawa Barat", latitude: -6.5971, longitude: 106.8060, timezoneOffset: 7 },
  { id: "medan", name: "Medan", province: "Sumatera Utara", latitude: 3.5952, longitude: 98.6722, timezoneOffset: 7 },
  { id: "padang", name: "Padang", province: "Sumatera Barat", latitude: -0.9471, longitude: 100.4172, timezoneOffset: 7 },
  { id: "palembang", name: "Palembang", province: "Sumatera Selatan", latitude: -2.9761, longitude: 104.7754, timezoneOffset: 7 },
  { id: "makassar", name: "Makassar", province: "Sulawesi Selatan", latitude: -5.1477, longitude: 119.4327, timezoneOffset: 8 },
  { id: "banjarmasin", name: "Banjarmasin", province: "Kalimantan Selatan", latitude: -3.3194, longitude: 114.5908, timezoneOffset: 8 },
  { id: "balikpapan", name: "Balikpapan", province: "Kalimantan Timur", latitude: -1.2379, longitude: 116.8529, timezoneOffset: 8 },
  { id: "denpasar", name: "Denpasar", province: "Bali", latitude: -8.6705, longitude: 115.2126, timezoneOffset: 8 },
  { id: "mataram", name: "Mataram (Lombok)", province: "NTB", latitude: -8.5833, longitude: 116.1167, timezoneOffset: 8 },
];

const KAABA_LAT = 21.422487;
const KAABA_LON = 39.826206;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

// Hitung sudut Kiblat (Bearing dari Utara searah jarum jam)
export function calculateQiblaBearing(lat: number, lon: number): number {
  const phi1 = toRad(lat);
  const phi2 = toRad(KAABA_LAT);
  const deltaLam = toRad(KAABA_LON - lon);

  const y = Math.sin(deltaLam);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLam);

  let qibla = toDeg(Math.atan2(y, x));
  qibla = (qibla + 360) % 360;
  return Number(qibla.toFixed(1));
}

// Hitung jarak ke Ka'bah dalam KM (Haversine formula)
export function calculateDistanceToKaaba(lat: number, lon: number): number {
  const R = 6371; // Radius bumi KM
  const dLat = toRad(KAABA_LAT - lat);
  const dLon = toRad(KAABA_LON - lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat)) * Math.cos(toRad(KAABA_LAT)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Temukan kota terdekat dari koordinat GPS
export function findNearestCity(lat: number, lon: number): CityLocation {
  let nearest = INDONESIAN_CITIES[0];
  let minDist = Number.MAX_VALUE;

  for (const city of INDONESIAN_CITIES) {
    const dLat = city.latitude - lat;
    const dLon = city.longitude - lon;
    const dist = dLat * dLat + dLon * dLon;
    if (dist < minDist) {
      minDist = dist;
      nearest = city;
    }
  }

  return nearest;
}

// Hitung waktu sholat (Metode Kemenag RI Standard: Subuh -20°, Isya -18°)
export function calculatePrayerTimes(city: CityLocation, date: Date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Julian Date
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const JD =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  const D = JD - 2451545.0;

  // Posisi Matahari
  const g = (357.529 + 0.98560028 * D) % 360;
  const q = (280.459 + 0.98564736 * D) % 360;
  const L = (q + 1.915 * Math.sin(toRad(g)) + 0.02 * Math.sin(toRad(2 * g))) % 360;
  const e = 23.439 - 0.00000036 * D;

  // Deklinasi matahari & Equation of Time (EoT)
  const RA = toDeg(Math.atan2(Math.cos(toRad(e)) * Math.sin(toRad(L)), Math.cos(toRad(L)))) / 15;
  const decl = Math.asin(Math.sin(toRad(e)) * Math.sin(toRad(L)));
  const dHour = q / 15 - (RA < 0 ? RA + 24 : RA);
  const EoT = dHour * 60; // dalam menit

  const latRad = toRad(city.latitude);

  // Waktu Transit Dzuhur
  const noon = 12 + city.timezoneOffset - city.longitude / 15 - EoT / 60;

  // Sudut Subuh (-20° standar Kemenag) & Isya (-18°)
  const subuhAngle = toRad(-20);
  const isyaAngle = toRad(-18);
  const terbitAngle = toRad(-0.833); // Sunrise/Sunset sudut refraksi

  const calcHourAngle = (angle: number) => {
    const cosHA = (Math.sin(angle) - Math.sin(latRad) * Math.sin(decl)) / (Math.cos(latRad) * Math.cos(decl));
    if (cosHA > 1 || cosHA < -1) return 0;
    return toDeg(Math.acos(cosHA)) / 15;
  };

  const haSubuh = calcHourAngle(subuhAngle);
  const haTerbit = calcHourAngle(terbitAngle);
  const haIsya = calcHourAngle(isyaAngle);

  // Ashar: bayangan = panjang objek + bayangan saat dzuhur (Syafii)
  const asharAlt = Math.atan(1 / (1 + Math.tan(Math.abs(latRad - decl))));
  const haAshar = calcHourAngle(asharAlt);

  const toTimeString = (hours: number, addMinutes: number = 2): string => {
    let totalMinutes = Math.round(hours * 60) + addMinutes; // Ihtiyat +2 menit
    let h = Math.floor(totalMinutes / 60) % 24;
    let min = totalMinutes % 60;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  };

  const subuhHours = noon - haSubuh;
  const terbitHours = noon - haTerbit;
  const dzuhurHours = noon;
  const asharHours = noon + haAshar;
  const maghribHours = noon + haTerbit;
  const isyaHours = noon + haIsya;
  const imsakHours = subuhHours - 10 / 60; // Imsak 10 menit sebelum subuh
  const dhuhaHours = terbitHours + 25 / 60;

  const times = {
    imsak: toTimeString(imsakHours, 0),
    subuh: toTimeString(subuhHours, 2),
    terbit: toTimeString(terbitHours, -2),
    dhuha: toTimeString(dhuhaHours, 0),
    dzuhur: toTimeString(dzuhurHours, 2),
    ashar: toTimeString(asharHours, 2),
    maghrib: toTimeString(maghribHours, 2),
    isya: toTimeString(isyaHours, 2),
  };

  // Tentukan sholat berikutnya & countdown
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const prayerList = [
    { name: "Subuh", time: times.subuh },
    { name: "Dzuhur", time: times.dzuhur },
    { name: "Ashar", time: times.ashar },
    { name: "Maghrib", time: times.maghrib },
    { name: "Isya", time: times.isya },
  ];

  let nextPrayer = prayerList[0];
  let countdown = "00:00:00";

  for (const p of prayerList) {
    const [pH, pM] = p.time.split(":").map(Number);
    const pMinutes = pH * 60 + pM;
    if (pMinutes > currentMinutes) {
      nextPrayer = p;
      const diffMin = pMinutes - currentMinutes;
      const diffH = Math.floor(diffMin / 60);
      const diffM = diffMin % 60;
      countdown = `${diffH}j ${diffM}m lagi`;
      break;
    }
  }

  return {
    times,
    nextPrayer: {
      name: nextPrayer.name,
      time: nextPrayer.time,
      countdown,
    },
    qiblaBearing: calculateQiblaBearing(city.latitude, city.longitude),
    distanceKaaba: calculateDistanceToKaaba(city.latitude, city.longitude),
  };
}
