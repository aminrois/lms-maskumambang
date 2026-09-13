import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, ClipboardList, BookOpen, BarChart2, Clock
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { restClient } from "@/lib/api/axios";
import { useNavigate } from "react-router-dom";
import { useDynamicQuickMenu } from "@/hooks/useDynamicQuickMenu";
import { useFeatureRealtimeSync } from "@/hooks/useRealtimeSync";
import React from "react";


export default function DashboardModel2() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const quickMenu = useDynamicQuickMenu(6); // limit to 6 items

  useFeatureRealtimeSync("KBM_LESSON_PLAN");
  useFeatureRealtimeSync("KBM_JURNAL_MENGAJAR");

  // Fetch Pegawai info based on current user
  const { data: pegawaiData } = useQuery({
    queryKey: ['dash2-pegawai', user?.user_id],
    queryFn: async () => {
      const res = await restClient.get('/pegawai', { params: { user_id: `eq.${user?.user_id}` } });
      return res.data?.[0];
    },
    enabled: !!user?.user_id
  });

  const pegawaiId = pegawaiData?.pegawai_id;

  // Fetch Jadwal Pelajaran (Kelas Diampu, Jam Mengajar)
  const { data: jadwalData = [], isLoading: isLoadingJadwal } = useQuery({
    queryKey: ['dash2-jadwal', pegawaiId],
    queryFn: async () => {
      const res = await restClient.get('/jadwal_pelajaran', {
        params: {
          pegawai_id: `eq.${pegawaiId}`,
          select: '*, mapel:mapel_id(nama_mapel), kelas:kelas_id(nama_kelas)'
        }
      });
      return res.data || [];
    },
    enabled: !!pegawaiId
  });

  // Calculate stats
  const uniqueClasses = new Set(jadwalData.map((j: any) => j.kelas_id)).size;
  const jamMengajar = jadwalData.length * 2; // Asumsi 1 jadwal = 2 jam pelajaran
  // Asumsi rata-rata 32 siswa per kelas
  const estimasiSiswa = uniqueClasses * 32;

  // Fetch Lesson Plans for Progress
  const { data: lessonPlans = [], isLoading: isLoadingLP } = useQuery({
    queryKey: ['dash2-lessonplans', pegawaiId],
    queryFn: async () => {
      const res = await restClient.get('/lesson_plan', {
        params: {
          pegawai_id: `eq.${pegawaiId}`,
          // Hanya ambil ID dari lesson_plan_detail (sangat ringan)
          // alih-alih mengambil semua kolom (termasuk isi RPP yang panjang)
          // karena dashboard hanya butuh jumlah/length nya saja.
          select: '*, lesson_plan_detail(detail_id)'
        }
      });
      return res.data || [];
    },
    enabled: !!pegawaiId
  });

  // Fetch Jurnal Mengajar for Progress
  const jadwalIds = jadwalData.map((j: any) => j.jadwal_id).filter(Boolean);
  const { data: jurnalMengajar = [] } = useQuery({
    queryKey: ['dash2-jurnal', pegawaiId, jadwalIds.join(',')],
    queryFn: async () => {
      if (jadwalIds.length === 0) return [];
      const res = await restClient.get('/jurnal_mengajar', {
        params: {
          jadwal_id: `in.(${jadwalIds.join(',')})`,
          select: '*, jadwal_pelajaran(kelas_id, mapel_id, kelas:kelas_id(nama_kelas))'
        }
      });
      return res.data || [];
    },
    enabled: !!pegawaiId && jadwalIds.length > 0
  });

  const progressData = React.useMemo(() => {
    const progressList: any[] = [];

    lessonPlans.forEach((lp: any) => {
      const title = lp.judul_rpp || "Lesson Plan";
      const totalPertemuan = lp.lesson_plan_detail?.length || 0;

      // Cari jadwal_id yang terkait dengan lesson plan ini
      let lpJadwalIds: number[] = [];
      if (lp.jadwal_id) {
        lpJadwalIds = [lp.jadwal_id];
      } else {
        // Fallback untuk data lama tanpa jadwal_id
        const matching = jadwalData.filter((j: any) => {
          const jMapel = j.mapel?.nama_mapel || "";
          const jKelas = j.kelas?.nama_kelas || "";
          return title.toLowerCase().includes(jMapel.toLowerCase()) && 
                 title.toLowerCase().includes(jKelas.toLowerCase());
        });
        lpJadwalIds = matching.map((m: any) => m.jadwal_id);
      }

      // Hitung jurnal mengajar yang selesai untuk jadwal_id tersebut
      const completed = jurnalMengajar.filter((jm: any) => lpJadwalIds.includes(jm.jadwal_id)).length;

      let percentage = 0;
      if (totalPertemuan > 0) {
        percentage = Math.min(100, Math.round((completed / totalPertemuan) * 100));
      }

      progressList.push({
        title,
        completed,
        total: totalPertemuan,
        percentage
      });
    });

    return progressList;
  }, [jadwalData, lessonPlans, jurnalMengajar]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-blue-50 text-blue-600 rounded-lg md:rounded-xl">
              <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[11px] md:text-sm text-gray-500 font-medium leading-tight mb-0.5">Kelas Diampu</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 leading-none">
                {isLoadingJadwal ? <span className="animate-pulse text-gray-300 text-lg">...</span> : uniqueClasses}
              </p>
              <p className="text-[10px] md:text-xs text-gray-400 mt-1 hidden md:block">Mata Pelajaran</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-amber-50 text-amber-500 rounded-lg md:rounded-xl">
              <Clock className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[11px] md:text-sm text-gray-500 font-medium leading-tight mb-0.5">Jam Mengajar</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 leading-none">
                {isLoadingJadwal ? <span className="animate-pulse text-gray-300 text-lg">...</span> : jamMengajar}
              </p>
              <p className="text-[10px] md:text-xs text-gray-400 mt-1 hidden md:block">Jam per minggu</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-emerald-50 text-emerald-500 rounded-lg md:rounded-xl">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[11px] md:text-sm text-gray-500 font-medium leading-tight mb-0.5">Siswa Diampu</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 leading-none">
                {isLoadingJadwal ? <span className="animate-pulse text-gray-300 text-lg">...</span> : estimasiSiswa}
              </p>
              <p className="text-[10px] md:text-xs text-gray-400 mt-1 hidden md:block">Perkiraan total siswa</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-purple-50 text-purple-600 rounded-lg md:rounded-xl">
              <BarChart2 className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[11px] md:text-sm text-gray-500 font-medium leading-tight mb-0.5">Lesson Plan</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 leading-none">
                {isLoadingLP ? <span className="animate-pulse text-gray-300 text-lg">...</span> : lessonPlans.length}
              </p>
              <p className="text-[10px] md:text-xs text-gray-400 mt-1 hidden md:block">Tahun Ajaran Ini</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-50">
              <CardTitle className="text-lg font-medium flex items-center gap-2 text-gray-700">
                <ClipboardList size={20} className="text-gray-500" />
                Progress Lesson Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {progressData.length === 0 ? (
                  <div className="text-center text-gray-500 py-6 text-sm">Belum ada data yang tersedia. Pastikan lesson plan dan jadwal mengajar sudah diisi.</div>
                ) : (
                  progressData.map((prog: any, idx: number) => {
                    let colorClass = "bg-blue-600";
                    let textClass = "text-blue-600";
                    if (prog.percentage >= 100) {
                      colorClass = "bg-emerald-500";
                      textClass = "text-emerald-500";
                    } else if (prog.percentage < 50) {
                      colorClass = "bg-amber-500";
                      textClass = "text-amber-500";
                    }

                    return (
                      <div key={idx}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">{prog.title}</span>
                          <span className={`text-xs font-bold ${textClass}`}>{prog.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${prog.percentage}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {prog.percentage >= 100
                            ? "Seluruh pertemuan telah diselesaikan"
                            : `${prog.completed} dari ${prog.total} pertemuan telah dilaksanakan`}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-50">
              <CardTitle className="text-lg font-medium flex items-center gap-2 text-gray-700">
                Menu Cepat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {quickMenu.map((item, idx) => {
                  const colorClass = {
                    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600",
                    amber: "bg-amber-50 text-amber-500 group-hover:bg-amber-500",
                    emerald: "bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500",
                    purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-600",
                    rose: "bg-rose-50 text-rose-500 group-hover:bg-rose-500",
                    cyan: "bg-cyan-50 text-cyan-500 group-hover:bg-cyan-500",
                    indigo: "bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500",
                    orange: "bg-orange-50 text-orange-500 group-hover:bg-orange-500",
                    teal: "bg-teal-50 text-teal-500 group-hover:bg-teal-500",
                    sky: "bg-sky-50 text-sky-500 group-hover:bg-sky-500",
                    violet: "bg-violet-50 text-violet-500 group-hover:bg-violet-500",
                    fuchsia: "bg-fuchsia-50 text-fuchsia-500 group-hover:bg-fuchsia-500",
                    pink: "bg-pink-50 text-pink-500 group-hover:bg-pink-500"
                  }[item.color || "blue"] || "bg-blue-50 text-blue-600 group-hover:bg-blue-600";

                  return (
                    <div
                      key={idx}
                      onClick={() => navigate(item.path)}
                      className="flex flex-col items-center justify-center text-center p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors bg-white group gap-2 shadow-sm hover:shadow-md"
                    >
                      <div className={`p-2.5 rounded-xl group-hover:text-white transition-colors ${colorClass}`}>
                        <item.icon size={20} />
                      </div>
                      <span className="text-[11px] md:text-xs font-medium text-gray-700 leading-tight">{item.name}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
