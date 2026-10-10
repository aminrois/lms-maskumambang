// mobile/src/store/useLocationStore.ts
// Store terpusat untuk lokasi perangkat (GPS / Lokasi Manual)

import { create } from "zustand";
import * as Location from "expo-location";
import {
  CityLocation,
  INDONESIAN_CITIES,
  findNearestCity,
} from "../utils/prayerAndQibla";

interface LocationState {
  currentLocation: CityLocation;
  isGpsActive: boolean;
  isLoadingGps: boolean;
  gpsError: string | null;
  fetchCurrentLocation: (force?: boolean) => Promise<CityLocation>;
  setSelectedCity: (city: CityLocation) => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  // Default ke Gresik (lokasi pondok Maskumambang)
  currentLocation: INDONESIAN_CITIES[0],
  isGpsActive: false,
  isLoadingGps: false,
  gpsError: null,

  fetchCurrentLocation: async (force: boolean = false) => {
    const state = get();
    // Jika sedang loading, hindari pemanggilan ganda
    if (state.isLoadingGps && !force) {
      return state.currentLocation;
    }

    set({ isLoadingGps: true, gpsError: null });

    try {
      // 1. Minta izin akses lokasi foreground
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        set({
          isLoadingGps: false,
          isGpsActive: false,
          gpsError: "Izin akses lokasi tidak diberikan. Menggunakan lokasi default.",
        });
        return state.currentLocation;
      }

      // 2. Ambil koordinat GPS perangkat saat ini
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // 3. Reverse geocode untuk mendapatkan nama kota/kabupaten
      let cityName = "";
      let provinceName = "";

      try {
        const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (addresses && addresses.length > 0) {
          const addr = addresses[0];
          // Normalisasi nama (misal "Kabupaten Gresik" -> "Gresik")
          const rawCity = addr.subregion || addr.city || addr.district || "";
          cityName = rawCity
            .replace(/^Kabupaten\s+/i, "")
            .replace(/^Kota\s+/i, "")
            .trim();
          provinceName = addr.region || "";
        }
      } catch (geocodeErr) {
        console.warn("Reverse geocode gagal, mencari kota terdekat:", geocodeErr);
      }

      // Jika reverse geocode tidak menghasilkan nama kota, cari kota terdekat dari database lokal
      const nearest = findNearestCity(latitude, longitude);
      if (!cityName) {
        cityName = nearest.name;
        provinceName = nearest.province;
      }

      // Tentukan zona waktu Indonesia berdasarkan longitude
      let timezoneOffset = 7; // WIB
      if (longitude >= 115 && longitude < 125) {
        timezoneOffset = 8; // WITA
      } else if (longitude >= 125) {
        timezoneOffset = 9; // WIT
      }

      const deviceLocation: CityLocation = {
        id: `gps_${latitude.toFixed(4)}_${longitude.toFixed(4)}`,
        name: cityName,
        province: provinceName || nearest.province,
        latitude,
        longitude,
        timezoneOffset,
      };

      set({
        currentLocation: deviceLocation,
        isGpsActive: true,
        isLoadingGps: false,
        gpsError: null,
      });

      return deviceLocation;
    } catch (err: any) {
      console.warn("Gagal mendapatkan lokasi GPS perangkat:", err);
      set({
        isLoadingGps: false,
        isGpsActive: false,
        gpsError: err?.message || "Gagal mendeteksi lokasi GPS",
      });
      return state.currentLocation;
    }
  },

  setSelectedCity: (city: CityLocation) => {
    set({
      currentLocation: city,
      isGpsActive: false,
      gpsError: null,
    });
  },
}));
