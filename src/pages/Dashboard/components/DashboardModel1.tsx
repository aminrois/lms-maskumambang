import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useDynamicQuickMenu } from "@/hooks/useDynamicQuickMenu";
import {
  Users, GraduationCap, Building2, BookOpen
} from "lucide-react";
import { restClient } from "@/lib/api/axios";
import { useFeatureRealtimeSync } from "@/hooks/useRealtimeSync";

export default function DashboardModel1() {
  const navigate = useNavigate();
  const quickMenu = useDynamicQuickMenu(8); // limit 8 items

  useFeatureRealtimeSync("MASTER_DATA_PEGAWAI");
  useFeatureRealtimeSync("MASTER_DATA_SISWA");
  useFeatureRealtimeSync("MASTER_DATA_LEMBAGA");
  useFeatureRealtimeSync("MASTER_DATA_KELAS");

  // Helper untuk mendapatkan count langsung dari Supabase tanpa load data 100%
  const fetchCount = async (endpoint: string, params: object = {}) => {
    const res = await restClient.get(endpoint, {
      params: { ...params, limit: 1 },
      headers: { 'Prefer': 'count=exact' }
    });
    // Parse header 'content-range' misalnya "0-0/1200" -> return 1200
    const range = res.headers['content-range'];
    if (range) {
      const parts = range.split('/');
      if (parts.length === 2) {
        return parseInt(parts[1], 10);
      }
    }
    return 0;
  };

  const { data: totalGuru = 0 } = useQuery({
    queryKey: ['dash-guru-count'],
    queryFn: () => fetchCount('/pegawai'),
  });

  const { data: totalSiswa = 0 } = useQuery({
    queryKey: ['dash-siswa-count'],
    queryFn: () => fetchCount('/siswa'),
  });

  const { data: totalLembaga = 0 } = useQuery({
    queryKey: ['dash-lembaga-count'],
    queryFn: () => fetchCount('/lembaga'),
  });

  const { data: totalKelas = 0 } = useQuery({
    queryKey: ['dash-kelas-count'],
    queryFn: () => fetchCount('/kelas'),
  });

  const { data: totalJadwal = 0 } = useQuery({
    queryKey: ['dash-jadwal-count'],
    queryFn: () => fetchCount('/jadwal_pelajaran'),
  });

  const { data: totalKalender = 0 } = useQuery({
    queryKey: ['dash-kalender-count'],
    queryFn: () => fetchCount('/kalender_akademik'),
  });

  const { data: pendingActivityPlan = 0 } = useQuery({
    queryKey: ['dash-activity-count'],
    queryFn: () => fetchCount('/activity_plan', { status_verifikasi: "eq.Menunggu Verifikasi" }),
  });

  const summary = {
    totalGuru,
    totalSiswa,
    totalLembaga,
    totalKelas,
    totalJadwal,
    totalKalender,
    pendingActivityPlan,
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-blue-50 text-blue-600 rounded-lg md:rounded-xl">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[11px] md:text-sm text-gray-500 font-medium leading-tight mb-0.5">Total Pegawai</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 leading-none">{summary.totalGuru}</p>
              <p className="text-[10px] md:text-xs text-gray-400 mt-1 hidden md:block">Aktif mengajar</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-amber-50 text-amber-500 rounded-lg md:rounded-xl">
              <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[11px] md:text-sm text-gray-500 font-medium leading-tight mb-0.5">Total Siswa</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 leading-none">{summary.totalSiswa}</p>
              <p className="text-[10px] md:text-xs text-gray-400 mt-1 hidden md:block">{summary.totalLembaga} lembaga</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-emerald-50 text-emerald-500 rounded-lg md:rounded-xl">
              <Building2 className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[11px] md:text-sm text-gray-500 font-medium leading-tight mb-0.5">Total Lembaga</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 leading-none">{summary.totalLembaga}</p>
              <p className="text-[10px] md:text-xs text-gray-400 mt-1 hidden md:block">Lembaga aktif</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-purple-50 text-purple-600 rounded-lg md:rounded-xl">
              <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[11px] md:text-sm text-gray-500 font-medium leading-tight mb-0.5">Total Kelas</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 leading-none">{summary.totalKelas}</p>
              <p className="text-[10px] md:text-xs text-gray-400 mt-1 hidden md:block">Aktif sekarang</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium flex items-center gap-2 text-gray-700">
            Menu Cepat
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickMenu.map((item, idx) => {
              // Fallback color scheme mapping
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
                  className="flex flex-col items-center justify-center text-center p-3 md:p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors shadow-sm hover:shadow-md bg-white group gap-2 md:gap-3"
                >
                  <div className={`p-3 rounded-xl group-hover:text-white transition-colors ${colorClass}`}>
                    <item.icon size={24} />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-gray-700 leading-tight">{item.name}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
