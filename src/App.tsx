import React, { useEffect, Suspense } from "react";
import { Toaster, toast } from "sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthStore } from "./store/useAuthStore";
import { getMe } from "./lib/api/services/authService";
import GlobalMutationLoader from "./components/ui/GlobalMutationLoader";
import GlobalNetworkHandler from "./components/ui/GlobalNetworkHandler";
import SessionTimeoutGuard from "./components/ui/SessionTimeoutGuard";
import ErrorBoundary from "./components/ui/ErrorBoundary";

// --- Lazy-loaded pages ---
// Auth
const Login        = React.lazy(() => import("./pages/Auth/Login"));
const ErrorPage    = React.lazy(() => import("./pages/Auth/ErrorPage"));

// Dashboard
const DashboardIndex = React.lazy(() => import("./pages/Dashboard/Index"));

// MasterData
const LembagaIndex         = React.lazy(() => import("./pages/MasterData/Lembaga/Index"));
const PegawaiIndex         = React.lazy(() => import("./pages/MasterData/Pegawai/Index"));
const PegawaiImportPreview = React.lazy(() => import("./pages/MasterData/Pegawai/ImportPreview"));
const SiswaIndex           = React.lazy(() => import("./pages/MasterData/Siswa/Index"));
const SiswaImportPreview   = React.lazy(() => import("./pages/MasterData/Siswa/ImportPreview"));
const KelasIndex           = React.lazy(() => import("./pages/MasterData/Kelas/Index"));
const WaliMuridIndex         = React.lazy(() => import("./pages/MasterData/WaliMurid/Index"));
const WaliMuridImportPreview = React.lazy(() => import("./pages/MasterData/WaliMurid/ImportPreview"));
const TahunAjaranIndex       = React.lazy(() => import("./pages/MasterData/TahunAjaran/Index"));

// Akademik
const MataPelajaranIndex = React.lazy(() => import("./pages/Akademik/MataPelajaran/Index"));
const KalenderIndex      = React.lazy(() => import("./pages/Akademik/Kalender/Index"));
const JadwalAkademik     = React.lazy(() => import("./pages/Akademik/Jadwal/JadwalAkademik"));
const JadwalGuru         = React.lazy(() => import("./pages/Akademik/Jadwal/JadwalGuru"));
const JadwalKelas        = React.lazy(() => import("./pages/Akademik/Jadwal/JadwalKelas"));
const JamAkademikIndex   = React.lazy(() => import("./pages/Akademik/JamAkademik/Index"));

// KBM
const LessonPlanIndex       = React.lazy(() => import("./pages/KBM/LessonPlan/Index"));
const LessonPlanForm        = React.lazy(() => import("./pages/KBM/LessonPlan/Form"));
const JurnalMengajarIndex   = React.lazy(() => import("./pages/KBM/JurnalMengajar/Index"));
const JurnalMengajarDetail  = React.lazy(() => import("./pages/KBM/JurnalMengajar/Detail"));
const AbsensiRekapSiswa     = React.lazy(() => import("./pages/KBM/Absensi/RekapSiswa"));
const AbsensiHarianIndex    = React.lazy(() => import("./pages/KBM/AbsensiHarian/Index"));
const RekapAbsensiHarianIndex = React.lazy(() => import("./pages/KBM/AbsensiHarian/Rekap/Index"));
const AbsensiMataPelajaran  = React.lazy(() => import("./pages/KBM/Absensi/Index"));
const ResetAbsensi          = React.lazy(() => import("./pages/KBM/Absensi/ResetAbsensi"));
const FaceRecognitionIndex  = React.lazy(() => import("./pages/KBM/FaceRecognition/Index"));
const MonitoringUniversal   = React.lazy(() => import("./pages/KBM/Monitoring/Universal"));
const MonitoringWaliKelas   = React.lazy(() => import("./pages/KBM/Monitoring/WaliKelas"));
const ActivityPlanIndex     = React.lazy(() => import("./pages/KBM/ActivityPlan/Index"));

// Fallback loading saat halaman sedang di-fetch (lazy chunk loading)
const PageLoader = () => (
  <div className="flex items-center justify-center h-dvh bg-[#F4F7FE]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-[#1e2f65] border-t-[#FACC15] animate-spin" />
      <span className="text-sm text-[#1e2f65] font-bold tracking-wide">Memuat data ...</span>
    </div>
  </div>
);


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime: 30 detik agar data selalu responsif dan fresh
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      // Retry otomatis 2x dengan jeda singkat untuk mengatasi transient network error
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    },
  },
  mutationCache: new MutationCache({
    onError: (error: any) => {
      // Hanya menampilkan toast jika error memiliki pesan, mencegah spam kosong
      if (error?.message) {
        toast.error("Terjadi kendala saat memproses permintaan. Silakan coba lagi.", {
          id: 'global-mutation-error', // Mencegah duplikasi toast (deduplication) jika komponen juga memanggil toast
        });
      }
    },
  }),
});

