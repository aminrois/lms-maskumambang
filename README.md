# 🎓 Maskumambang LMS (MLMS Web)

**MLMS (Maskumambang Learning Management System) Web** adalah aplikasi manajemen pendidikan terpadu berbasis web yang dirancang untuk mengelola seluruh ekosistem operasional dan akademik di lingkungan sekolah dan pesantren **Pondok Pesantren Maskumambang (Gresik, Jawa Timur)**. 

Aplikasi ini mencakup pengelolaan Master Data terpusat (Lembaga, Kelas, Siswa, Pegawai, Wali Murid), Pengaturan Akademik (Mata Pelajaran, Kalender Akademik, Jam Akademik, Jadwal Pelajaran & Guru), Kegiatan Belajar Mengajar (Absensi Pelajaran Wizard, Jurnal Mengajar, RPP / Lesson Plan, Monitoring KBM, Activity Plan), hingga Sistem Keamanan & Autentikasi berbasis Peran (RBAC).

---

## 📋 Daftar Dokumen Pendukung

- 📖 **Dokumentasi Utama Sistem & Cara Menjalankan**: `README.md` *(File ini)*
- 📝 **Catatan Perubahan & Patch Notes Terlengkap**: **[CHANGELOG.md](file:///home/deiro/Program%20Files/VS%20Code/Web/KKN/mlms_web/CHANGELOG.md)** / **[PATCH_NOTES.md](file:///home/deiro/Program%20Files/VS%20Code/Web/KKN/mlms_web/PATCH_NOTES.md)**
- 📋 **Daftar Tugas & Riwayat Pengerjaan**: **[dokumen api/daftar tugas.md](file:///home/deiro/Program%20Files/VS%20Code/Web/KKN/mlms_web/dokumen%20api/daftar%20tugas.md)**
- 🛠️ **Skrip CDC Supabase Realtime**: **[dokumen api/enable_supabase_realtime.sql](file:///home/deiro/Program%20Files/VS%20Code/Web/KKN/mlms_web/dokumen%20api/enable_supabase_realtime.sql)**

---

## 🚀 Teknologi & Stack Utama

Aplikasi ini dibangun menggunakan ekosistem web modern untuk memastikan performa yang cepat, arsitektur yang tangguh, antarmuka responsif, dan tingkat keamanan tinggi:

- **Frontend Framework**: React 19 (dengan Vite Build Engine)
- **Language**: TypeScript (Strict Type Checking)
- **Styling Framework**: Tailwind CSS v4 + Vanilla CSS Custom Utilities
- **UI Components & Icons**: shadcn/ui, Radix UI, & Lucide React Icons
- **Backend Infrastructure**: Supabase PostgreSQL (PostgREST RESTful API + Supabase Auth)
- **Realtime Synchronizations**: Supabase Realtime CDC (*Change Data Capture*)
- **State Management & Data Fetching**: TanStack React Query v5 & Zustand
- **Security & Bot Protection**: hCaptcha Integration (`@hcaptcha/react-hcaptcha`) & Canvas 2D Text Protection (`ProtectedCopyright.tsx`)
- **Editor & Formatting**: MDXEditor, React Markdown + Remark GFM
- **Routing**: React Router DOM (dengan Code Splitting & Lazy Loading)

---

## 🌟 Fitur Utama Sistem (Update Terbaru)

### 1. 🔐 Autentikasi & Keamanan (Auth)
- **Integrasi Supabase Auth + hCaptcha**: Proteksi form login dari serangan bot/bruteforce menggunakan widget hCaptcha (`VITE_HCAPTCHA_SITE_KEY`).
- **Proteksi Teks Copyright Canvas 2D (`ProtectedCopyright.tsx`)**: Teks *copyright* pada Halaman Login dan Halaman Utama dirrender menggunakan HTML5 Canvas 2D API yang terproteksi (tidak muncul sebagai *text node* DOM dan kebal modifikasi Inspect Element).
- **Session Timeout & Safeguard Berbasis Role**: Pemantauan inaktivitas pengguna otomatis (Super Admin: 20m, Guru/Wali Kelas: 35m) dilengkapi modal dialog countdown digital (MM:SS) serta proteksi *tab close grace period*.
- **Pembersihan Sesi Otomatis**: Penanganan mandiri terhadap galat 401 Unauthorized / *session expired* dengan pembersihan total token di lokal peramban.

### 2. 📊 Dashboard & Monitoring KBM
- **Dashboard Model 1 & 2**: Tampilan ringkasan statistik real-time yang disesuaikan secara otomatis berdasarkan peran pengakses (Model 1: Pimpinan/Admin; Model 2: Guru & Wali Kelas).
- **Monitoring KBM Universal & Wali Kelas**: Analisis kesesuaian realisasi KBM terhadap RPP (*Sesuai*, *Terlambat*, *Terlalu Cepat*) dilengkapi filter rentang tanggal, penetapan presisi `lembaga_id` kelas asuhan Wali Kelas, serta fitur Ekspor Excel.

### 3. 🏫 Master Data Terpusat
- **Entitas Master Data**: Pengelolaan lengkap data Lembaga, Kelas, Siswa, Pegawai, Wali Murid, dan Tahun Ajaran.
- **Bulk Select & Bulk Delete**: Fitur centang massal data berbasis Lembaga/Kelas dengan pembersihan relasi otomatis (*Relational Cleanup* penugasan Wali Kelas, Kepsek, WaKa) sebelum eksekusi penghapusan serta re-fetch query instan (`refetchType: 'all'`) dan mekanisme *fallback recovery* otomatis galat PostgREST `PGRST103` (`Requested range not satisfiable`) untuk memastikan tampilan tabel langsung terbarui secara real-time.
- **Impor Massal Bertahap (Batching) & Pratinjau 2 Tabel**: Pengunggahan massal data Siswa, Pegawai & Wali Murid via Excel secara sekuensial lengkap dengan *progress bar* realtime, penanganan toleran duplikasi akun auth (`400 Bad Request / 409 Conflict`) yang otomatis mengambil `user_id` eksisting tanpa membatalkan impor profil, tombol aksi header (*Template*, *Impor*, *Ekspor*) yang seragam di seluruh modul, pemisahan 2 tabel pratinjau (Tabel Atas: Data Bermasalah/Invalid & Tabel Bawah: Data Valid), validasi duplikasi cerdas yang mengabaikan nilai kosong/strip (`"-"`), penyelarasan 100% field wajib impor terhadap Form Modal Tambah Data, penayangan seluruh kolom data utuh pada tabel preview (31 kolom Siswa, 21 kolom Wali Murid, 20 kolom Pegawai), penandaan sel per kolom berbasis teks/kata murni (*badge-colored text*) tanpa emoji untuk data kosong/invalid/duplikat beserta tooltip error, pengoreksian kelengkapan penutup JSX & pengetatan tipe TypeScript (100% *clean build* `tsc -b && vite build`), dan pagination query untuk mencegah *timeout*.
- **Otomatisasi Tahun Ajaran**: Switch otomatis Tahun Ajaran aktif ganda dan pengaktifan instan via klik badge.
- **Sticky Column Table & Layering Protection**: Kolom Nama (*sticky left*) dan Kolom Aksi (*sticky right z-30/z-40*) tetap terkunci dan selalu berada paling atas (*always on top*) saat tabel digeser secara horizontal atau saat kolom ditarik/digeser sangat lebar.
- **Kontrol Hak Akses RBAC (Role-Based Access Control)**: Pengaturan granular tombol aksi (Create, Update, Delete) per role (misalnya hak akses CRUD penuh untuk Direktur & Wali Murid pada Master Data Wali Murid, serta status *read-only* untuk Admin Lembaga pada Master Data Pegawai).
- **Validasi Keunikan Data Wali Murid**: Pengisian data Wali Murid mendukung kesamaan Nama (duplikat nama diperbolehkan), namun tetap menegakkan validasi keunikan NIK (`nik_wali`) sebagai kredensial autentikasi akun user.

### 4. 📅 Modul Akademik
- **Mata Pelajaran & Relasi Kelas**: Pengelolaan mata pelajaran berbasis relasi per kelas (`kelas_mapel`).
- **Jam Akademik & Konfigurasi Draft (`localDrafts`)**: Sistem penyusunan draf jam akademik terisolasi, proteksi dialog *UnsavedWarningModal*, dan fitur *"Terapkan ke Jadwal Kelas"*.
- **Kategori Jam Khusus (Override, Pemindaian & Sinkronisasi Realtime)**: Dukungan pengesetan jam Istirahat, Apel, Sholat Dhuha & Halaqoh, Mapel Pilihan/TKA, dan Bonding/Life Skill yang tersinkronisasi secara otomatis dan realtime antar pengguna via kolom `ruangan` (`OVERRIDE_TIPE:...`) pada tabel `jadwal_pelajaran`, dilengkapi fitur **"Pindai Jam Khusus"** dan modal indikator loading progress pemindaian sekuensial (`ScanKhususModal.tsx`).
- **Jadwal Pelajaran, Guru, & Kelas**: Visualisasi jadwal interaktif, kolom **Jam** (penomoran urutan jam 1, 2, 3... berurutan per hari khusus kategori Belajar yang tersinkronisasi 100% pada Opsi Lanjutan Modal Edit dengan format bersih `Jam 1`, `Jam 2`), halaman khusus "Jadwal Kelas" bagi Wali Kelas (`JadwalKelas.tsx`), penggabungan kelas paralel (misal: "1A, 1B"), pop-up edit bentrok jadwal, dan tombol sinkronisasi *"Unggah Jadwal"* massal ke RPP.
- **Kalender Akademik**: Pengaturan event sekolah/pesantren dengan integrasi penanganan libur mingguan (Jumat).

### 5. 📖 Kegiatan Belajar Mengajar (KBM)
- **Wizard Absensi Pelajaran 3-Langkah**: Alur presensi ringkas (**Pilih Jadwal Mengajar** ➔ **Pilih Lesson Plan** ➔ **Isi Absensi**) dilengkapi Card Banner Panduan Alur (*Expandable Information Guide*).
- **Penggabungan Sesi Harian & Jam Berderet**: Pengelompokan jam mengajar berurutan menjadi 1 kali absensi per mapel per hari, serta mutasi atomik 1 jurnal & 1 set absensi per pertemuan.
- **Activity Plan**: Pengajuan & verifikasi draf kegiatan KBM dengan dukungan pembuatan jadwal fleksibel pada seluruh rentang tanggal, termasuk pada hari libur mingguan (Jumat) dan libur kalender akademik.
- **RPP / Lesson Plan**: Penyusunan RPP 16 pertemuan, editor Rich Text MDX / Source Mode toggle, verifikasi WaKa Kurikulum & Kepsek, fitur persetujuan massal *"Setujui Semua (N)"* dengan Pop-Up Dialog Konfirmasi Kustom, RPP gabungan kelas paralel dengan presisi matching `isLPForSubjectAndClass`, UI Paginasi (10–50 per halaman), serta Impor/Ekspor.
- **Jurnal Mengajar**: Catatan rekam jejak KBM harian dengan filter otomatis berbasis lembaga/kelas diampu untuk role tertaut lembaga, serta akses penuh lintas lembaga khusus role Direktur. Dilengkapi filter rentang tanggal dan layout kartu terpotong rapi (*truncate*).
- **Rekap Kehadiran Harian**: Laporan rekapitulasi presensi harian siswa per kelas dengan penyesuaian alur otomatis (Role selain Direktur: pilih kelas terlebih dahulu jika mengampu >1 kelas, atau langsung menampilkan laporan jika hanya 1 kelas).
- **Monitoring KBM & Ekspor Excel**: Pemantauan kesesuaian target RPP dengan realisasi KBM (Universal & Wali Kelas), pencetakan rekapitulasi Excel dengan penanganan format tanggal Indonesia (`formatDateIndo`) yang aman pada kolom *Tanggal Realisasi Absensi* & *Tanggal Rencana RPP*.
- **Wali Murid (Kelola Ananda)**: Pengelolaan relasi siswa per wali murid dengan invalidasi cache real-time setelah siswa ditautkan — siswa yang sudah terhubung tidak lagi tampil di daftar pilih modal Kelola Ananda wali lain.
- **Jam Khusus (Scan Lembaga)**: Fitur Pindai Jam Khusus secara otomatis membatasi pemindaian hanya ke kelas-kelas pada lembaga user; Direktur tetap dapat memindai semua lembaga.

---

## 🛠️ Cara Memulai (Getting Started)

### 1. Prasyarat Sistem
- **Node.js**: Versi `18.x` atau `20.x` (disarankan)
- **NPM**: Versi `9.x` atau lebih baru

### 2. Pengaturan Variabel Lingkungan (`.env`)
Buat file `.env` di root direktori proyek (dapat meniru `.env.example`):

```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_HCAPTCHA_SITE_KEY=your-hcaptcha-site-key
```

### 3. Langkah Instalasi & Menjalankan Aplikasi

1. **Clone & Buka Direktori Proyek**:
   ```bash
   cd mlms_web
   ```

2. **Instal Seluruh Dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan Server Pengembangan (Development Server)**:
   ```bash
   npm run dev
   ```
   Akses aplikasi melalui peramban web pada alamat default: `http://localhost:5173`.

4. **Build untuk Lingkungan Produksi (Production Build)**:
   ```bash
   npm run build
   ```

5. **Pratinjau Hasil Build Produksi**:
   ```bash
   npm run preview
   ```

---

## 📁 Struktur Direktori Proyek

Proyek ini menerapkan arsitektur **Domain-Driven Modular** di bawah direktori `src/` untuk keterbacaan dan skalabilitas kode:

```text
mlms_web/
├── dokumen api/            # Spesifikasi SRS, ERD, SQL Realtime, & Daftar Tugas
├── public/                 # Aset statis & dataset lokal wilayah Indonesia
├── src/
│   ├── assets/             # Gambar, ilustrasi, dan font
│   ├── components/         # Komponen UI modular (UI primitives, Table, Dialog, Canvas)
│   ├── config/             # Registri Realtime CDC & Menu RBAC Sidebar
│   ├── hooks/              # Custom React Hooks (Data Fetching, Realtime Sync, Forms)
│   ├── layouts/            # Kerangka tata letak (MainLayout, AuthLayout)
│   ├── lib/                # Konfigurasi Supabase Client, Axios, & API Services
│   ├── pages/              # Halaman Aplikasi Berbasis Domain (Auth, MasterData, Akademik, KBM, Dashboard)
│   ├── styles/             # Global CSS & Tailwind CSS V4 directives
│   ├── types/              # Deklarasi tipe TypeScript (Database Schema Interfaces)
│   └── utils/              # Helper functions (Sanitizer, Date Formatter, Helpers)
├── .env.example            # Template variabel lingkungan
├── CHANGELOG.md            # Catatan riwayat pembaruan & patch notes terlengkap
├── PATCH_NOTES.md          # Referensi patch notes
└── README.md               # Dokumentasi utama proyek MLMS Web
```

---

## 📋 Catatan Perubahan & Patch Notes

Seluruh riwayat pembaruan sistem, fitur baru, dan perbaikan bug dapat dilihat secara detail pada **[CHANGELOG.md](file:///home/deiro/Program%20Files/VS%20Code/Web/KKN/mlms_web/CHANGELOG.md)**.