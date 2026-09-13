import { useAuthStore } from "@/store/useAuthStore";
import DashboardModel1 from "./components/DashboardModel1";
import DashboardModel2 from "./components/DashboardModel2";
import { LayoutDashboard } from "lucide-react";

export default function Dashboard() {
  const userRole = useAuthStore(state => state.role) || '';

  // Kelompokkan role sesuai model berdasarkan SRS
  const model1Roles = ['Super Admin', 'Direktur', 'Admin Lembaga'];
  const model2Roles = ['Kepala Sekolah', 'WaKa Kurikulum', 'Guru', 'Wali Kelas'];
  const renderDashboard = () => {
    if (model1Roles.includes(userRole)) {
      return <DashboardModel1 />;
    }

    if (model2Roles.includes(userRole)) {
      return <DashboardModel2 />;
    }


    // Default fallback jika role tidak dikenali atau kosong
    return <DashboardModel1 />;
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 relative">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
          <LayoutDashboard className="w-6 h-6 text-[#243B7A]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#2B3674] uppercase">Dashboard</h1>
          <p className="text-[#A3AED0] text-sm mt-1">Sistem Informasi Akademik Pesantren Maskumambang</p>
        </div>
      </div>

      {/* Konten Dashboard berdasarkan Role */}
      {renderDashboard()}
    </div>
  );
}