const App: React.FC = () => {
  const { setUser, logout, setAuthLoading } = useAuthStore();

  useEffect(() => {
    // Restore session dari token yang tersimpan di localStorage
    const restoreSession = async () => {
      const storedToken = useAuthStore.getState().token;
      if (!storedToken) {
        setAuthLoading(false);
        return;
      }

      try {
        const userData = await getMe();

        const rolesContexts = userData.roles.map((ur: any) => ({
          role: ur.nama_role,
          lembaga_id: ur.lembaga_id ?? null,
          lembaga_name: ur.lembaga ? (ur.lembaga.singkatan || ur.lembaga.nama_lembaga) : null,
        }));

        // Cek apakah ada role "Wali Murid" saja (diblokir dari web app)
        const isWaliMurid = rolesContexts.some((r: any) => r.role === 'Wali Murid') && rolesContexts.length === 1;
        if (isWaliMurid) {
          logout();
          return;
        }

        const currentActiveRole = useAuthStore.getState().role;
        const currentActiveLembaga = useAuthStore.getState().lembaga_id;
        const currentActiveExists = rolesContexts.find(
          (rc: any) => rc.role === currentActiveRole && rc.lembaga_id === currentActiveLembaga
        );

        setUser({
          user_id: userData.user_id,
          username: userData.username,
          pegawai_id: userData.pegawai?.pegawai_id,
        }, rolesContexts, currentActiveExists || undefined);
      } catch (_err) {
        // Token kadaluarsa atau tidak valid → logout
        logout();
      }
    };

    restoreSession();
  }, [setUser, logout, setAuthLoading]);
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalNetworkHandler />
      <GlobalMutationLoader />
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <SessionTimeoutGuard />
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />


          {/* Rute yang Wajib Login */}
          <Route element={<ProtectedRoute />}>
            {/* Semua halaman masuk ke dalam MainLayout (Punya Sidebar & Header) */}
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardIndex />} />

              {/* --- ROUTING LINK MASTER DATA --- */}
              <Route path="/master-data">

                {/* Lembaga: SA, Dir */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={["Super Admin", "Direktur"]}
                    />
                  }
                >
                  <Route path="lembaga" element={<LembagaIndex />} />
                </Route>

                {/* Pegawai, Kelas: SA, Dir, Kep, WK, AL, WaliKelas, Guru */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "Super Admin",
                        "Direktur",
                        "Kepala Sekolah",
                        "WaKa Kurikulum",
                        "Admin Lembaga",
                        "Wali Kelas",
                        "Guru",
                      ]}
                    />
                  }
                >
                  <Route path="pegawai" element={<PegawaiIndex />} />
                  <Route path="pegawai/import" element={<PegawaiImportPreview />} />
                  <Route path="kelas" element={<KelasIndex />} />
                </Route>
                {/* Siswa: SA, Dir, WaKa Kurikulum, Admin Lembaga, Wali Kelas, Wali Murid */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "Super Admin",
                        "Direktur",
                        "WaKa Kurikulum",
                        "Admin Lembaga",
                        "Wali Kelas",
                        "Wali Murid",
                      ]}
                    />
                  }
                >
                  <Route path="siswa" element={<SiswaIndex />} />
                  <Route path="siswa/import" element={<SiswaImportPreview />} />
                </Route>

                {/* Wali Murid: SA, Dir, Admin Lembaga, Wali Kelas, Wali Murid */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "Super Admin",
                        "Direktur",
                        "Admin Lembaga",
                        "Wali Kelas",
                        "Wali Murid",
                      ]}
                    />
                  }
                >
                  <Route path="wali-murid" element={<WaliMuridIndex />} />
                  <Route path="wali-murid/import" element={<WaliMuridImportPreview />} />
                </Route>

                {/* Tahun Ajaran: SA */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={["Super Admin"]}
                    />
                  }
                >
                  <Route path="tahun-ajaran" element={<TahunAjaranIndex />} />
                </Route>
              </Route>

              {/* --- ROUTING LINK AKADEMIK --- */}
              <Route path="/akademik">
                {/* Mata Pelajaran: Dir, WaKa Kurikulum, Admin Lembaga */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "Direktur",
                        "WaKa Kurikulum",
                        "Admin Lembaga",
                      ]}
                    />
                  }
                >
                  <Route
                    path="mata-pelajaran"
                    element={<MataPelajaranIndex />}
                  />
                </Route>

                {/* Kalender Akademik: All */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "Super Admin",
                        "Direktur",
                        "Kepala Sekolah",
                        "WaKa Kurikulum",
                        "Admin Lembaga",
                        "Wali Kelas",
                        "Guru",
                        "Wali Murid",
                      ]}
                    />
                  }
                >
                  <Route path="kalender" element={<KalenderIndex />} />
                </Route>

                {/* Jam Akademik (Tanpa Wali Murid) */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "Direktur",
                        "Kepala Sekolah",
                        "WaKa Kurikulum",
                        "Admin Lembaga",
                      ]}
                    />
                  }
                >
                  <Route path="jam-akademik" element={<JamAkademikIndex />} />
                </Route>


                {/* Jadwal Pelajaran Views (Dengan Wali Murid) */}
                {/* Jadwal Pelajaran (Tanpa Guru & Wali Kelas) */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "Direktur",
                        "Kepala Sekolah",
                        "WaKa Kurikulum",
                        "Admin Lembaga",
                        "Wali Murid",
                      ]}
                    />
                  }
                >
                  <Route path="jadwal/akademik" element={<JadwalAkademik />} />
                </Route>

                {/* Jadwal Guru (Direktur & Guru) */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "Direktur",
                        "Guru",
                        "Wali Murid",
                      ]}
                    />
                  }
                >
                  <Route path="jadwal/guru" element={<JadwalGuru />} />
                </Route>

                {/* Jadwal Kelas (Khusus Wali Kelas) */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={["Wali Kelas"]}
                    />
                  }
                >
                  <Route path="jadwal/kelas" element={<JadwalKelas />} />
                </Route>
              </Route>

              {/* --- ROUTING LINK KBM --- */}
              <Route path="/kbm">
                {/* Jurnal Mengajar (Guru & Wali Kelas) */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "Direktur",
                        "Kepala Sekolah",
                        "WaKa Kurikulum",
                        "Wali Kelas",
                        "Guru",
                      ]}
                    />
                  }
                >
                  <Route path="jurnal-mengajar" element={<JurnalMengajarIndex />} />
                  <Route path="jurnal-mengajar/:id" element={<JurnalMengajarDetail />} />
                </Route>

                {/* Lesson Plan (Tanpa Wali Kelas) */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "Direktur",
                        "Kepala Sekolah",
                        "WaKa Kurikulum",
                        "Guru",
                      ]}
                    />
                  }
                >
                  <Route path="lesson-plan" element={<LessonPlanIndex />} />
                  <Route path="lesson-plan/form" element={<LessonPlanForm />} />
                  <Route path="lesson-plan/form/:id" element={<LessonPlanForm />} />
                </Route>

                {/* Absensi Mapel (Khusus Guru) */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "Guru",
                        "Wali Murid",
                      ]}
                    />
                  }
                >
                  <Route
                    path="absensi"
                    element={<Navigate to="/kbm/absensi/mata-pelajaran" replace />}
                  />
                  <Route
                    path="absensi/mata-pelajaran"
                    element={<AbsensiMataPelajaran />}
                  />
                </Route>

                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "Direktur",
                        "Kepala Sekolah",
                        "WaKa Kurikulum",
                        "Guru",
                        "Wali Murid",
                      ]}
                    />
                  }
                >
                  <Route path="absensi/rekap-siswa" element={<AbsensiRekapSiswa />} />
                </Route>

                {/* Absensi Harian (Khusus Wali Kelas) */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "Wali Kelas",
                      ]}
                    />
                  }
                >
                  <Route path="absensi/harian" element={<AbsensiHarianIndex />} />
                </Route>

                {/* Rekap Kehadiran Harian (Direktur & Wali Kelas) */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "Direktur",
                        "Wali Kelas",
                      ]}
                    />
                  }
                >
                  <Route path="absensi/rekap-harian" element={<RekapAbsensiHarianIndex />} />
                </Route>

                {/* Reset Absensi (Khusus Direktur & Super Admin) */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "Direktur",
                        "Super Admin",
                      ]}
                    />
                  }
                >
                  <Route path="absensi/reset" element={<ResetAbsensi />} />
                </Route>


                {/* Face Recognition (Mapped with Absensi Pelajaran but strictly for operational users) */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "Direktur",
                        "Kepala Sekolah",
                        "WaKa Kurikulum",
                        "Wali Kelas",
                        "Guru",
                      ]}
                    />
                  }
                >
                  <Route
                    path="face-recognition"
                    element={<FaceRecognitionIndex />}
                  />
                </Route>

                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "Direktur",
                        "Kepala Sekolah",
                        "WaKa Kurikulum",
                      ]}
                    />
                  }
                >
                  <Route
                    path="monitoring/universal"
                    element={<MonitoringUniversal />}
                  />
                </Route>

                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "Wali Kelas",
                      ]}
                    />
                  }
                >
                  <Route
                    path="monitoring/wali-kelas"
                    element={<MonitoringWaliKelas />}
                  />
                </Route>

                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={["Direktur", "Kepala Sekolah"]}
                    />
                  }
                >
                  <Route path="activity-plan" element={<ActivityPlanIndex />} />
                </Route>
              </Route>
            </Route>
          </Route>

          {/* Error Pages */}
          <Route path="/400" element={<ErrorPage code={400} />} />
          <Route path="/unauthorized" element={<ErrorPage code={403} />} />
          <Route path="*" element={<ErrorPage code={404} />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
