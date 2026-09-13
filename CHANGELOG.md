# 📋 MLMS Web — Patch Notes & Riwayat Pembaruan

Dokumen ini mencatat seluruh riwayat pembaruan, perbaikan bug, rilis fitur, dan optimasi performa proyek **Maskumambang Learning Management System (MLMS) Web**.

---

## 📅 Agustus 2026

### 1 Agustus 2026
- **Komponen Banner Panduan Penggunaan Absensi Mata Pelajaran**:
  - Menambahkan banner panduan interaktif alur 3 langkah (*Expandable Information Guide*) pada [src/pages/KBM/Absensi/Index.tsx](file:///home/deiro/Program%20Files/VS%20Code/Web/KKN/mlms_web/src/pages/KBM/Absensi/Index.tsx).
- **Perbaikan Overlap & Z-Index Layering Kolom Sticky Tabel**:
  - Memperbaiki masalah saat kolom "Nama" ditarik/digeser pada tabel Master Data ([SiswaTable.tsx](file:///home/deiro/Program%20Files/VS%20Code/Web/KKN/mlms_web/src/pages/MasterData/Siswa/components/SiswaTable.tsx), [PegawaiTable.tsx](file:///home/deiro/Program%20Files/VS%20Code/Web/KKN/mlms_web/src/pages/MasterData/Pegawai/components/PegawaiTable.tsx), [WaliMuridTable.tsx](file:///home/deiro/Program%20Files/VS%20Code/Web/KKN/mlms_web/src/pages/MasterData/WaliMurid/components/WaliMuridTable.tsx)).
  - Mengimplementasikan kalkulasi `maxNamaWidth` berbasis `containerRef.current.clientWidth` untuk membatasi pergeseran garis kanan kolom Nama agar berhenti sebaris tepat sebelum awal kolom Aksi (`sticky right-0`).
  - Mengubah hierarki *z-index* kolom Aksi dari `z-20` menjadi `z-40` (header) dan dari `z-10` menjadi `z-30` (body) serta menambahkan `max-w-100` pada kolom Nama.
- **Pembaruan Label Stepper Absensi Mata Pelajaran ("Pilih Lesson Plan")**:
  - Mengubah label langkah ke-2 pada indikator *stepper* Wizard Absensi Mata Pelajaran (`src/pages/KBM/Absensi/Index.tsx`) dari **"Pilih Pertemuan"** menjadi **"Pilih Lesson Plan"**.
- **Fitur Persetujuan Massal RPP / Lesson Plan ("Setujui Semua")**:
  - Menempatkan tombol **"Setujui Semua (N)"** beserta banner status info langsung di bawah tab pilihan Status Verifikasi pada [LessonPlanFilters.tsx](file:///home/deiro/Program%20Files/VS%20Code/Web/KKN/mlms_web/src/pages/KBM/LessonPlan/components/list/LessonPlanFilters.tsx) yang otomatis mendeteksi dan menghitung jumlah RPP yang membutuhkan verifikasi Kepala Sekolah / Direktur.
  - Menambahkan dialog Pop-Up Konfirmasi Kustom pada [LessonPlanReviewModals.tsx](file:///home/deiro/Program%20Files/VS%20Code/Web/KKN/mlms_web/src/pages/KBM/LessonPlan/components/list/LessonPlanReviewModals.tsx) untuk memastikan pengguna mengonfirmasi sebelum seluruh RPP disetujui secara bersamaan.
  - Memperbarui `useLessonPlanList.ts` untuk mengeksekusi persetujuan massal via `Promise.all` serta menyinkronkan ulang data via React Query.
- **Hak Akses CRUD Modul Wali Murid untuk Direktur & Wali Murid**:
  - Memperbarui matriks RBAC pada `src/hooks/usePermissions.ts` untuk mengaktifkan izin `crud` (Create, Read, Update, Delete) pada modul Master Data Wali Murid (`'wali-murid'`) bagi role **Direktur** (dari sebelumnya `r` menjadi `crud`) dan menambahkan entry role **Wali Murid** dengan hak akses `crud`.
- **Perbaikan Rendering Teks Copyright Canvas (`ProtectedCopyright.tsx`)**:
  - Mengatasi masalah teks copyright yang bagian atasnya terpotong (*font ascenders & symbol © clipping*) pada Halaman Login dan Halaman Utama.
  - Menambahkan buffer *padding top* (4px) & *padding bottom* (4px), memperhitungkan *lineHeight* secara presisi (`Math.round(fontSize * 1.4)`), dan mengatur offset rendering awal teks di `y = paddingTop` pada HTML5 Canvas 2D API.
- **Penyembunyian Tombol CRUD Pegawai untuk Role Admin Lembaga**:
  - Memperbarui matriks hak akses RBAC pada `src/hooks/usePermissions.ts` untuk role **Admin Lembaga** pada resource `pegawai` dari `ru` (Read & Update) menjadi `r` (Read Only).
  - Menyembunyikan tombol **"Tambah Pegawai"**, **"Template"**, **"Impor"**, **"Edit"**, **"Hapus"**, dan **"Hapus Banyak"** pada modul Master Data Pegawai bagi pengguna dengan role Admin Lembaga.

## 📅 Juli 2026

### 30 Juli 2026
- **Pemisahan Dokumentasi Sistem & Patch Notes (`README.md` & `CHANGELOG.md` / `PATCH_NOTES.md`)**:
  - Memisahkan file `README.md` utama menjadi dua bagian terdedikasi: `README.md` untuk Informasi Sistem Lengkap, Teknologi, Arsitektur, Fitur Utama, Variabel Lingkungan, dan Cara Menjalankan Aplikasi; serta `CHANGELOG.md` / `PATCH_NOTES.md` khusus untuk daftar seluruh riwayat pembaruan dan catatan rilis (*patch notes*).
- **Penyesuaian Baris Teks Copyright Halaman Login**:
  - Memperbesar batas lebar kontainer (*max-width*) pada komponen Canvas copyright di halaman Login (`Login.tsx`) dari `max-w-2xl` menjadi `max-w-4xl`. Penyesuaian ini memastikan baris kedua teks copyright ("Developed by Tim UM Belajar Bersama Masyarakat (UM BBM) Pondok Pesantren Maskumambang") dapat tampil utuh dalam satu barisan tanpa terpotong atau terlempar ke baris berikutnya di monitor/layar standar.
- **Migrasi CAPTCHA ke hCaptcha (Supabase Integration)**:
  - Mengubah integrasi CAPTCHA pada frontend dari Google reCAPTCHA v2 (`react-google-recaptcha`) ke hCaptcha (`@hcaptcha/react-hcaptcha`) agar selaras dengan proteksi CAPTCHA Supabase Auth.
  - Memperbarui file konfigurasi `.env` dan `.env.example` dengan `VITE_HCAPTCHA_SITE_KEY`.
  - Membuat komponen widget baru [HCaptchaWidget.tsx](file:///home/deiro/Program%20Files/VS%20Code/Web/KKN/mlms_web/src/components/ui/HCaptchaWidget.tsx) dan menghapus komponen lama.
  - Memperbarui [authService.ts](file:///home/deiro/Program%20Files/VS%20Code/Web/KKN/mlms_web/src/lib/api/services/authService.ts) untuk mendatangkan `captchaToken` langsung ke fungsi `supabase.auth.signInWithPassword({ email, password, options: { captchaToken } })`.
- **Perbaikan Filter Lembaga pada Halaman Siswa**: Memperbaiki masalah *bug* di mana filter data siswa berdasarkan Lembaga masih menampilkan semua data. Penambahan klausa `!inner` pada *query join* ke tabel relasi `kelas` memastikan PostgREST melakukan *inner join* pada baris data siswa induk, sehingga siswa yang kelas/lembaganya tidak sesuai akan terfilter secara benar dan akurat.
- **Pembaruan UI Tabel Data Induk**: Membuat kolom "Aksi" pada tabel Siswa, Pegawai, dan Wali Murid menjadi tetap *(sticky)* di sebelah kanan agar tidak hilang saat pengguna menggeser (*scroll*) tabel secara horizontal.
- **Penyesuaian Label Modul RPP (Lesson Plan)**: Mengubah label "Satuan Pendidikan" menjadi "Lembaga" pada UI ringkasan detail pertemuan di modul RPP, serta memperbaiki isian form tersebut agar menampilkan nama instansi lembaga aktual dari RPP yang dipilih (berdasarkan data `jadwal_pelajaran`), bukan lagi _hardcoded_ menjadi nama yayasan.
- **Penyesuaian Footer Halaman Utama & Login**: Mengubah posisi teks _Copyright_ di halaman utama (Main Layout) dari tengah layar menjadi rata ke pojok kanan bawah, serta memperbesar ukuran teks _copyright_ pada Halaman Utama dan Halaman Login agar lebih mudah terbaca.
- **Fitur Switch Otomatis Tahun Ajaran**: Menambahkan logika otomatis di mana ketika admin mengaktifkan Tahun Ajaran yang baru, sistem akan langsung menonaktifkan Tahun Ajaran yang sedang aktif sebelumnya untuk mencegah konflik data. Label "Tidak Aktif" pada riwayat kini berfungsi sebagai tombol untuk mengaktifkan Tahun Ajaran dengan satu klik (sehingga *checkbox* aktif pada *form* ditiadakan).
- **Penyesuaian Lebar Konten Halaman**: Menyeragamkan lebar kontainer utama (lebar isi konten) pada seluruh halaman aplikasi (seperti Jadwal Akademik, Jadwal Guru, Mata Pelajaran, Jam Akademik, Rekap Absensi) agar konsisten dengan halaman Master Data Kelas (menggunakan batas maksimum `max-w-7xl mx-auto`), sehingga tampilan antarmuka lebih simetris, rapi, dan tersentralisasi pada monitor *ultrawide*.
- **Fitur Jam Khusus (Override)**: Mengimplementasikan fitur Jam Khusus pada modul Jam Akademik yang memungkinkan admin untuk mengatur kategori khusus (seperti Apel, Istirahat, dll) pada hari dan jam tertentu untuk menimpa Jadwal Umum secara langsung tanpa harus mengubah skema database. Konfigurasi Jam Khusus disimpan dengan aman di penyimpanan lokal peramban (localStorage) dan dikirim ke backend menggunakan teknik *injection* nilai properti `OVERRIDE_TIPE:` pada atribut `ruangan` saat diterapkan ke Jadwal Pelajaran.
- **Penambahan Filter Rentang Tanggal**: Menambahkan fitur filter rentang tanggal (Tanggal Mulai s/d Tanggal Akhir) pada fitur **Monitoring KBM** (di halaman Universal dan Wali Kelas) serta pada modul **Jurnal Mengajar**. Hal ini memungkinkan pengguna mencari dan memfilter progres akademik atau rekaman absen jurnal mengajar secara spesifik pada periode yang ditentukan.
- **Implementasi Gabung Kelas Paralel (Frontend-only)**: Memungkinkan RPP yang sama digunakan oleh beberapa kelas paralel. Fitur ini ditambahkan langsung ke dalam pop-up dialog bentrok jadwal di halaman Jadwal Pelajaran (ketika guru dan mata pelajaran yang dipilih sama persis dengan yang sudah terjadwal). Sistem akan secara otomatis menggabungkan nama kelas ke dalam judul RPP (contoh: "Olahraga – 1A, 1B") sehingga verifikasi dan detail RPP berlaku untuk semua kelas terkait tanpa perlu mengubah struktur tabel database. Absensi dan Jurnal Mengajar tetap berjalan terpisah per kelas.
- **Penggabungan Sesi Absensi Mapel Berderetan**: Menyederlangkan proses absensi untuk mata pelajaran yang dijadwalkan secara berurutan (misal: jam ke 1-3). Sistem kini secara otomatis mendeteksi dan menggabungkan jam pelajaran berderetan menjadi satu sesi (kartu) absensi tunggal di UI wizard, selama tidak diselingi oleh jam istirahat atau mata pelajaran lain. Ketika guru men-submit absensi untuk sesi gabungan ini, sistem di belakang layar (`useFormAbsensi.ts`) akan melakukan *looping mutation* untuk membuat rekaman absensi dan jurnal mengajar pada masing-masing jam (`jadwal_id`) yang tergabung secara paralel. Hal ini memastikan UI yang lebih bersih dan hemat waktu bagi guru tanpa mengganggu struktur basis data ataupun rekapitulasi jam terbang mengajar.
- **Redesain Kartu & Penyederhanaan Wizard Absensi Mapel**: Memperbarui desain visual kartu jadwal pada langkah pertama (*Pilih Jadwal Mengajar*) dengan estetika premium (badge jam & hari, status RPP, indikator "Hari Ini", serta opsi pemilihan Lesson Plan/RPP terverifikasi secara langsung pada kartu). Langkah pemilihan RPP yang sebelumnya terpisah pada langkah ke-2 kini digabungkan langsung ke dalam langkah ke-1, sehingga memangkas alur wizard absensi dari 4 langkah menjadi 3 langkah lebih ringkas (**Pilih Jadwal & RPP** ➔ **Pilih Pertemuan** ➔ **Isi Absensi**).
- **Perbaikan Layout Kartu Jurnal Mengajar**: Memperbaiki tata letak header kartu pada daftar Jurnal Mengajar (`JurnalList.tsx`) dengan menambahkan pembatas fleksibel (`min-w-0 flex-1 truncate` & `overflow-hidden`), sehingga judul mata pelajaran yang panjang akan terpotong rapi dengan tanda titik tiga (`...`) dan tombol **"Hapus"** di pojok kanan atas dijamin tidak akan pernah keluar atau melampaui batas tepi kartu.
- **Penggabungan Kelas Paralel di Jadwal Mengajar Guru**: Memperbarui antarmuka dan logika pengelompokan pada halaman **Jadwal Mengajar Saya** (`useJadwalGuru.ts` & `JadwalGuru.tsx`). Apabila seorang guru mengajar beberapa kelas paralel (misalnya `1A` dan `1B`) pada slot waktu dan mata pelajaran yang sama persis, sistem tidak lagi menampilkan baris ganda yang redundan. Sebaliknya, sistem menggabungkan nama-nama kelas tersebut ke dalam satu baris dengan pemisah koma (contoh: `1A, 1B`), serta menghitung jumlah total sesi per hari secara akurat.
- **Peningkatan Presisi Pencocokan RPP Kelas Paralel**: Menambahkan fungsi pembantu presisi `isLPForSubjectAndClass` di modul Absensi (`useWizardMenu.ts`). Logika ini memastikan bahwa RPP spesifik satu kelas (misal: "Ilmu Pengetahuan Alam - 1A") hanya dicocokkan ke kelas yang sesuai (`1A`), dan tidak akan lagi bocor/terhubung ke kelas paralel lain (`1B`). RPP baru akan terhubung ke kelas `1B` apabila RPP khusus kelas `1B` dibuat, RPP judul umum tanpa pemisah kelas dibuat, atau RPP gabungan kelas paralel (misal: "Ilmu Pengetahuan Alam - 1A, 1B") dibuat oleh guru.
- **Penyesuaian Opsi Tipe Jam Khusus**: Menghapus opsi kategori "Belajar" dari pilihan dropdown modal *Tambah Jam Khusus* di halaman Jam Akademik (`JamKhususFormModal.tsx`), karena jam khusus hanya diperuntukkan bagi kegiatan di luar KBM reguler (seperti Istirahat, Apel, Sholat, Bimbingan, Bonding, dll).
- **Sistem Draft Konfigurasi Jam Akademik**: Merombak alur penyimpanan halaman Jam Akademik sehingga seluruh perubahan (Tambah, Edit, Hapus kategori jam) kini beroperasi secara terisolasi sebagai *draft* di sisi *frontend* (`localDrafts`), tidak lagi langsung menimpa *database*. Hal ini mencegah perubahan spontan pada Jadwal Pelajaran kelas sebelum admin siap. Seluruh perubahan draft baru akan dikomit secara berurutan ke *database* dan disinkronkan ke seluruh jadwal kelas saat tombol **"Terapkan ke Jadwal Kelas"** ditekan.
- **Pencegahan Kehilangan Data (Pop-up Warning Modal & Browser Safeguard)**: Menambahkan modul dialog peringatan kustom (`UnsavedWarningModal.tsx`) dan penangkap event navigasi internal serta `beforeunload` pada halaman Jam Akademik. Apabila pengguna berpindah menu/navigasi di dalam aplikasi atau memuat ulang halaman saat masih ada draf jam yang belum diterapkan, sistem akan menampilkan Pop-up Modal Warning dengan opsi: "Batal (Tetap di Halaman)", "Tinggalkan & Buang", atau "Terapkan Sekarang".
- **Perbaikan Pengelompokan Absensi Mapel Harian (1 Absensi per Mapel per Hari)**: Memperbarui logika pengelompokan jadwal pada wizard Absensi Mata Pelajaran (`useWizardMenu.ts`). Semua slot jam pelajaran untuk mata pelajaran, kelas, guru, dan hari yang sama kini digabungkan menjadi 1 sesi absensi tunggal (1 kali absensi per mata pelajaran per hari), tidak lagi terpecah menjadi 2 atau lebih sesi absensi jika terjeda oleh jam istirahat atau kegiatan lain. Label jam pada kartu otomatis menampilkan format rentang berderet (misal: "Jam 1-3") atau daftar jam jika terjeda (misal: "Jam 1, 2, 4").
- **Perbaikan Penyimpanan Absensi & Jurnal Mengajar (1 Jurnal per Pertemuan)**: Merombak logika `submitMutation` di `useFormAbsensi.ts` agar hanya menyimpan 1 data `jurnal_mengajar` dan 1 set `absensi_pelajaran` per sesi pertemuan (menggunakan `primaryJadwalId` dari jam awal). Sistem tidak lagi melakukan *looping per-jam* yang sebelumnya membuat data jurnal dan absensi menjadi ganda/terduplikasi di database. Jika terdapat jurnal duplikat lama hasil pengiriman per jam sebelumnya, sistem akan secara otomatis membersihkan (*delete*) jurnal duplikat tersebut.
- **Proteksi Teks Copyright (Canvas Rendering)**: Mengubah penyajian teks *copyright* pada Halaman Login (`Login.tsx`) dan Halaman Utama (`MainLayout.tsx`) dari tag HTML (`<p>`) biasa menjadi komponen Canvas terproteksi (`ProtectedCopyright.tsx`). Teks digambar secara dinamis via HTML5 Canvas 2D API dengan *devicePixelRatio scaling* dan *word wrapping* responsif. Dengan metode ini, teks *copyright* tidak lagi dirender sebagai teks HTML biasa di DOM, sehingga tidak muncul sebagai *text node* saat di-inspect dan tidak dapat diedit atau dimanipulasi melalui Chrome DevTools Inspect Element.

### 29 Juli 2026
- **Pembaruan Branding Halaman Login**:
  - Mengubah judul utama menjadi **"Learning Management System (LMS)"**.
  - Memperbarui dan memisahkan subtitle menjadi dua baris: **"Pondok Pesantren Maskumambang"** dan **"Gresik - Jawa Timur"** dengan ukuran font lebih besar dan `font-semibold`.
  - Menghapus baris teks lokasi "Gresik, Jawa Timur · Berdiri Sejak 1859".
  - Menambahkan teks *copyright* di bagian bawah halaman Login dan Halaman Utama (Main Layout).
- **Pembaruan Konfigurasi Jadwal Akademik (Terapkan ke Jadwal Kelas)**:
  - Menambahkan **Sabtu** ke `HARI_LIST` di `useJamAkademik.ts`; jadwal Sabtu kini otomatis dibuat saat terapkan jadwal.
  - Hari **Kamis** dibatasi hanya mendapat slot sampai **jam ke-9** (`urutan_jam ≤ 9`); hari lain (termasuk Ahad) tetap mendapat semua jam.
  - Memperbarui teks catatan di `TerapkanModal` untuk mencerminkan aturan baru.
- **Penggantian Label Kategori "Lainnya" → "Apel"** (UI only; nilai database tetap `"Lainnya"`):
  - Diperbarui di: `useKalender.ts`, `JamFormModal.tsx`, `JamCard.tsx`, `JadwalDayCard.tsx`, `ActivityPlanFilters.tsx`, `ActivityPlanDialog.tsx`.
- **Peningkatan Kinerja dan Keamanan Modul Import Master Data (Siswa & Pegawai)**:
  - Mengubah cara kirim data di layar *Import Preview* dari pengiriman 100% total data sekaligus menjadi metode pengiriman bertahap (*batching*/sekuensial). Menghindarkan server dari kehabisan waktu akses (*Timeout*) saat mengimpor > 1000 baris.
  - Menambahkan *UI Progress Bar* interaktif ketika menekan "Tambahkan" yang melaporkan hitungan sukses dan gagal dalam waktu nyata, alih-alih mengunci layar tanpa pemberitahuan.
  - Memperbaiki potensi lolosnya pemeriksaan ganda (Duplikat identitas seperti NIS/NISN/NIG/NIK) di *Import Preview* dengan menerapkan kueri ber-halaman *paginated query* alih-alih kueri langsung yang memiliki limit mutlak 1000 baris bawaan *Supabase*.
- **Peningkatan UI Pengalaman Pengguna (UX) pada Modul Akademik**:
  - Menambahkan **Progress Bar** pada fitur *Terapkan ke Jadwal Kelas* di Jam Akademik agar pengguna tahu status iterasi ratusan slot jadwal di *background*.
  - Menambahkan **Progress Bar** pada fitur *Unggah Jadwal* di Jadwal Akademik yang melacak persentase pembuatan massal dokumen RPP (Lesson Plan).
- **Implementasi Pagination Menyeluruh pada Modul Lesson Plan (KBM)**:
  - Menambahkan fungsi `getAllLessonPlans` dan `getAllLessonPlanDetails` di `kbmService.ts` dengan pola *while-loop* pagination, identik dengan `getAllJadwalPelajarans`, untuk menghindari terpotong limit 1.000 baris Supabase PostgREST.
  - **`useLessonPlanList.ts`**: Mengganti `getLessonPlanDetails` dengan `getAllLessonPlanDetails` saat fetch semua detail pertemuan (63 RPP × 16 = 1.008 baris sudah melewati batas). Mengganti `getJadwalPelajarans` (fix sebelumnya) dengan `getAllJadwalPelajarans` untuk alokasi waktu.
  - **`useJadwalAkademik.ts`**: Mengganti fetch `lesson_plan` langsung dengan `getAllLessonPlans` agar tidak ada RPP yang tidak terdeteksi saat Unggah Jadwal (yang menyebabkan duplikasi RPP).
  - **`useWizardMenu.ts`**: Mengganti `getLessonPlans` dengan `getAllLessonPlans` di dua tempat: (1) fetch untuk validasi status verifikasi RPP dan (2) fetch RPP untuk dipilih di wizard absensi.
  - **`ApplyTemplateModal.tsx`**: Mengganti `restClient.get('/lesson_plan')` dan `restClient.get('/lesson_plan_detail')` dengan `getAllLessonPlans` dan `getAllLessonPlanDetails` agar terapkan template tidak gagal saat RPP banyak.
  - **UI Pagination Lesson Plan**: Menambahkan kontrol paginasi pada halaman daftar Lesson Plan. Tampilan dibatasi default **10 RPP per halaman** dengan pilihan 10, 20, 30, 40, atau 50 per halaman. Navigasi halaman menggunakan tombol Prev/Next dan nomor halaman dengan elipsis otomatis. Filter dan pencarian otomatis mereset ke halaman 1.
- **Analisis Skalabilitas dan Keamanan Pengambilan Data (Pagination)**:
  - Melakukan analisis total pada seluruh modul (Dashboard, Master Data, KBM, dan Akademik) terkait potensi kelambatan atau *crash* jika terjadi pemuatan data dalam jumlah besar.
  - Membuat dokumen Laporan Analisis Skalabilitas dan Keamanan Pengambilan Data dengan mencatat celah pada *DashboardModel1*, *useSiswaData*, *useKelasData*, *useJamAkademik*, *useJadwalAkademik*, dan *useActivityPlan*.
- **Optimasi Skalabilitas Frontend (Pagination & Lazy Loading)**:
  - **Dashboard**: Mengubah pengambilan total data statistik dari 100% data menjadi query limit 1 dengan parameter header `Prefer: count=exact`.
  - **Siswa & Kelas**: Memperbaiki pemuatan modal assign siswa yang sebelumnya mengunduh ribuan murid dengan menambahkan pagination/search secara *debounced* via frontend query. Menghapus pengambilan seluruh siswa untuk filter `activeKelasIds`.
  - **Jadwal & Jam Akademik**: Menghentikan perulangan `while (true)` global di hooks akademik dan memfilter fetch data agar hanya mengunduh jadwal dan jam spesifik berdasarkan `kelas_id` dari lembaga yang sedang aktif.
  - **Activity Plan**: Menambahkan implementasi UI pagination pada halaman rencana kegiatan untuk memperingan *load time*.

### 28 Juli 2026
- **Implementasi reCAPTCHA v2 (Anti-Bot & Keamanan Login)**:
  - Mengintegrasikan Google reCAPTCHA v2 "I'm not a robot" pada halaman login. Pengguna kini wajib menyelesaikan tantangan CAPTCHA sebelum tombol login aktif. Token CAPTCHA otomatis di-reset setiap kali percobaan login gagal untuk mencegah bot melakukan percobaan ulang.
  - File baru: `src/components/ui/RecaptchaWidget.tsx`. File dimodifikasi: `src/pages/Auth/Login.tsx`, `.env`.
- **Implementasi Fitur Session Timeout (Keamanan & Inaktivitas)**:
  - **Auto-Logout Berbasis Role**: Menambahkan fitur keamanan *session timeout* yang bekerja memantau aktivitas kursor (*mousemove*), *scroll*, ketikan (*keydown*), dan sentuhan (*touchstart*). Durasi waktu diam sebelum dikeluarkan otomatis disesuaikan secara proporsional dengan profil risiko masing-masing peran (misal: Super Admin: 20 menit, Guru/Wali Kelas: 35 menit).
  - **Peringatan Hitung Mundur (Countdown)**: Mengimplementasikan modal dialog pencegahan *timeout* dengan hitung mundur jam digital (MM:SS) yang muncul di menit-menit terakhir sebelum sesi berakhir. Pengguna bisa memilih untuk menekan **"Perpanjang Sesi"** atau log keluar segera. Selama modal ini muncul, aktivitas latar belakang (seperti goyangan mouse tidak sengaja) diabaikan dan tidak akan me-reset *timer*.
  - **Keamanan Penutupan Tab (Grace Period)**: Menambahkan lapisan deteksi (*visibilitychange* & *pagehide*) yang mencatat setiap kali tab ditutup atau latar belakang browser dibersihkan. Apabila pengguna kembali mengakses sistem melalui tab baru dan melewati batas waktu penutupan (grace period), sesi akan langsung dihapus saat aplikasi (*React tree*) selesai dimuat.
  - Pengecualian batas waktu diatur spesifik pada halaman Face Recognition (Absensi Wajah) untuk mencegah interupsi timer selama guru menyorot kelas. Wali Murid dikecualikan dari cakupan ini.

### 28 Juli 2026
- **Penambahan Tampilan Tombol Impor di Lesson Plan**: Menambahkan tombol "Impor" di sebelah kiri tombol "Ekspor" pada halaman daftar Lesson Plan. Tombol ini memiliki kondisi visibilitas khusus: hanya akan ditampilkan kepada guru pengampu RPP tersebut atau pengguna dengan role "WaKa Kurikulum", dan akan otomatis disembunyikan jika status RPP sudah terverifikasi ("Disetujui").
- **Perbaikan Modal Edit Jadwal Pelajaran**:
  - Menambahkan opsi **"✕ Kosongkan Mata Pelajaran"** pada dropdown, sehingga admin dapat mengosongkan slot jadwal berkategori Belajar menjadi `null`.
  - Menambahkan **dialog peringatan Sonar-style** saat guru yang dipilih sudah terjadwal di kelas lain pada jam yang sama. Dialog menampilkan detail lembaga dan kelas yang bentrok, serta memberikan pilihan **"Pindahkan Guru"** yang mengosongkan jadwal lama dan mengisi jadwal baru secara atomik.

### 26 Juli 2026 (Sesi 44)
- **Penyempurnaan Tombol Simpan pada Form Master Data (Wali Murid, Pegawai, Siswa)**:
  - **Validasi Form Dinamis**: Menambahkan validasi form pada modal Tambah/Edit Master Data, dimana tombol "Simpan" hanya akan berstatus aktif jika seluruh kolom yang wajib diisi (yang memiliki tanda bintang `*`) dan field *primary key* (seperti NIK atau NIS) telah terisi secara lengkap.
  - **Perubahan Styling Disabled State & Notifikasi**: Tombol simpan kini akan tampil dengan warna abu-abu (`bg-gray-400`) saat mode *disabled*. Apabila pengguna menekan tombol saat masih berwarna abu-abu, akan muncul notifikasi *toast* ("Data yang terisi masih belum lengkap"). Ketika seluruh prasyarat input terpenuhi, warna tombol akan secara otomatis beralih menjadi biru (`bg-blue-600`), memberikan *visual feedback* yang jelas kepada pengguna.
  - **Info Banner Interaktif (Wali Murid)**: Khusus pada form Tambah Wali Murid, terdapat kartu informasi di bagian atas modal yang menjelaskan aturan pengisian *primary key* ("Setidaknya harus ada satu pengisian Nama dan NIK...").
- **Penyesuaian Teks Loading Transisi Halaman**: Mengubah teks pada indikator pemuatan utama (*Suspense Page Loader*) dari "Memuat halaman..." disesuaikan menjadi **"Memuat data ..."**.
- **Standardisasi Desain Tombol Hapus Banyak**: Menyelaraskan *styling* (font, warna, efek *hover*, bayangan, dan padding) untuk tombol "Hapus Banyak" pada *Header* tabel modul Siswa, Pegawai, dan Wali Murid agar 100% konsisten secara antarmuka.
- **Notifikasi Konfirmasi Kustom Hapus Banyak (Bulk Delete)**: Menambahkan pop-up konfirmasi spesifik berdasarkan entitas yang dihapus. Pada Pegawai, memperingatkan potensi *logout* otomatis jika akun sendiri terpilih. Pada Wali Murid, menegaskan bahwa akun akan terhapus. Pada Siswa, mempertegas pilihan iya/tidak.
- **Perbaikan Bug Hapus Data Wali Murid**: Memperbaiki *error database* berupa `invalid input syntax for type integer: "undefined"` saat menghapus baris data. Penyebabnya adalah ketidaksesuaian pemetaan data respons *hook* dengan kolom referensi tabel asli. Data *fetch* sekarang disalurkan dalam bentuk asli agar API hapus dapat membaca properti `wali_id` dengan tepat.

### 25 Juli 2026 (Sesi 43)
- **Fitur Bulk Delete & Bulk Select pada Modul Master Data (Siswa, Pegawai, Wali Murid)**:
  - **Tombol Hapus Banyak & Pilih Semua**: Menambahkan tombol "Hapus Banyak" di samping tombol tambah pada halaman Siswa (`Siswa/Index.tsx`), Pegawai (`Pegawai/Index.tsx`), dan Wali Murid (`WaliMurid/Index.tsx`). Mengintegrasikan komponen `<BulkActionBar />` dengan fitur "Pilih Semua", "Pilih Semua di Halaman Ini" (via checkbox di thead tabel desktop dan mobile), serta pembatalan pilihan.
  - **Pilih Langsung Semua Berdasarkan Lembaga & Kelas**: Khusus untuk halaman **Siswa** dan **Pegawai**, menambahkan fitur pemilihan massal instan berdasarkan Lembaga (`onSelectByLembaga`) maupun Kelas (`onSelectByKelas` untuk Siswa), memudahkan admin dalam memilih dan mengelola kelompok data spesifik.
  - **Relational Cleanup Otomatis saat Bulk Delete**: Mengimplementasikan pembersihan relasi secara menyeluruh sebelum data dihapus secara massal (batch 50 data/batch):
    - Pada **Siswa** (`useSiswaData.ts`): Menghapus relasi tagihan, pembayaran, absensi, serta assignment siswa di kelas terlebih dahulu.
    - Pada **Pegawai** (`usePegawaiData.ts`): Menghapus akun login (`user_auth`), role sistem (`user_role`), dan penugasan lembaga (`pegawai_lembaga`).
    - Pada **Wali Murid** (`useWaliMuridData.ts`): Menghapus akun login wali murid (`user_auth`), role sistem (`user_role`), serta melepaskan tautan anak/siswa (`wali_murid_id = null`) sebelum data wali dihapus.
  - **Tampilan Checkbox Responsif**: Memperbarui antarmuka tabel pada desktop maupun kartu pada mobile view di ketiga modul agar menampilkan checkbox interaktif ketika mode "Hapus Banyak" diaktifkan.
  - **Penyelarasan Tema Warna BulkActionBar dengan MainLayout (`BulkActionBar.tsx`)**: Memperbarui skema warna banner tindakan massal agar 100% senada dengan identitas visual *main layout* (warna latar Royal Navy `#1e2f65`, aksen kuning emas `#FACC15`, tombol Navy `#2A4080`, serta hiasan latar motif geometri Islami dari `<StaticIslamicPattern />`).
  - **Penyempurnaan Ergonomi & Interaktivitas Checklist pada BulkActionBar**:
    - Menghapus elemen kotak ikon tempat sampah dari sisi kiri banner serta menghapus badge teks "AKTIF" kuning agar tampilan lebih ringkas, bersih, dan profesional.
    - Menyederhanakan judul ("Mode Hapus Banyak") dan deskripsi menjadi kalimat informatif yang ringkas dan jelas ("Terpilih X dari total Y data").
    - **Fitur Undo pada Pilih Semua & Tampilan Kuning Aksen**: Mengubah fungsi tombol "Pilih Semua" (di modul Siswa, Pegawai, dan Wali Murid) agar secara otomatis mendeteksi jika seluruh data telah terpilih; jika diklik untuk kedua kalinya, tombol akan membatalkan/mengosongkan seluruh pilihan ("Batal Pilih Semua"). Tampilan tombol saat aktif diselaraskan menggunakan warna kuning emas khas tema (`#FACC15`) dengan teks biru navy pekat (`#1e2f65`) agar kontras, indah, dan menyatu dengan tema layout.
    - **Sistem Checklist Multi-Select, Stabilitas Dropdown, Tombol Progresif, Perbaikan Key, Overflow & Penyaringan Data Aktif by Lembaga / Kelas**: Memperbarui menu *dropdown* "Pilih by Lembaga" dan "Pilih by Kelas" menjadi sistem checklist (kotak centang interaktif). Menerapkan penahanan propagasi klik (`onMouseDown` & `onClick` stopPropagation) pada pembungkus kontainer dropdown agar menu tidak tertutup otomatis saat pengguna mencentang atau membatalkan pilihan lembaga/kelas. Selain itu, tampilan tombol dropdown kini bersifat progresif interaktif (*linear-gradient progress bar*): jika dipilih sebagian (misal 1 dari 2 lembaga), latar belakang tombol akan terisi kuning emas 50% di kiri dan biru di kanan serta badge menampilkan angka progres (`1/2`); jika dipilih semua (100%), seluruh tombol otomatis berganti latar menjadi kuning emas penuh (`#FACC15`) dengan teks biru navy pekat. Memperbaiki pemetaan properti `id` (`lembaga_id` dan `kelas_id` dengan fallback index) pada `Siswa/Index.tsx`, `Pegawai/Index.tsx`, dan `BulkActionBar.tsx` sehingga menghilangkan peringatan React `Each child in a list should have a unique "key" prop`. Menghapus kelas `overflow-hidden` dari kontainer utama banner dan menaikkan `z-index` ke `z-40` agar modal/dropdown menu yang terbuka ke bawah tidak terpotong (tertutup) oleh batas bawah banner. Menghapus teks `(multi checklist)` pada header dropdown agar lebih rapi. Menerapkan penyaringan otomatis pada `useSiswaData.ts` dan `usePegawaiData.ts` sehingga menu filter tabel dan dropdown "Pilih by Lembaga/Kelas" pada `BulkActionBar` hanya menampilkan lembaga dan kelas yang secara nyata memiliki data pengguna (siswa/pegawai), serta menambahkan tampilan pesan "Tidak ada data" jika daftar kosong.
    - **Perbaikan Error Query Kolom Siswa pada Modul Wali Murid (`useWaliMuridData.ts`)**: Memperbaiki error database PostgREST `42703 (column siswa_1.nama_lengkap does not exist)` saat memuat daftar wali murid maupun saat menautkan siswa. Mengganti seluruh referensi nama kolom dari `nama_lengkap` menjadi `nama` sesuai skema tabel `siswa` pada sistem.
    - **Penyempurnaan Legibilitas & Kontras Teks pada Tombol Progresif via Teknik "Glass Pill" (`BulkActionBar.tsx`)**: Menghapus efek `-webkit-text-stroke` dan outline bergerigi pada teks tulisan ("Pilih by Lembaga" dan "Pilih by Kelas") saat mode progresif aktif, lalu menggantinya dengan teknik **Glass Pill (Backdrop Capsule)**. Teks dan ikon kini dibungkus dalam kontainer kapsul berlatar belakang dark navy transparan (`bg-[#1e2f65]/90 backdrop-blur-xs`) dengan tepi yang halus. Teknik ini memisahkan teks seutuhnya dari latar belakang progres bar yang berwarna cerah (kuning emas `#FACC15` dan biru navy), menghasilkan tampilan yang sangat bersih, modern, kontras tinggi, dan elegan tanpa merusak bentuk huruf.

### 25 Juli 2026 (Sesi 42)
- **Perbaikan Urutan Sinkronisasi Peran & Relasi Lembaga pada Master Data Lembaga (`src/pages/MasterData/Lembaga`)**:
  - **Penyelesaian Error P0001 ("Kepala Sekolah harus pegawai di lembaga ini") (`useLembagaData.ts`)**: Memperbaiki fungsi `syncRolesAndLembaga` agar penambahan pegawai ke tabel `pegawai_lembaga` selalu dieksekusi tanpa dipanggil `return` awal ketika pegawai belum memiliki `user_id`. Hal ini menjamin bahwa setiap pegawai yang ditunjuk sebagai Kepala Sekolah atau Waka Kurikulum resmi terdaftar sebagai pegawai di lembaga yang bersangkutan sebelum validasi trigger database dijalankan.
  - **Strategi 2-Step Creation pada Tambah Lembaga Baru (`createMutation`)**: Untuk menghindari kontradiksi trigger database saat lembaga belum eksis (dimana `pegawai_lembaga` membutuhkan `lembaga_id` yang valid), pembuatan lembaga baru kini dilakukan melalui 2 tahap: pertama membuat lembaga tanpa mengisikan `kepala_sekolah_id` & `kurikulum_id`, kemudian mendaftarkan pegawai ke `pegawai_lembaga` dan rolenya ke `user_role` menggunakan `lembaga_id` baru tersebut, lalu memperbarui (`updateLembaga`) record lembaga dengan ID kepsek dan waka kurikulum.
  - **Sinkronisasi Pre-Update (Edit Lembaga)**: Pada saat pembaruan lembaga (`updateMutation`), sistem terlebih dahulu memastikan pegawai yang dipilih sebagai Kepala Sekolah dan Waka Kurikulum didaftarkan ke tabel `pegawai_lembaga` dan diberikan role di tabel `user_role` untuk lembaga yang bersangkutan sebelum mengeksekusi `updateLembaga`.
  - **Pencegahan Error 23505 Duplicate Key (`pegawai_lembaga_pkey` & `tahun_ajaran_pkey`)**: Menambahkan header `Prefer: resolution=ignore-duplicates` pada request POST ke tabel `pegawai_lembaga`, `user_role`, dan sinkronisasi `tahun_ajaran` di `useLembagaData.ts`. Hal ini memerintahkan PostgreSQL untuk melakukan *ON CONFLICT DO NOTHING* sehingga tidak memicu error 23505 jika data/relasi sudah terdaftar sebelumnya.
  - **Pembersihan Role & Relasi Otomatis pada Penghapusan Lembaga & Pegawai (`deleteMutation`)**: Menambahkan pembersihan otomatis pada `useLembagaData.ts` dan `usePegawaiData.ts`. Sebelum suatu lembaga atau pegawai dihapus, sistem akan menghapus rekam jejak relasi pada tabel `user_role`, `pegawai_lembaga`, serta `tahun_ajaran` (untuk lembaga) terlebih dahulu untuk menghindari kegagalan penghapusan akibat *foreign key constraint*.

### 25 Juli 2026 (Sesi 41)
- **Optimasi Animasi Form Login (`src/pages/Auth`)**:
  - **Caching Rendering Geometri Islami**: Memperbaiki masalah lag (jeda pengetikan) pada form login dengan menerapkan *offscreen canvas caching* (`document.createElement('canvas')`) untuk merender motif *Khatam / Rub el Hizb* secara statis di memori. Penggunaan `ctx.drawImage` menggantikan ratusan *path calculations* (`ctx.stroke`, `ctx.fill`) dan kalkulasi bayangan berbayar mahal (`shadowBlur`) setiap *frame*.
  - **Pencegahan Re-rendering Kanvas**: Membungkus komponen `<IslamicPatternBackground />` dengan `React.memo` demi menghindari siklus pembaruan Virtual DOM (re-render) pada setiap *keystroke* di isian form NIG maupun password, membebaskan antrean render React *main-thread*.
  - **Pemangkasan Rendering Ekstra**: Menghapus efek 3D paralaks kursor (menghemat 100% interupsi Main Thread) serta meniadakan efek grafis berat *Spotlights* dan *Grid Lines* (meringankan fill-rate GPU) demi responsivitas form yang mutlak.
- **Perbaikan Modal Wali Murid (`src/pages/MasterData`)**:
  - **Perbaikan Overflow Layout**: Menambahkan batas tinggi layar (`max-h-[90vh]`) dan izin scroll (`overflow-y-auto`) pada modal `WaliMuridDetailModal.tsx` agar blok tambahan "Reset Password Akun" (khusus role Super Admin) tidak melampaui / menembus batas bawah layar pada *smartphone*.

### 25 Juli 2026 (Sesi 40)
- **Optimasi Performa Desktop dan Mobile Modul Master Data (`src/pages/MasterData`)**:
  - **Debouncing Pencarian**: Menambahkan teknik *debouncing* (jeda 400ms) pada input pencarian di halaman **Kelas** (`Kelas/Index.tsx`) dan **Lembaga** (`Lembaga/Index.tsx`) untuk mencegah *re-rendering* berlebihan.
  - **Memoization dengan `useMemo`**: Membungkus logika *filtering* dan *pagination* data menggunakan `useMemo` pada halaman **Kelas** dan **Lembaga** untuk memangkas iterasi pencarian ulang.
  - **Responsivitas Padding Kontainer**: Mengurangi ukuran *padding* utama (`p-6` menjadi `p-4 md:p-6`) pada tata letak (`layout`) halaman **Kelas**, **Lembaga**, **Siswa**, dan **Pegawai** untuk memaksimalkan visibilitas data di layar *smartphone*.
- **Optimasi Performa Desktop dan Mobile Modul Akademik (`src/pages/Akademik`)**:
  - **Memoization dengan `useMemo`**: Membungkus logika *filtering* dan *pagination* data pada hooks halaman **Jam Akademik** (`useJamAkademik.ts`) menggunakan `useMemo` (`filteredData`, `totalPages`, `paginatedData`) untuk mencegah re-kalkulasi berlebih.
  - **Responsivitas Padding Kontainer**: Menerapkan perubahan responsivitas padding yang serupa (`p-6` menjadi `p-4 md:p-6`) pada tata letak halaman **Mata Pelajaran**, **Jadwal Pelajaran**, **Jadwal Guru**, **Jam Akademik**, dan **Kalender Akademik** demi pengalaman UI *mobile* yang konsisten.
- **Optimasi Performa Desktop dan Mobile Modul KBM (`src/pages/KBM`)**:
  - **Debouncing Pencarian**: Menambahkan teknik *debouncing* dengan delay 400ms (`debouncedSearchTerm` dan `debouncedSearchQuery`) pada _hooks_ **Monitoring** (`useUniversalMonitoring.ts`, `useWaliKelasMonitoring.ts`) dan **Lesson Plan** (`useLessonPlanList.ts`). Hal ini menghambat eksekusi filter yang berat pada saat _typing_ cepat, meringankan beban kalkulasi UI _thread_.
  - **Responsivitas Padding Kontainer**: Mengurangi ukuran _padding_ secara ekstensif dari `p-6` menjadi `p-4 md:p-6` untuk selusin halaman _root container_ di modul KBM (Mencakup Absensi, Rekap Siswa, Absensi Harian, Activity Plan, Jurnal Mengajar, Lesson Plan, Form, dan Monitoring), memberikan *breathing room* yang tepat namun tetap padat informasi untuk perangkat *mobile*.
- **Optimasi Performa Desktop dan Mobile Modul Auth (`src/pages/Auth`)**:
  - **Validasi Kinerja Latar Belakang (`IslamicPatternBackground.tsx`)**: Modul Auth diverifikasi telah secara aktif mendeteksi spesifikasi _hardware_ pengguna (menggunakan `navigator.hardwareConcurrency` dan pembatasan resolusi via `devicePixelRatio`) serta status visibilitas tab halaman, membekukan iterasi canvas pada 30 FPS untuk mencegah kebocoran _memory_ dan konsumsi baterai perangkat pintar.
  - **Responsivitas Padding Kontainer**: Mengubah bantalan komponen `ErrorPage.tsx` dari yang awalnya `px-6` menjadi responsif `px-4 md:px-6` untuk menjaga tombol aksi dan teks error agar tidak saling berhimpit pada layar ponsel *ultra-narrow*.
- **Perbaikan UI Typography**:
  - **Tabel Master Data**: Menghapus kelas `font-mono` pada data NIS, NISN, NIK, No. HP, NIG, NIP di tabel desktop dan *mobile list* untuk halaman **Siswa**, **Pegawai**, dan **Wali Murid** agar jenis huruf harmonis dengan font *sans-serif* utama (`Geist`).

### 24 Juli 2026 (Sesi 39)
- **Penyempurnaan Layout Filter & Search Bar (`src/pages/MasterData`)**:
  - **Filter Dropdown di Pojok Kanan**: Penempatan dropdown filter (`Status`, `Lembaga`, `Role`) terkunci di pojok kanan atas (`md:ml-auto justify-end`), menghilangkan sisa area kosong.
  - **Pencarian Full Width 100%**: Ketika hanya pencarian yang tampil (`WaliMuridFilter.tsx`, `LembagaHeader.tsx`), input pencarian otomatis melebar 100% (`w-full flex-1`).
  - **Verifikasi Build**: Lolos pengujian tipe TypeScript (`npx tsc --noEmit`) dan build produksi Vite (`npm run build`) dengan 0 error.

### 24 Juli 2026 (Sesi 38)
- **Penyempurnaan Header & Footer Kartu Master Data (`src/pages/MasterData`)**:
  - **Kartu Kelas (`KelasCardList.tsx`)**: Penataan ulang badge lembaga bertumpuk di atas nama kelas untuk memberikan 100% lebar penuh pada nama kelas (bebas terpotong `Kel...`), serta penguncian tombol footer dalam 3-column grid system (`grid grid-cols-3 gap-1.5`) bebas meluap.
  - **Kartu Lembaga (`LembagaCardList.tsx`)**: Penguncian tombol footer dalam 2-column grid system (`grid grid-cols-2 gap-2`).
  - **Verifikasi Build**: Lolos pengujian tipe TypeScript (`npx tsc --noEmit`) dan build produksi Vite (`npm run build`) dengan 0 error.

### 24 Juli 2026 (Sesi 37)
- **Refactoring Layout Kartu Master Data (`src/pages/MasterData`)**:
  - **Kartu Kelas (`KelasCardList.tsx`)**: Mengeliminasi tabrakan tombol aksi di header dengan memindahkan tombol ("Siswa", "Edit", "Hapus") ke **Card Footer**. Header kini memberikan 100% ruang untuk nama kelas dan badge lembaga.
  - **Kartu Lembaga (`LembagaCardList.tsx`)**: Merestrukturisasi kartu lembaga dengan tombol aksi bersih di **Card Footer**.
  - **Verifikasi Build**: Lolos pengujian tipe TypeScript (`npx tsc --noEmit`) dan build produksi Vite (`npm run build`) dengan 0 error.

### 24 Juli 2026 (Sesi 36)
- **Animasi Pola Geometris Islami Login Screen (`src/pages/Auth`)**:
  - **Komponen Canvas Geometric (`IslamicPatternBackground.tsx`)**: Menghadirkan animasi canvas latar belakang bermotif bintang 8 (Khatam / Rub el Hizb) dan mozaik arabesque.
  - **Optimasi Performa Web Canvas**: Animasi dibekali deteksi *prefers-reduced-motion* dan pembatasan `devicePixelRatio` khusus device *low-end*. 
  - **Glassmorphism Desain pada Login.tsx**: Kartu login menggunakan efek blur, shadow-glow yang responsif dengan efek transisi `hover` futuristik elegan.
- **Perbaikan UI Masterdata**:
  - Mengubah letak filter di Masterdata agar rata-kanan (di pojok kanan), menyesuaikan max-width kotak pencarian agar tidak terlalu panjang saat filter aktif.
  - Mengubah text penanda data tidak ditemukan dari "Data masih kosong" menjadi "Data Tidak Ada".
  - Refactoring letak header dan tombol Card pada `KelasCardList` dan `LembagaCardList` agar rapi dan tidak bertumpuk di desktop.
  - **Verifikasi Build**: Lolos pengujian tipe TypeScript (`npx tsc --noEmit`) dan build produksi Vite (`npm run build`) dengan 0 error.

### 24 Juli 2026 (Sesi 35)
- **Optimasi Responsivitas & UI Mobile Modul KBM (`src/pages/KBM`)**:
  - **Jurnal Mengajar (`JurnalList.tsx`)**: Pembaruan kartu jurnal dengan tombol hapus touch-friendly yang stabil di smartphone.
  - **Activity Plan (`ActivityPlanList.tsx`)**: Penyesuaian layout kartu dan tombol verifikasi (Setujui, Revisi, Edit, Hapus) agar responsif pada layar mobile.
  - **Lesson Plan / RPP (`LessonPlanList.tsx`)**: Penataan ulang tombol aksi verifikasi RPP dan ekspor dalam flex wrap container.
  - **Monitoring KBM (`UniversalResultView.tsx` & `WaliKelasResultView.tsx`)**: Integrasi **Mobile Card View** untuk menyajikan data monitoring KBM realisasi vs RPP secara bersih tanpa perlu scroll horizontal tabel.
  - **Verifikasi Build**: Lolos pengujian tipe TypeScript (`npx tsc --noEmit`) dan build produksi Vite (`npm run build`) dengan 0 error.

### 24 Juli 2026 (Sesi 34)
- **Optimasi Responsivitas & UI Mobile Modul Akademik (`src/pages/Akademik`)**:
  - **Mata Pelajaran (`Index.tsx`)**: Integrasi `renderMobileCard` pada `<DataTable>` untuk menampilkan kartu mobile mata pelajaran lengkap dengan badge lembaga, daftar kelas terhubung, serta tombol Edit dan Hapus.
  - **Jam Akademik (`JamCard.tsx` & `JamHeader.tsx`)**: Penyesuaian tombol aksi dan flex container header agar responsif dan touch-friendly di smartphone.
  - **Kalender Akademik (`KalenderSidebar.tsx`)**: Penataan tombol hapus event pada sidebar event mendatang.
  - **Jadwal Pelajaran (`JadwalDayCard.tsx`)**: Penambahan tampilan kartu sesi mobile (*Mobile Card View*) untuk menyajikan jadwal jam mengajar, mapel, guru, ruangan, dan tombol edit tanpa perlu scroll horizontal tabel.
  - **Standardisasi Simbol Pemisah Metadata**: Mengganti seluruh simbol bullet dot `•` menjadi garis tegak `|` pada seluruh penanda metadata baris UI.
  - **Verifikasi Build**: Lolos pengujian tipe TypeScript (`npx tsc --noEmit`) dan build produksi Vite (`npm run build`) dengan 0 error.

### 24 Juli 2026 (Sesi 33)
- **Optimasi Responsivitas & UI Mobile Modul Master Data (`src/pages/MasterData`)**:
  - **Penyelarasan Kartu Mobile Siswa (`SiswaTable.tsx`)**: Mengubah tampilan mobile dari sederhana menjadi kartu terstruktur lengkap dengan avatar, NIS/NISN, badge Status (Aktif/Alumni/Non-Aktif), Lembaga, Kelas, serta tombol aksi **Lihat** & **Hapus**.
  - **Kartu Ringkas Pegawai (`PegawaiTable.tsx`)**: Meredesign kartu mobile pegawai agar menyajikan data ringkas yang esensial (Nama, NIG/NIP, Status, Lembaga, Jabatan) tanpa menumpuk 12+ kolom di layar handphone, serta mengganti posisi tombol `absolute` yang rawan overlap dengan layout flex header & footer yang bersih.
  - **Flex Layout Wali Murid (`WaliMuridTable.tsx`)**: Mengeliminasi absolute positioning `top-4 right-4` pada tombol aksi mobile card dan menggantinya dengan flex layout responsif.
  - **Restrukturisasi Kartu Kelas & Lembaga (`KelasCardList.tsx` & `LembagaCardList.tsx`)**: Mengganti tombol aksi `absolute` menjadi flex header responsif sehingga nama kelas dan lembaga tidak tertutupi tombol pada layar smartphone.
  - **Kartu Hero & History Tahun Ajaran (`TahunAjaranHistoryList.tsx` & `TahunAjaranActiveHero.tsx`)**: Mengatur layout kartu hero dan riwayat tahun ajaran agar serasi dan touch-friendly pada mobile device.
  - **Verifikasi Build**: Seluruh fitur lolos pengujian kompilasi TypeScript (`npx tsc --noEmit`) dan build produksi Vite (`npm run build`) dengan 0 error.

### 24 Juli 2026 (Sesi 32)
- **Modul Master Data (`src/pages/MasterData`)**:
  - **Fetch Data API & Optimasi Query**: Memeriksa seluruh custom hook (`useKelasData`, `useLembagaData`, `usePegawaiData`, `useSiswaData`, `useTahunAjaranData`, `useWaliMuridData`), parameter `select`, `limit`, `offset`, filter role (`Super Admin`, `Direktur`, `Admin Lembaga`, `Wali Kelas`), serta integrasi realtime sync (`useRealtimeSync`).
  - **Validasi Operasi CRUD**: Verifikasi penambahan, pembaruan, dan penghapusan data pada 6 entitas Master Data (Kelas, Lembaga, Pegawai, Siswa, Tahun Ajaran, Wali Murid) beserta modal konfirmasi dampak foreign key constraint.
  - **Pencegahan Nilai `NaN` pada Form Modal**: Mengubah parsing `parseInt` pada dropdown selector Wali Murid & Kelas (`SiswaFormModal.tsx`) dan Wali Kelas (`KelasFormModal.tsx`) agar mengembalikan `null` alih-alih `NaN` saat opsi default ("Pilih...") dipilih, mencegah kesalahan tipe payload ke backend.
- **Modul KBM / Kegiatan Belajar Mengajar (`src/pages/KBM`)**:
  - **Pemeriksaan 7 Sub-Modul KBM**: Melakukan verifikasi fungsi pada `Absensi` (Mapel), `AbsensiHarian`, `ActivityPlan`, `FaceRecognition`, `JurnalMengajar`, `LessonPlan` (RPP), dan `Monitoring`.
  - **Activity Plan & RPP Rules**: Verifikasi aturan rentang tanggal, pembatasan otomatis pada hari **Jumat** (Libur Mingguan), pendeteksian bentrokan dengan Kalender Akademik, kalkulasi alokasi waktu dinamis, dan pembentukan 16 pertemuan otomatis RPP saat unggah jadwal.
  - **Monitoring KBM**: Komputasi status KBM ("Sesuai", "Terlambat", "Terlalu Cepat") berdasarkan perbandingan tanggal rencana RPP dan tanggal presensi riil.
- **Modul Akademik (`src/pages/Akademik`)**:
  - **Pemeriksaan 4 Sub-Modul Akademik**: Melakukan pengujian menyeluruh pada sub-modul **Jadwal Pelajaran** (Jadwal Akademik & Jadwal Guru), **Kalender Akademik**, **Mata Pelajaran** (relasi per kelas via `kelas_mapel`), dan **Jam Akademik**.
  - **Fitur Integrasi Jam & Jadwal**: Verifikasi kalkulasi "Terapkan ke Jadwal Kelas" untuk mendeteksi ketidaksesuaian slot jam, serta sinkronisasi "Unggah Jadwal" ke Lesson Plan dengan pembuatan 16 pertemuan otomatis.
  - **Jam Akademik & Kalender Rules**: Verifikasi aturan proteksi hapus hanya untuk urutan jam terakhir (`maxUrutan`) dan auto-handling libur Jumat pada kalender.
- **Modul Dashboard (`src/pages/Dashboard`)**:
  - **Perutean Model Berbasis Role**: Verifikasi pengalihan tampilan otomatis `DashboardModel1` (pimpinan & admin) dan `DashboardModel2` (guru & wali kelas) sesuai hak akses SRS.
  - **Agregasi Metrik & Navigasi**: Verifikasi pengambilan statistik sistem (jumlah guru, siswa, lembaga, kelas, jam mengajar, progress RPP) dan pengintegrasian *Quick Menu* dinamis (`useDynamicQuickMenu`).
- **Modul Autentikasi (`src/pages/Auth`)**:
  - **Pemeriksaan Form Login & Sesi**: Verifikasi pemetaan NIG ke domain lokal (`${nig.trim()}@mlms.local`), integrasi Supabase Auth, serta pencegahan akses ganda bagi pengguna yang sudah terautentikasi.
  - **Perbaikan Rendering Pesan Error Login**: Memperbaiki ekstraksi dan sanitasi pesan error pada `Login.tsx` untuk mencegah kemunculan karakter mentah `{}` atau string kosong saat login gagal, menggantinya dengan pesan Bahasa Indonesia yang informatif ("NIG atau kata sandi yang Anda masukkan salah...").
  - **Proteksi Robustness Logout**: Menambahkan proteksi pada `authService.ts` dan `MainLayout.tsx` saat server Supabase mengalami kendala (seperti *502 Bad Gateway / upstream error*), sehingga proses pencabutan sesi lokal (`scope: 'local'`), reset Zustand store, dan pengalihan ke `/login` tetap dieksekusi secara mulus tanpa memblokir pengguna.
- **Keamanan & Robustness System**:
  - **Audit & Sanitasi Input Pencarian PostgREST**: Menambahkan helper `sanitizePostgrestSearch` pada `src/lib/utils.ts` dan menerapkannya pada pencarian **Pegawai** (`usePegawaiData.ts`), **Siswa** (`useSiswaData.ts`), **Wali Murid** (`useWaliMuridData.ts`), dan **Jurnal Mengajar** (`useJurnalMengajarList.ts`) untuk mencegah *syntax error* / HTTP 400 Bad Request dari karakter pencarian khusus (seperti `(`, `)`, `,`, `*`, `%`, `\`).
  - **Script & Registri Realtime Terintegrasi 100% Seluruh Halaman & Modal**: Membangun modul registri `src/config/realtimeConfig.ts` dan menghubungkan `useFeatureRealtimeSync` pada seluruh halaman (Master Data Lembaga, Pegawai, Siswa, Kelas, Wali Murid, Tahun Ajaran; Akademik Kalender, Jadwal, Jam, Mapel; KBM Activity Plan, Lesson Plan, Jurnal Mengajar, Absensi Mapel/Harian, Monitoring KBM; serta Dashboard Model 1 & 2) dan seluruh dialog/modal form secara menyeluruh.
  - **Script Aktivasi Supabase Realtime (CDC Backend)**: Membuat file SQL terdedikasi `dokumen api/enable_supabase_realtime.sql` untuk mendaftarkan 19 tabel ke `supabase_realtime` publication dan menetapkan `REPLICA IDENTITY FULL` guna mengaktifkan fitur sinkronisasi otomatis pada seluruh halaman aplikasi.
  - **Verifikasi Build & TypeScript**: Memperbaiki deprecation `baseUrl` pada `tsconfig.json` dengan `"ignoreDeprecations": "6.0"`, serta memastikan seluruh modul Master Data, KBM, Akademik, Dashboard, dan Auth lolos pemeriksaan tipe TypeScript (`npx tsc --noEmit`) dan build produksi Vite (`npm run build`) dengan 0 error.

### 24 Juli 2026 (Sesi 31)
- **Analisis & Verifikasi Skema Database Supabase**: Melakukan audit komprehensif terhadap 21 tabel skema database Supabase PostgreSQL dan memastikan kesesuaian 100% dengan `src/types/database.ts` serta arsitektur sistem proyek MLMS.
- **Penyelarasan Indikator Field Wajib & Opsional pada Seluruh Form**: Melakukan pengodean ulang dan audit penanda field wajib (`*` / `<span className="text-red-500">*</span>`) pada seluruh komponen modal dan dialog form pembuatan/edit data di seluruh modul.
- **Refactoring Database Types**: Memperbaiki duplikasi deklarasi interface `ABSENSI_HARIAN` dan `ABSENSI_HARIAN_CREATE` pada `src/types/database.ts`.

### 22 Juli 2026 (Sesi 30)
- **Reset Status Verifikasi RPP Otomatis**: Menambahkan logika pada sistem agar secara otomatis mengatur ulang status verifikasi *Lesson Plan*/RPP (mengubahnya kembali menjadi "Menunggu Verifikasi") ketika terdeteksi adanya perubahan pada **isi lesson plan**, **jadwal pelajaran**, atau **guru pengajar**.
- **Penyempurnaan Absensi Mapel**: Menambahkan tampilan untuk mata pelajaran dengan *Lesson Plan* (RPP) yang belum diverifikasi di *Wizard* Absensi Mapel. Mata pelajaran tetap akan ditampilkan namun dalam keadaan tidak bisa diklik (*disabled*) beserta peringatan "Belum terverifikasi".
- **Toggle Mode Editor RPP**: Menambahkan fitur untuk berganti antara *Rich Text* (menggunakan MDXEditor) dan *Source Mode* (Markdown raw textarea) secara langsung saat pengeditan detail pertemuan RPP dengan mode default diatur pada *Rich Text*.
- **Perubahan Jumlah Pertemuan Lesson Plan**: Mengubah aturan default sistem KBM untuk pembuatan *Lesson Plan* (RPP) yang tadinya menghasilkan otomatis 32 pertemuan menjadi 16 pertemuan.
- **Perbaikan Logika Wali Murid**: Mengubah aturan penentuan Wali Utama. Jika status Ayah "Wafat", Wali Utama tidak lagi otomatis berpindah ke Ibu. Pengguna dapat secara fleksibel memilih Ibu atau Wali Lain dengan mengisi form Data Wali Utama (ditambah tombol pintasan penyalinan data Ibu jika Ibu masih hidup). Selain itu, ketika Wali Utama berubah, *username* (NIK) dan email pada sistem *Authentication* juga ikut diperbarui.
- **Perbaikan Tampilan Data Siswa**: Memperbaiki fungsi pembacaan data wali agar tampilan nama wali murid pada tabel halaman Data Siswa disesuaikan dengan data wali utama secara dinamis, bukan lagi di-hardcode ke nama Ibu jika berstatus hidup.
- **Penambahan Tombol View pada Input Password**: Menambahkan tombol *toggle* visibilitas password (ikon Eye/EyeOff) pada form login (`Login.tsx`) dan modal Ubah Password (`MainLayout.tsx`) untuk melihat karakter tersembunyi.

### 22 Juli 2026 (Sesi 29)
- **Perubahan Editor Markdown RPP ke Mode Source**: Mengubah komponen editor untuk template RPP dan pengeditan detail pertemuan dari `MDXEditorWrapper` (Rich Text) ke komponen `Textarea` (Source Mode). Penyesuaian UI dengan TailwindCSS untuk text area editor (termasuk perbaikan lint `min-h-100`).

### 22 Juli 2026 (Sesi 28)
- **Modifikasi Pengisian Jadwal Pelajaran (Opsi Lanjutan)**: Menambahkan fitur opsi lanjutan pada Modal Edit Jadwal di halaman Jadwal Pelajaran. Pengguna dapat memilih batas akhir jam (massal) dengan validasi bentrok.
- **Pemisahan Lesson Plan Per Hari**: RPP akan terpisah untuk setiap harinya menggunakan imbuhan angka Romawi.
- **Pembaruan Lesson Plan**: Mengubah input "Pelaksanaan KBM" menjadi date picker, perbaikan UI form.
- **Optimasi Build Size**: Memindahkan data wilayah ke public asset.
- **Fix Data & Database**: Penyelesaian error constraint pada materi dan perbaikan field `pelaksanaan_kbm`.

### 22 Juli 2026 (Sesi 27)
- **Fix Data Jadwal Pelajaran**: Penambahan `refetchOnMount` pada hooks jadwal agar tidak stale.

### 22 Juli 2026 (Sesi 26)
- **Migrasi Live Markdown Preview**: Migrasi parser manual ke `react-markdown` + `remark-gfm` untuk pure preview.
- **Fitur Modal Pemilihan Kelas**: Penambahan ApplyTemplateModal saat menyimpan template RPP.

### 22 Juli 2026 (Sesi 25)
- **Fitur "Unggah Jadwal"**: Menambahkan tombol kondisional **"Unggah Jadwal"** di header halaman Jadwal Pelajaran yang otomatis mengunggah seluruh mata pelajaran terdaftar beserta guru pengajar dan alokasi waktu ke Lesson Plan dengan format judul `"Nama Mata Pelajaran – Kelas"`.
- **Tombol "Kirim Verifikasi" Kondisional**: Tombol **"Kirim Verifikasi"** otomatis muncul di header kartu RPP apabila seluruh 32 pertemuan RPP telah diisi (`32/32 Lengkap`), memungkinkan pengajuan verifikasi ke Kepala Sekolah & Direktur secara instan.
- **Filter Pencarian, Kelas, dan Mata Pelajaran (`LessonPlanFilters.tsx`)**: Menambahkan input **Pencarian Realtime** (judul RPP, guru, mapel, kelas) serta dropdown **Filter Kelas** dan **Filter Mata Pelajaran** yang terintegrasi dengan tab status verifikasi.
- **Tampilan Card Besar Pertemuan & Penanda 32/32 Lengkap**: Mengubah tampilan list pertemuan dari tombol grid kecil menjadi **Card Besar Pertemuan** terstruktur dengan informasi Materi, Sub-Topik, dan Hari KBM. Menambahkan badge hijau **`✓ 32/32 Lengkap`** ketika seluruh 32 pertemuan RPP telah diisi.
- **Halaman Edit Pertemuan Penuh (Bukan Pop-Up)**: Tombol *Edit Pertemuan* kini mengarahkan pengguna ke **Halaman Edit Penuh (`LessonPlanPertemuanEditPage.tsx`)**.
- **Pelaksanaan KBM Berbasis Hari**: Field Pelaksanaan KBM kini mengusung format nama Hari langsung (misal: "Senin") tanpa awalan kata "Hari", diekstrak otomatis dari Jadwal Akademik.
- **Alokasi Waktu Dinamis dari Jadwal Pelajaran**: Field **Alokasi Waktu (Dari Jadwal Pelajaran)** secara otomatis mencocokkan jam mulai dan jam berakhir (`jam_mulai` s.d `jam_selesai`) dari entri `jadwal_pelajaran` terkait (contoh: `07.00 - 07.45, 08.15 - 09.00`).
- **Fix Popover Link Dialog MDXEditor (`CreateLink`) Overlap**: Menambahkan override CSS global dengan `z-index: 99999 !important` dan styling flex layout pada [index.css](file:///home/deiro/Program%20Files/VS%20Code/Web/KKN/mlms_web/src/index.css) sehingga popover penciptaan link tidak tertimpa oleh sidebar atau tumpang tindih.
- **Halaman "Atur Template RPP" (`LessonPlanTemplateConfigPage.tsx`)**: Menambahkan tombol **"Atur Template RPP"** di header RPP — **hanya terlihat dan dapat diakses oleh role `Direktur` dan `Super Admin`** — yang mengarahkan pengguna ke halaman pengaturan template ber-layout **2 Card** (Card 1: Editor Markdown, Card 2: Pure Live Preview `PureMarkdownPreview.tsx` dengan dukungan penuh H1 s.d H6 dan format Underline `<u>`) serta dilengkapi **Banner Panduan Penulisan Format Markdown Terperinci** (collapsible toggle hide/show). Memiliki tombol **Simpan Template**, **Batal** (modal konfirmasi `isDirty`), dan **Reset ke Template Standar**.
- **Dua Tombol Aksi (Batal & Simpan)**: Bagian bawah Halaman Edit menyajikan tombol **Batal** (dengan modal intervensi konfirmasi apabila `isDirty`) dan **Simpan Pertemuan** (meng-update data dan kembali ke daftar RPP).
- **Kartu Panduan Informasi**: Menambahkan kartu informasi panduan penggunaan (collapsible alert banner) di halaman Jadwal Pelajaran dan Lesson Plan.

### 22 Juli 2026 (Sesi 24)
- **Implementasi Kelas Mapel (Pengganti Sistem Guru Mapel)**:
  - Mengubah paradigma relasi mata pelajaran dari *per guru* (`pegawai_mapel`) menjadi *per kelas* (`kelas_mapel`).
  - Halaman **Mata Pelajaran** kini mendukung assignment banyak kelas ke satu mapel (many-to-many via `kelas_mapel`).
  - Kolom "Guru Pengampu" di tabel diganti menjadi kolom **"Kelas"** yang menampilkan badge setiap kelas yang menggunakan mapel tersebut.
  - Form modal Tambah/Edit Mata Pelajaran: seksi "Pilih Guru Pengampu" (multi-select pegawai) diganti menjadi **"Pilih Kelas"** (multi-select kelas per lembaga yang dipilih).
  - Semua service API (`akademikService`, `relasiService`, `masterService`) dimigrasikan dari endpoint `/pegawai_mapel` ke `/kelas_mapel`.
  - Modal "Assign Mapel" di halaman Pegawai diubah menjadi notifikasi informatif bahwa penugasan mapel kini dilakukan per kelas, bukan per guru.
  - Menghapus kolom **"STATUS"** (Valid / Belum Valid) pada tabel Mata Pelajaran.
  - Memperbarui halaman **Jadwal Pelajaran** & **Jam Akademik**: seluruh pegawai & mata pelajaran dapat ditambahkan tanpa filter RPP; menambahkan input **Ruangan** pada modal edit `JadwalEditModal`; menambahkan & memperbarui kartu panduan informasi pada kedua halaman; mengatur urutan hari dimulai dari **Ahad**, **Senin**, dst.; menggabungkan sel kosong (*cell merge*) serta memanjangkan badge penanda khusus sesi **Istirahat** dan **Halaqoh** secara horizontal sepanjang sumbu-X (`w-full`).

### 22 Juli 2026 (Sesi 23)
- **Optimasi Realtime Sync & Tampilan Data Kosong Siswa**:
  - Mengubah `staleTime` kueri siswa menjadi 10 detik dan menambahkan opsi `refetchType: 'all'` pada `invalidateQueries` di `useRealtimeSync.ts` & mutasi `useSiswaData.ts`.
  - Mengintegrasikan listener realtime untuk tabel `siswa`, `kelas`, dan `wali_murid` pada `Siswa/Index.tsx` agar tampilan tabel dan pesan peringatan "Data masih kosong" langsung berganti secara realtime saat ada penambahan/penghapusan data.
- **Perbaikan Animasi Tombol Kartu Kelas (Halaman Master Data Kelas)**:
  - Menghapus efek `max-w-55 hover:max-w-30` dan `flex-wrap` pada container tombol aksi di `KelasCardList.tsx` sehingga tombol tidak lagi berpindah/meloncat ke bawah saat di-hover, melainkan tetap dalam posisi horizontal yang stabil dengan animasi *slide* teks keterangan.
- **Standardisasi Simbol Data Kosong (Em-Dash "—")**:
  - Mengubah seluruh simbol placeholder data kosong pada halaman Master Data (Siswa, Pegawai, Lembaga, Wali Murid, dan Tahun Ajaran) agar seragam menggunakan em-dash `"—"` alih-alih tanda strip biasa `"-"`.
- **Penyempurnaan Tombol Terapkan Jam Akademik pada Kelas Baru**:
  - Memperbarui pengecekan `hasJadwalChanges` pada `useJamAkademik.ts` agar memeriksa kelengkapan slot jam di **seluruh kelas** pada lembaga aktif.
  - Penambahan kelas baru secara otomatis mendeteksi slot jam yang belum di-generate dan mengaktifkan kembali tombol **"Terapkan Jam Akademik"**.
- **Perbaikan Format Jam Mulai & Jam Selesai (24-Jam & WIB Badge)**:
  - Mengganti elemen `<input type="time">` pada `JamFormModal.tsx` dengan elemen input format 24 jam (`HH:mm`, contoh: `07:00`, `13:30`) bertuliskan penanda zona waktu **WIB** di dalam/sisi kanan input.
  - Mengeliminasi tampilan bawaan browser 12 jam (AM/PM) sehingga waktu diinput dan ditampilkan seragam dalam format 24 jam WIB.
- **Fix Error PostgREST PGRST200 (`pegawai_mapel` → `kelas_mapel`)**:
  - Mengganti kueri join `pegawai_mapel` (tabel yang sudah dihapus/digantikan di database Supabase) dengan `kelas_mapel` pada modul Mata Pelajaran, Jadwal, dan Lesson Plan.
- **Fix Error PostgREST PGRST204 (`column lesson_plan_detail.fase / deskripsi / tema does not exist`)**: Menghapus field `fase`, `deskripsi`, dan `tema` dari tipe data dan payload simpan `/lesson_plan_detail`. Field `fase` dijadikan tampilan UI read-only ("Fase E") tanpa dikirim ke database backend.
- **Fix Error PostgREST 42703 (`column lesson_plan.mapel_id does not exist`)**:
  - Menghapus parameter `mapel_id` / `mapel:mapel_id` dari kueri `select` pada endpoint `lesson_plan` untuk menyesuaikan dengan skema database backend terbaru di mana `lesson_plan` terhubung via `jadwal_id`.
- **Perbaikan Fetching Data Tabel Wali Murid (Menggantikan Tanda "—")**:
  - Mengubah kueri `select` pada `useWaliMuridData.ts` menjadi wildcard (`*`) sehingga seluruh kolom tabel `wali_murid` (seperti `nik_ayah`, `pekerjaan_ayah`, `pendidikan_ayah`, `penghasilan_ayah`, `nik_ibu`, `pekerjaan_ibu`, `pendidikan_ibu`, `penghasilan_ibu`, dll.) di-fetch secara lengkap dari endpoint API.
  - Menghilangkan tampilan tanda `—` pada tabel dan modal detail Wali Murid saat data sebenarnya ada di database.
- **Perbaikan Deteksi Siswa pada Modal Pilih Siswa Wali Murid**:
  - Menambahkan parameter `limit: 1000` pada query fetch `dataUnlinkedSiswa` (`useWaliMuridData.ts`) agar PostgREST mengambil seluruh siswa yang belum ditautkan wali (`wali_murid_id is null`) dan tidak terbatas pada 10 baris default.
  - Memperbarui filter lembaga agar menyertakan siswa yang belum memiliki kelas (`!s.kelas_id`) sehingga siswa unassigned dapat terdeteksi di modal penautan wali.
- **Perbaikan Data Siswa & Pegawai Kosong pada Role Admin Lembaga / Non-Global**:
  - Memperbaiki kueri pada `useSiswaData.ts` dan `usePegawaiData.ts` yang sebelumnya mengembalikan array kosong `{ data: [], totalCount: 0 }` secara prematur jika role pengguna adalah non-global (misal **Admin Lembaga**, **WaKa Kurikulum**, **Kepala Sekolah**) dan `authLembagaId` belum terisi pada konteks sesi user.
  - Mengganti join `kelas:kelas_id!inner` menjadi left join sehingga siswa yang belum memiliki `kelas_id` (unassigned) tidak ikut ter-filter secara tidak sengaja oleh SQL INNER JOIN.
- **Perbaikan Fetching Data Tabel Siswa & Pegawai (Menggantikan Tanda "—")**:
  - Mengubah parameter `select` pada `useSiswaData.ts` menjadi wildcard (`*`) sehingga seluruh kolom tabel `siswa` (seperti `no_kk`, `no_akta_kelahiran`, `alamat_sekolah_asal`, `rt`, `rw`, `desa_kelurahan`, `kecamatan`, `kabupaten_kota`, `provinsi`, dll.) diambil langsung dari endpoint API Supabase alih-alih terbatas pada subset kolom tertentu.
  - Memastikan data pada tabel dan modal detail Siswa & Pegawai tampil lengkap tanpa lagi menampilkan tanda `—` saat data tersedia di database.
- **Fix CORS Error pada Dropdown Wilayah (`wilayah.id`)**:
  - Menambahkan proxy Vite di `vite.config.ts` untuk path `/api/wilayah` → `https://wilayah.id/api` sehingga request dilakukan dari server (Node.js) dan tidak terkena blokir CORS browser.
  - Mengganti semua URL `fetch("https://wilayah.id/api/...")` di `SiswaFormModal.tsx` menjadi URL relatif `/api/wilayah/...`.
- **Sinkronisasi TypeScript Interface dengan Backend Supabase Terbaru**:
  - Menghapus `PEGAWAI_MAPEL` (tabel lama sudah tidak ada di database) dan menggantinya dengan `KELAS_MAPEL` — relasi mata pelajaran per kelas, bukan per guru.
  - Menambahkan interface `ABSENSI_HARIAN` yang sebelumnya belum ada di layer frontend.
  - Perubahan `LESSON_PLAN` & `LESSON_PLAN_DETAIL` ditunda (ada perombakan fitur lebih besar).
  - Menambahkan dataset lokal wilayah Indonesia (`src/data/wilayah/`) dari `wilayah.sql` Kepmendagri 2025 sebagai fallback offline untuk dropdown alamat siswa.

### 22 Juli 2026 (Sesi 22)
- **Penambahan Isian Form Modal & Integrasi Skema Database Siswa & Pegawai**:
  - **Pegawai**: Menambahkan input field untuk Golongan Darah (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`), Jumlah Anak (L & P), Nama Ayah, dan Nama Ibu pada Form Modal. Menambahkan kalkulasi dinamis & preview visual real-time di form modal, tabel desktop, dan detail modal untuk **Tahun Lahir** dan **Umur** berdasarkan `tanggal_lahir`.
  - **Siswa**: Menambahkan input field untuk `NIK`, `No KK`, `No Akta Kelahiran`, `RT`, `RW`, `Desa/Kelurahan`, `Kecamatan`, `Kab/Kota`, `Provinsi`, dan `Alamat Sekolah Asal` pada Form Modal. Mengintegrasikan seluruh data kolom ke API backend, tabel data, dan detail modal.
  - **Pembaruan Tampilan Data Kosong & Ukuran Tombol**: Menyembunyikan tabel dan header tabel saat data kosong di halaman Wali Murid, Siswa, dan Pegawai, digantikan kartu peringatan berikon `AlertCircle` dengan teks **"Data masih kosong"**. Seluruh ukuran tombol utama & aksi diselaraskan agar seragam.
  - **Sinkronisasi Ekspor & Impor Excel**: Seluruh kolom baru pada Siswa (`No KK`, `No Akta`, `RT`, `RW`, `Desa`, `Kecamatan`, `Kab/Kota`, `Provinsi`, `Alamat Sekolah Asal`) dan Pegawai (`Jumlah Anak L & P`, `Nama Ayah`, `Nama Ibu`, `Golongan Darah`) telah diselaraskan penuh pada fitur Ekspor Excel, Download Template Excel, Impor Data Excel, Preview Impor, serta Pop-up Panduan Template (`PegawaiTemplateModal` & `SiswaTemplateModal`).
  - **Integrasi API Wilayah.id**: Mengintegrasikan API data wilayah **Wilayah.id** untuk membuat dropdown bertingkat dinamis (Provinsi → Kabupaten/Kota → Kecamatan → Desa/Kelurahan) pada form modal siswa. Jika API tidak tersedia (offline/error), sistem secara otomatis beralih ke **dataset lokal** yang diekstrak dari `wilayah.sql` (Kepmendagri 2025) dan disimpan sebagai 4 file JSON di `src/data/wilayah/` (38 provinsi, 514 kab/kota, 7.265 kecamatan, 83.345 desa/kelurahan).

### 21 Juli 2026 (Sesi 21)
- **Penyembunyian Tombol Edit Kategori Halaqoh**:
  - Menyembunyikan tombol edit (pensil) khusus untuk jam pelajaran berkategori **Halaqoh** di halaman Jadwal Pelajaran (Kelas/Akademik). Hal ini melengkapi penyembunyian tombol edit untuk kategori **Istirahat** yang telah diterapkan sebelumnya, karena sesi Halaqoh tidak memerlukan pengisian/pembaruan mata pelajaran dan guru secara manual.
- **Penyelarasan Urutan Menu Akademik di Sidebar**:
  - Menyusun ulang urutan menu navigasi di bawah kategori **Akademik** pada sidebar/menu utama agar memiliki hierarki logis sesuai permintaan:
    1. Mata Pelajaran
    2. Kalender Akademik
    3. Jam Akademik
    4. Jadwal Pelajaran
    5. Jadwal Guru
- **Penambahan Izin Akses CUD Halaman Kelas & Siswa untuk Role Direktur**:
  - Memberikan hak akses CUD (Create, Update, Delete) secara penuh bagi role **Direktur** pada entitas **Kelas** dan **Siswa** di `usePermissions.ts` untuk memungkinkan penambahan, pengubahan, dan penghapusan data kelas dan siswa secara langsung dari antarmuka web.
- **Pemberian Informasi Pengelolaan Jadwal Pelajaran (Collapsible)**:
  - Menambahkan banner informasi (Alert Card) berwarna biru dengan ikon di bagian atas halaman **Jadwal Pelajaran** (`JadwalAkademik.tsx`) untuk memberikan edukasi/panduan cara mengubah jadwal (informasi bahwa struktur jam dibuat otomatis dari Jam Akademik dan pengisian guru/mapel dilakukan via tombol Edit). Banner didesain bersifat **collapsible/expandable** (bisa dibuka-tutup) dengan tombol dropdown interaktif yang identik seperti pada halaman Monitoring KBM.
- **Penyelarasan Desain Tombol Aksi Halaman Mata Pelajaran**:
  - Mengubah tampilan tombol Edit dan Hapus pada tabel **Mata Pelajaran** (`MataPelajaran/Index.tsx`) dari model tombol *ghost text* biasa agar seragam dengan desain modern tombol aksi pada halaman Siswa dan Pegawai (tombol Edit dengan latar biru border lembut, dan tombol Hapus berbentuk kotak ikon-saja dengan latar merah border lembut).

### 21 Juli 2026 (Sesi 20)
- **Integrasi Jam Akademik ↔ Jadwal Pelajaran: Fitur "Terapkan ke Jadwal Kelas"**:
  - Menambahkan tombol **"Terapkan ke Jadwal Kelas"** di header halaman Jam Akademik untuk sinkronisasi otomatis slot waktu ke jadwal pelajaran.
  - Memperbarui halaman Jadwal Pelajaran agar menampilkan tipe jam (Halaqoh, Istirahat, Belajar) sebagai badge berwarna jika slot belum memiliki mata pelajaran.
- **Pembersihan Halaman Jadwal Pelajaran (Jadwal Akademik)**:
  - Menyembunyikan tombol "Tambah Jadwal" di header halaman Jadwal Pelajaran serta menghapus tombol "Hapus" (tempat sampah) dari setiap baris data jadwal agar halaman bersifat read-only.
  - Menyembunyikan tombol pensil (edit) khusus untuk jam pelajaran berkategori **Istirahat** dan memigrasikan edit ke popup/modal interaktif `JadwalEditModal.tsx`.
- **Otomatisasi Form & Batasan Hapus Jam Akademik**:
  - Menghapus input `Urutan Jam` dari form modal, di mana nilai urutan tetap dikalkulasi secara otomatis.
  - Membatasi penghapusan jam akademik agar hanya mengizinkan penghapusan jam akademik urutan terakhir.

### 20 Juli 2026 (Sesi 19)
- **Perbaikan Pop-up Detail Pegawai**:
  - Mengatasi masalah modal/pop-up detail pegawai yang menembus layar (overflow) dengan menambahkan kelas `max-h-[90vh]` and `overflow-y-auto` pada `DialogContent` di `PegawaiDetailModal.tsx` agar konten modal dapat di-scroll secara vertikal apabila melebihi tinggi layar.

### 20 Juli 2026 (Sesi 18)
- **Perbaikan dan Penambahan Kolom Tabel Siswa & Pegawai**:
  - Menambahkan kolom `Tahun Lahir`, `Umur`, `Jumlah Anak` (L & P), `Nama Orang Tua` (Ayah & Ibu), dan `Gol Darah` pada Halaman Pegawai, serta kolom `NIK`, `KK`, `No Akta`, `RT`, `RW`, `Provinsi`, `Kab/Kota`, `Kecamatan`, dan `Desa` pada Halaman Siswa. Seluruh kolom tambahan bernilai default `"—"` (em-dash) di frontend.
  - Mengimplementasikan layout header bertingkat/berhierarki menggunakan `rowSpan` dan `colSpan` pada table header Pegawai untuk mengelompokkan sub-kolom `Jumlah Anak (L & P)` dan `Nama Orang Tua (Ayah & Ibu)` dengan pembatas grid yang bersih.
  - Memastikan fitur interactive drag-resize kolom tetap berfungsi normal pada level kolom leaf (termasuk sub-kolom).
  - Menyertakan data-data baru ini ke dalam modal Detail Siswa dan Detail Pegawai ketika tombol "Lihat" diklik.
- **Optimasi Animasi Loading & Pagination Master Data**:
  - Menggunakan `placeholderData: keepPreviousData` untuk query data Pegawai, Siswa, dan Wali Murid agar data lama tetap dipertahankan saat memuat data baru (menghindari kedipan layar putih).
  - Menambahkan layout overlay loading semi-transparan dengan spinner animasi di atas tabel selama proses pengambilan data baru berlangsung (`isFetching`).

### 20 Juli 2026
- **Perbaikan Tabel dan Detail Pegawai, Siswa, dan Wali Murid**:
  - Menampilkan seluruh kolom data tanpa terkecuali untuk tabel desktop Pegawai, Siswa, dan Wali Murid.
  - Menampilkan secara lengkap seluruh kolom data di modal detail Pegawai, Siswa, dan Wali Murid ketika tombol "Lihat" diklik.
  - Memperbaiki tampilan untuk teks panjang pada kolom `Alamat`, `Tugas Tambahan`, `Keterangan Asrama`, dan `Asal Sekolah` agar membungkus dengan benar (`wrap-break-word whitespace-normal`) tanpa merusak lebar table atau modal detail.
  - Mengimplementasikan fitur **Excel-like Column Resizing & Overlap/Z-Index Fix** pada tabel desktop Pegawai, Siswa, dan Wali Murid, memungkinkan pengguna menggeser drag handle di batas kanan setiap kolom header secara interaktif untuk mengatur lebar kolom secara kustom. Sel data terpotong secara otomatis (`truncate`) dengan hover tooltip (`title`) saat kolom diperkecil. Header tabel menggunakan `truncate` dan hover `title` ketika diseret terlalu rapat untuk mencegah teks judul kolom saling menumpuk. Diposisikan juga pembagi kolom di level `z-5` dan kontainer filter dropdown di level `z-30`/`z-50` agar menu dropdown filter yang terbuka tidak tertembus/tereksekusi oleh kursor mouse pada pembagi kolom.

### 19 Juli 2026
- **Optimasi Latency Fetch Data Global & Per Halaman**:
  - In-Memory Session Caching di `axios.ts` menghemat overhead session check (mengurangi ~100–300ms per request).
  - Penyetelan parameter `staleTime` yang tepat di 9 hook data untuk menghindari unnecessary network calls.
  - Migrasi data fetching berbasis `useEffect` + `setState` ke React Query (`useQuery`) di halaman Jadwal, Mapel, dan Monitoring.
  - Membatasi payload query (`select` kolom spesifik) dan merampingkan query Wali Kelas menjadi single join query.
- **Penyederhanaan UI Wali Dari Siswa**:
  - Mengubah badge jumlah siswa menjadi tombol klik-able untuk memicu atur siswa dan menghapus tombol ikon pensil.
- **Pembaruan Sistem Verifikasi & Alasan Penolakan Lesson Plan**:
  - Menyembunyikan tombol verifikasi untuk Kepala Sekolah apabila Direktur telah menolak, dan sebaliknya.
  - Menampilkan nama penolak (Kepala Sekolah/Direktur) beserta alasan catatan penolakan secara visual pada list RPP.
- **Pengaturan Role Pegawai Terpusat di Detail**:
  - Menghapus tombol aksi `"Role Sistem"` di tabel pegawai (`PegawaiTable.tsx`) dan memindahkan fiturnya ke dalam modal pop-up Detail Pegawai (`PegawaiDetailModal.tsx`) berupa tombol baru **"Atur Role Pengguna"** di atas informasi akun.
- **Perbaikan Bug: Modal Hilang Saat Pindah Tab Browser (Global Fix)**:
  - Menambahkan `onInteractOutside` handler pada `DialogContent` global (`dialog.tsx`) untuk mencegah Radix UI Dialog menutup modal saat pindah tab, sambil tetap mengizinkan klik overlay untuk menutup.
  - Memodifikasi `onAuthStateChange` di `App.tsx` agar skip re-processing session saat `TOKEN_REFRESHED` jika user sudah terautentikasi — mencegah komponen re-mount dan hilangnya state lokal.
  - Fix berlaku global untuk semua dialog/modal di seluruh aplikasi.
- **Penyederhanaan UI: Tombol "Lihat" + Tempat Sampah (Master Data)**:
  - Menyederhanakan tombol aksi pada tabel/kartu Master Data (Siswa, Pegawai, Wali Murid) pada tampilan desktop & mobile menjadi tombol utama **"Lihat"** (berikon mata `Eye`) dan tombol **Tempat Sampah** (`Trash2`) di sebelah kanannya untuk menghapus.
- **Fitur Pop-up Daftar Guru Pengampu Mata Pelajaran**:
  - Pada tabel Mata Pelajaran (`MataPelajaran/Index.tsx`), jika jumlah guru pengampu > 1 maka ditampilkan sebagai tombol badge **"{X} Guru"**.
  - Saat tombol diklik, membuka modal pop-up (`GuruPengampuModal.tsx`) berisi tabel lengkap nama guru pengampu dan info NIP/NIG.
- **Penyatuan Filter Event Mendatang (Kalender)**:
  - Menyederhanakan tampilan filter (`KalenderFilters.tsx`) dengan menghapus card latar bagian dalam, menyatukan dropdown kategori dan bulan langsung ke dalam kontainer Event Mendatang.
- **Pembersihan Informasi Modal Daftar Siswa Kelas**:
  - Menyederhanakan tampilan informasi baris siswa pada modal `Daftar Siswa Kelas` (`KelasListSiswaModal.tsx`) agar **hanya menampilkan NIS saja**.
- **Fitur UI & Animasi: Tombol Aksi Animasi Expand Teks (Desktop)**:
  - Mengimplementasikan animasi expand memanjang ke kanan dengan label teks ("Lihat", "Edit", "Hapus", "Siswa", "Setujui", "Revisi") saat kursor menyorot tombol aksi di 11 halaman sistem.
  - Mengatur container wrapping (`flex flex-wrap max-w-55 hover:max-w-30`) sehingga saat awal/unhovered **semua tombol berada sejajar dalam 1 baris**. Ketika kursor di-hover pada salah satu tombol, tombol tersebut memanjang di baris atas, dan 2 tombol lainnya secara otomatis berpindah ke baris di bawahnya, lalu kembali sejajar 1 baris setelah kursor menjauh.
  - Disamakan persis dengan tampilan tombol di **Halaman Siswa** (`text-gray-500 bg-white hover:bg-blue-50/red-50 border border-gray-200 shadow-xs rounded-lg w-4 h-4`).
- **Perbaikan Animasi UI: Animasi Slide Dari Atas ke Bawah di Detail Jurnal Mengajar**:
  - Mengubah animasi kemunculan kartu **"Detail Pertemuan ke-x"** dan **"Daftar Presensi Siswa"** di `JurnalMengajar/Detail.tsx` menjadi meluncur dari atas ke bawah (`slide-in-from-top-6 fade-in duration-500`) tepat di bawah header judul jurnal.
- **Perbaikan UI Layout: Reposisi Filter Kalender Akademik**:
  - Memindahkan filter Kategori dan Bulan ke dalam kartu **"Event Mendatang"** (`KalenderSidebar.tsx`) dengan desain 2 kolom ringkas dan tombol reset di header card.
- **Pembersihan UI: Menghapus Tombol Mapel di Halaman Pegawai**:
  - Menghapus tombol aksi `"Mapel"` dan modal penugasan mata pelajaran dari halaman Master Data Pegawai (`PegawaiTable.tsx` dan `Pegawai/Index.tsx`).
- **Perbaikan Bug: Stabilitas Data Master (Lembaga, Pegawai, Kelas, Siswa) Saat Pindah Tab**:
  - Menambahkan `staleTime: 30000` (30 detik) dan proteksi safe-pagination pada query Master Data untuk mencegah data hilang / blank saat pengguna berpindah tab browser dan kembali.
- **Perbaikan: Scope Data & Hak Akses Per Role (Waka Kurikulum, Admin Lembaga, Kepala Sekolah)**:
  - Menu & rute Master Data Lembaga kini hanya dapat diakses oleh Super Admin dan Direktur.
  - Halaman Pegawai, Kelas, dan Siswa otomatis memfilter data sesuai `lembaga_id` user aktif untuk role non-global, serta menyembunyikan dropdown filter lembaga.
- **Perbaikan: Penerjemahan Error Login**:
  - Pesan error login bawaan Supabase (`"Invalid login credentials"`) diterjemahkan ke bahasa Indonesia yang ramah pengguna awam.

### 18 Juli 2026
- **Fitur: Realtime Supabase untuk Lesson Plan**:
  - `useLessonPlanList` dimigrasi ke React Query + `useRealtimeSync`.
  - Daftar RPP kini otomatis ter-refresh saat ada perubahan di tabel `lesson_plan` / `lesson_plan_detail` tanpa reload halaman.
- **Perbaikan: Nomor Pertemuan Lesson Plan Otomatis**:
  - Input angka pertemuan ke dihapus dari form RPP. Nomor urut kini ditentukan otomatis dari posisi baris (badge read-only lingkaran biru).
  - `pertemuan_ke` pada submit selalu dari `index + 1`, bukan dari input user.
- **Perbaikan: Logika Upsert Absensi Mapel per Pertemuan**:
  - Identifier jurnal diubah dari `jadwal_id + tanggal` → `jadwal_id + pertemuan_ke`.
  - Pertemuan sama → update jurnal lama; pertemuan beda → buat jurnal baru.

### 16 Juli 2026
- **Testing Fungsional Modul KBM — Iterasi 2 (Final & Perbaikan Bug)**:
  - Melaksanakan analisis statis kode dan pemetaan test case komprehensif untuk 6 sub-modul KBM: Lesson Plan, Absensi Pelajaran, Jurnal Mengajar, Rekap Absensi, Monitoring KBM, dan Activity Plan.
  - Memperbaiki 4 temuan fungsional kritis/menengah (BUG-KBM-01 s.d BUG-KBM-04) dan 1 celah performa/keamanan (GAP-KBM-01).
  - **Laporan hasil testing final** disusun di [kbm_testing_report.md](file:///home/deiro/Program%20Files/VS%20Code/Web/KKN/mlms_web/dokumen%20api/kbm_testing_report.md) (Iterasi 2 - Final).
  - Build produksi terverifikasi sukses (`npm run build` lulus 100%).
- **Refactoring (Penyederhanaan Kode) Modul Jurnal Mengajar**:
  - Mendekomposisi `Index.tsx` menjadi 50 baris dan `Detail.tsx` menjadi 74 baris dengan custom hooks `useJurnalMengajarList` dan `useJurnalMengajarDetail`.
- **Refactoring (Penyederhanaan Kode) Modul Monitoring KBM**:
  - Mendekomposisi `Universal.tsx` dan `WaliKelas.tsx` dengan custom hooks `useUniversalMonitoring` dan `useWaliKelasMonitoring`.
- **Refactoring (Penyederhanaan Kode) Modul Lesson Plan (RPP)**:
  - Mendekomposisi `Index.tsx` dan `Form.tsx` dengan custom hooks `useLessonPlanList` dan `useLessonPlanForm`.
- **Refactoring (Penyederhanaan Kode) Modul Activity Plan & Absensi**:
  - Mendekomposisi `ActivityPlan` dan `RekapSiswa.tsx` serta form wizards absensi.

---

## 📅 Juni - Awal Juli 2026

### 01 - 15 Juli 2026
- **Integrasi Supabase Realtime & Optimasi Sesi**: CDC Backend `supabase_realtime` terintegrasi pada 19 tabel database.
- **Master Data & Modul Akademik**: Pengelolaan Lembaga, Kelas, Siswa, Pegawai, Wali Murid, Tahun Ajaran, Mata Pelajaran, Jam Akademik, Jadwal Pelajaran, Kalender Akademik.
- **KBM & Absensi**: Absensi Mapel & Harian, Face Recognition, Lesson Plan (RPP), Monitoring KBM, Activity Plan.
- **Testing & Quality Assurance**: 10 berkas Cypress E2E Testing (`01_auth.cy.ts` s.d `10_dashboard.cy.ts`) & 100% verifikasi build produksi Vite.
