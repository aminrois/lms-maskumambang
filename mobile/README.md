# LMS Maskumambang Mobile App (Android & iOS)

Aplikasi mobile resmi untuk **LMS Pondok Pesantren Maskumambang** berbasis **React Native (Expo SDK 52+) & TypeScript**.

---

## 📱 Fitur Utama Aplikasi Mobile
1. **Otentikasi & Sesi Otomatis**:
   - Login menggunakan Username / Email / NIP / NISN dan Kata Sandi.
   - Sesi tersimpan aman (*Persistent Login*) menggunakan AsyncStorage.
   - Pengaturan alamat Server API dinamis (Local Dev / Production VPS).
2. **Dashboard Guru**:
   - Ringkasan sesi mengajar hari ini.
   - Status presensi & verifikasi Lesson Plan (RPP).
   - Filter jadwal berdasarkan hari (Senin - Sabtu).
   - Tombol cepat **"ISI ABSENSI SEKARANG"**.
3. **Form Presensi Siswa (Absensi Mapel)**:
   - Daftar siswa otomatis sesuai kelas & mapel.
   - Tombol **"Set Semua Hadir"** untuk pengisian presensi super cepat.
   - Opsi status: **H** (Hadir), **S** (Sakit), **I** (Izin), **A** (Alpha).
   - Input materi/topik KBM & catatan guru.
4. **Jadwal Pelajaran**:
   - Melihat rincian jam pelajaran mengajar mingguan.
5. **Profil Pengguna**:
   - Informasi akun, NIP, peran, dan tombol logout aman.

---

## 🚀 Cara Menjalankan Aplikasi di HP / Emulator

### 1. Masuk ke folder mobile
```bash
cd mobile
```

### 2. Jalankan Expo Development Server
```bash
npx expo start
```

### 3. Membuka di Smartphone Fisik:
- **Android**: Pasang aplikasi **Expo Go** dari Google Play Store, lalu scan QR code yang muncul di terminal.
- **iPhone / iOS**: Pasang aplikasi **Expo Go** dari Apple App Store, buka aplikasi Kamera bawaan iPhone, lalu scan QR code.

### 4. Menghubungkan ke Backend Lokal:
- Pastikan HP dan Laptop/Komputer berada di dalam **jaringan Wi-Fi yang sama**.
- Pada halaman Login aplikasi di HP, klik **"Server: ..."** di bagian bawah form, lalu masukkan IP komputer Anda (misal `http://192.168.1.10:3000/api`) atau pilih **Production VPS**.

---

## 📦 Build Aplikasi Standalone (APK Android / IPA iOS)

Untuk menghasilkan file installer `.apk` (Android) tanpa kabel:
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
