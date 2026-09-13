import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarDays, FileText, Clock, User, CheckCircle2, TrendingUp
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { restClient } from "@/lib/api/axios";

export default function DashboardModel3() {
  const user = useAuthStore(state => state.user);
  const [selectedSiswaId, setSelectedSiswaId] = useState<number | null>(null);

  // 1. Fetch Profil Wali Murid
  const { data: waliData } = useQuery({
    queryKey: ['dash3-wali', user?.user_id],
    staleTime: 10 * 60 * 1000, // 10 menit
    queryFn: async () => {
      const res = await restClient.get('/wali_murid', {
        params: {
          user_id: `eq.${user?.user_id}`,
          select: 'wali_id,nama_ayah,status_ayah,nama_ibu,status_ibu,nama_wali'
        }
      });
      return res.data?.[0];
    },
    enabled: !!user?.user_id
  });

  const waliId = waliData?.wali_id;

  // 2. Fetch Data Anak
  const { data: anakList } = useQuery({
    queryKey: ['dash3-anak', waliId],
    staleTime: 5 * 60 * 1000, // 5 menit
    queryFn: async () => {
      const res = await restClient.get('/siswa', {
        params: {
          wali_murid_id: `eq.${waliId}`,
          select: 'siswa_id,nama,nis,kelas_id,kelas:kelas_id(nama_kelas,lembaga(nama_lembaga))'
        }
      });
      return res.data || [];
    },
    enabled: !!waliId
  });

  const selectedAnak = anakList?.find((a: any) => a.siswa_id === selectedSiswaId) || null;

  // 3. Fetch Jadwal Pelajaran
  const { data: jadwalHariIni } = useQuery({
    queryKey: ['dash3-jadwal', selectedAnak?.kelas_id],
    staleTime: 5 * 60 * 1000, // 5 menit
    queryFn: async () => {
      const res = await restClient.get('/jadwal_pelajaran', {
        params: {
          kelas_id: `eq.${selectedAnak?.kelas_id}`,
          select: 'jadwal_id,hari,ruangan,mata_pelajaran(nama_mapel)'
        }
      });
      return res.data || [];
    },
    enabled: !!selectedAnak?.kelas_id
  });

  // 4. Fetch Kalender Akademik
  const { data: kalenderEvents } = useQuery({
    queryKey: ['dash3-kalender'],
    staleTime: 10 * 60 * 1000, // 10 menit
    queryFn: async () => {
      const res = await restClient.get('/kalender_akademik', {
        params: {
          select: 'kalender_id,nama_kegiatan,kategori,tanggal_mulai,tanggal_berakhir,lembaga_id'
        }
      });
      return res.data || [];
    }
  });

  // 5. Fetch Absensi
  const { data: absensiList } = useQuery({
    queryKey: ['dash3-absensi', selectedAnak?.siswa_id],
    staleTime: 60 * 1000, // 1 menit
    queryFn: async () => {
      const res = await restClient.get('/absensi_pelajaran', {
        params: {
          siswa_id: `eq.${selectedAnak?.siswa_id}`,
          select: 'absensi_pel_id,status,jurnal_id,jurnal:jurnal_id(tanggal)'
        }
      });
      return res.data || [];
    },
    enabled: !!selectedAnak?.siswa_id
  });

  // ==========================================
  // 🌟 DUMMY DATA PREVIEW MODE
  // ==========================================
  const isDummyPreview = false; // Ubah ke false untuk mematikan mode dummy

  const dummyAnak = [
    { siswa_id: 991, nama: 'Budi Santoso', kelas_id: 101, kelas: { nama_kelas: '10 MIPA 1', lembaga: { nama_lembaga: 'SMA Maskumambang' } } },
    { siswa_id: 992, nama: 'Siti Aminah', kelas_id: 102, kelas: { nama_kelas: '11 IPS 2', lembaga: { nama_lembaga: 'SMA Maskumambang' } } }
  ];

  const dummyJadwal = Array.from({ length: 12 }).map((_, i) => {
    const jamMulai = 7 + Math.floor(i * 1.5);
    const jamSelesai = jamMulai + 1;
    return {
      jadwal_id: i + 1,
      jam_mulai: `${jamMulai.toString().padStart(2, '0')}:00:00`,
      jam_selesai: `${jamSelesai.toString().padStart(2, '0')}:30:00`,
      hari: 'Senin',
      mapel_id: 10 + i,
      mata_pelajaran: { nama_mapel: `Mata Pelajaran Dummy ${i + 1}` }
    };
  });

  const dummyKalender = Array.from({ length: 10 }).map((_, i) => ({
    kalender_id: i + 1,
    tanggal_mulai: new Date(new Date().getFullYear(), new Date().getMonth() + Math.floor(i / 2), 10 + (i % 5) * 3).toISOString(),
    nama_kegiatan: `Agenda Kegiatan Dummy Ke-${i + 1}`,
    deskripsi: 'Deskripsi kegiatan yang sangat penting untuk diikuti oleh seluruh siswa dan wali murid.'
  }));

  // Generate 70 dummy absensi (Campuran Hadir, Sakit, Izin, Alpha) untuk 3 bulan terakhir
  const generateDummyAbsensi = () => {
    const list = [];
    const statuses = ['Hadir', 'Hadir', 'Hadir', 'Hadir', 'Hadir', 'Hadir', 'Hadir', 'Hadir', 'Sakit', 'Izin', 'Alpha'];
    const now = new Date();
    for (let i = 0; i < 70; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      list.push({
        status: statuses[Math.floor(Math.random() * statuses.length)],
        jurnal: { tanggal: d.toISOString() }
      });
    }
    return list;
  };

  const finalAnakList = isDummyPreview ? dummyAnak : anakList;
  const finalJadwal = isDummyPreview ? dummyJadwal : jadwalHariIni;
  const finalKalender = isDummyPreview ? dummyKalender : kalenderEvents;
  const finalAbsensi = isDummyPreview ? generateDummyAbsensi() : absensiList;

  // Timpa selected anak dari dummy jika mode preview aktif
  const activeSelectedAnak = isDummyPreview
    ? dummyAnak.find(a => a.siswa_id === selectedSiswaId) || null
    : anakList?.find((a: any) => a.siswa_id === selectedSiswaId) || null;

  // Hitung jumlah absensi keseluruhan
  const safeAbsensi = finalAbsensi || [];
  const countAbsensi = (status: string) => safeAbsensi.filter((a: any) => a.status === status || a.status_kehadiran === status).length;

  const hadir = countAbsensi("Hadir");
  const sakit = countAbsensi("Sakit");
  const izin = countAbsensi("Izin");
  const alpha = countAbsensi("Alpha");
  const dispen = countAbsensi("Dispen");

  const totalAbsensi = hadir + sakit + izin + alpha + dispen;
  const persentaseHadir = totalAbsensi === 0 ? 0 : Math.round((hadir / totalAbsensi) * 100);

  // Rekap Laporan Bulanan (3 Bulan Terakhir)
  const monthlyRecap = safeAbsensi.reduce((acc: any, curr: any) => {
    // Ambil tanggal dari jurnal_mengajar, jika tidak ada pakai waktu saat ini
    const dateStr = curr.jurnal?.tanggal || curr.waktu_kehadiran || new Date().toISOString();
    let date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      date = new Date();
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;

    if (!acc[monthKey]) {
      const monthNum = (date.getMonth() + 1).toString().padStart(2, '0');
      acc[monthKey] = { hadir: 0, absen: 0, total: 0, sortKey: `${date.getFullYear()}-${monthNum}` };
    }

    acc[monthKey].total += 1;
    if (curr.status === 'Hadir' || curr.status_kehadiran === 'Hadir') {
      acc[monthKey].hadir += 1;
    } else {
      acc[monthKey].absen += 1;
    }

    return acc;
  }, {});

  const recentMonths = Object.entries(monthlyRecap)
    .map(([month, stats]: [string, any]) => ({ month, ...stats }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(-3); // Ambil 3 bulan terakhir

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full pb-10">

      {/* Seksi 1: Daftar Anak */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 px-1">Anak Anda</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!finalAnakList ? (
            <div className="col-span-full p-4 bg-gray-50 text-gray-500 rounded-xl border border-gray-100 text-sm animate-pulse h-24"></div>
          ) : finalAnakList.length === 0 ? (
            <div className="col-span-full p-4 bg-gray-50 text-gray-500 rounded-xl border border-gray-100 text-sm">
              Belum ada data anak yang tertaut dengan akun Anda.
            </div>
          ) : (
            finalAnakList.map((anak: any) => {
              const isSelected = selectedSiswaId === anak.siswa_id;

              return (
                <div
                  key={anak.siswa_id}
                  onClick={() => setSelectedSiswaId(anak.siswa_id)}
                  className={`rounded-2xl p-5 shadow-sm relative overflow-hidden flex items-center gap-4 cursor-pointer transition-all ${isSelected
                    ? "bg-linear-to-r from-blue-600 to-blue-800 text-white ring-2 ring-offset-2 ring-blue-500 shadow-lg scale-[1.02]"
                    : "bg-white text-gray-700 border border-gray-100 hover:bg-gray-50 hover:border-blue-200"
                    }`}
                >
                  {isSelected && <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3"></div>}

                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${isSelected ? "bg-white/20 backdrop-blur-sm border border-white/30" : "bg-blue-50 text-blue-500"
                    }`}>
                    <User size={24} className={isSelected ? "text-white" : ""} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isSelected ? "" : "text-gray-800"}`}>{anak.nama || 'Nama Tidak Diketahui'}</h3>
                    <p className={`text-xs mt-1 flex flex-wrap gap-1 ${isSelected ? "text-blue-100" : "text-gray-500"}`}>
                      <span className={`px-2 py-0.5 rounded-md ${isSelected ? "bg-blue-500/50" : "bg-gray-100"}`}>
                        {anak.kelas?.nama_kelas || `Kelas ID: ${anak.kelas_id}`}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {activeSelectedAnak && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">

          {/* --- BARIS 1 --- */}
          {/* Kolom Kiri: Statistik Kehadiran */}
          <div className="xl:col-span-2 flex">
            <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden w-full flex flex-col">
              <CardHeader className="pb-4 border-b border-gray-50 bg-white shrink-0">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium flex items-center gap-2 text-gray-800">
                    <FileText size={20} className="text-blue-500" />
                    Statistik Kehadiran ({activeSelectedAnak.nama})
                  </CardTitle>
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 text-blue-700">
                    <TrendingUp size={16} />
                    <span className="text-sm font-bold">{persentaseHadir}% Hadir</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pb-10 bg-linear-to-b from-white to-gray-50/50 flex-1 flex flex-col justify-center">
                {/* Progress Bar Persentase */}
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Progres Kehadiran Semester Ini</span>
                    <span className="font-bold text-gray-900">{hadir} dari {totalAbsensi} Pertemuan</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200/50">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                      style={{ width: `${persentaseHadir}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20"></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl p-4 text-center border border-emerald-100 shadow-sm shadow-emerald-100/50 hover:shadow-md transition-shadow">
                    <p className="text-3xl font-bold text-emerald-600">{hadir}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600/80 mt-1">Hadir</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center border border-amber-100 shadow-sm shadow-amber-100/50 hover:shadow-md transition-shadow">
                    <p className="text-3xl font-bold text-amber-500">{sakit}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-600/80 mt-1">Sakit</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center border border-blue-100 shadow-sm shadow-blue-100/50 hover:shadow-md transition-shadow">
                    <p className="text-3xl font-bold text-blue-500">{izin}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600/80 mt-1">Izin</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center border border-red-100 shadow-sm shadow-red-100/50 hover:shadow-md transition-shadow">
                    <p className="text-3xl font-bold text-red-500">{alpha}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-red-600/80 mt-1">Alpha</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kolom Kanan: Jadwal Pelajaran */}
          <div className="xl:col-span-1 xl:relative">
            <div className="xl:absolute xl:inset-0 h-87.5 xl:h-auto">
              <Card className="border-gray-100 shadow-sm rounded-2xl h-full flex flex-col">
                <CardHeader className="pb-4 border-b border-gray-50 bg-white shrink-0">
                  <CardTitle className="text-lg font-medium flex items-center gap-2 text-gray-800">
                    <Clock size={20} className="text-indigo-500" />
                    Jadwal Pelajaran
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                  <div className="divide-y divide-gray-50 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                    {!finalJadwal && !isDummyPreview ? (
                      <div className="p-6 text-center text-sm text-gray-400 h-full flex items-center justify-center">Memuat jadwal...</div>
                    ) : finalJadwal.length === 0 ? (
                      <div className="p-6 text-center flex flex-col items-center justify-center text-gray-500 h-full">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                          <CheckCircle2 size={24} className="text-emerald-400" />
                        </div>
                        <p className="text-sm font-medium">Tidak ada jadwal hari ini</p>
                        <p className="text-xs text-gray-400 mt-1">Anak Anda sedang libur</p>
                      </div>
                    ) : (
                      finalJadwal.map((jadwal: any, index: number) => {
                        const colors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500"];
                        const color = colors[index % colors.length];
                        return (
                          <div key={jadwal.jadwal_id || index} className="flex items-center p-4 hover:bg-gray-50/80 transition-colors">
                            <div className="w-14 shrink-0 text-center">
                              <p className="text-sm font-bold text-gray-800">{jadwal.jam_mulai ? jadwal.jam_mulai.slice(0, 5) : '07:00'}</p>
                              <p className="text-[10px] text-gray-500">{jadwal.jam_selesai ? jadwal.jam_selesai.slice(0, 5) : '08:30'}</p>
                            </div>
                            <div className={`w-1 h-10 ${color} rounded-full mx-4 opacity-80`}></div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{jadwal.mata_pelajaran?.nama_mapel || `Pelajaran ID: ${jadwal.mapel_id}`}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">Hari: {jadwal.hari}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* --- BARIS 2 --- */}
          {/* Kolom Kiri: Rekap Laporan Bulanan */}
          <div className="xl:col-span-2 flex">
            <Card className="border-gray-100 shadow-sm rounded-2xl w-full flex flex-col">
              <CardHeader className="pb-4 border-b border-gray-50 shrink-0">
                <CardTitle className="text-lg font-medium flex items-center gap-2 text-gray-800">
                  <FileText size={20} className="text-indigo-500" />
                  Rekap Laporan Bulanan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 pb-5 flex-1">
                <div className="divide-y divide-gray-50">
                  {recentMonths.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">Belum ada data absensi untuk direkap.</div>
                  ) : (
                    recentMonths.map((stat: any, idx: number) => {
                      const perc = stat.total === 0 ? 0 : Math.round((stat.hadir / stat.total) * 100);
                      return (
                        <div key={idx} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm border border-indigo-100">
                              {stat.month.split(' ')[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{stat.month}</p>
                              <p className="text-xs text-gray-500 mt-1">{stat.total} Total Pertemuan</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-800">{stat.hadir} Hadir / {stat.absen} Absen</p>
                            <p className={`text-xs mt-1 font-semibold ${perc >= 80 ? 'text-emerald-500' : perc >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                              {perc}% Kehadiran
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kolom Kanan: Agenda Terdekat */}
          <div className="xl:col-span-1 xl:relative">
            <div className="xl:absolute xl:inset-0 h-87.5 xl:h-auto">
              <Card className="border-gray-100 shadow-sm rounded-2xl h-full flex flex-col">
                <CardHeader className="pb-4 border-b border-gray-50 bg-white shrink-0">
                  <CardTitle className="text-lg font-medium flex items-center gap-2 text-gray-800">
                    <CalendarDays size={20} className="text-emerald-500" />
                    Agenda Terdekat
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                  <div className="p-4 space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {!finalKalender && !isDummyPreview ? (
                      <div className="text-center py-4 text-sm text-gray-400 h-full flex items-center justify-center">Memuat agenda...</div>
                    ) : finalKalender.length === 0 ? (
                      <div className="text-center py-6 text-sm text-gray-500 h-full flex items-center justify-center">Tidak ada agenda akademik terdekat.</div>
                    ) : (
                      finalKalender.map((event: any, idx: number) => (
                        <div key={event.kalender_id || idx} className="flex gap-4 items-center group">
                          <div className="flex flex-col items-center justify-center w-12 h-12 bg-emerald-50 rounded-xl shrink-0 border border-emerald-100/50 group-hover:bg-emerald-100 transition-colors">
                            <span className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
                              {event.tanggal_mulai ? new Date(event.tanggal_mulai).toLocaleString('id', { month: 'short' }) : 'AGS'}
                            </span>
                            <span className="text-lg font-black text-emerald-700 leading-none mt-0.5">
                              {event.tanggal_mulai ? new Date(event.tanggal_mulai).getDate() : '17'}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">{event.nama_kegiatan || 'Kegiatan Akademik'}</h4>
                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{event.deskripsi || 'Tidak ada keterangan detail.'}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
