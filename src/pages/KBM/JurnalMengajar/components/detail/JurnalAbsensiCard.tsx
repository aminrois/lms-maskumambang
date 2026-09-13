import { UserCheck, Edit, Loader2, Check, FileText, AlertTriangle, X } from "lucide-react";

interface JurnalAbsensiCardProps {
  canUpdate: boolean;
  isAbsensiLoading: boolean;
  absensi: any[];
  onUpdateAbsensi: () => void;
}

export function getAbsensiBadge(status: string) {
  switch (status) {
    case "Hadir":
      return <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-green-200"><Check className="w-3 h-3" /> Hadir</span>;
    case "Izin":
      return <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-blue-200"><FileText className="w-3 h-3" /> Izin</span>;
    case "Sakit":
      return <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-amber-200"><AlertTriangle className="w-3 h-3" /> Sakit</span>;
    case "Alpa":
      return <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-red-200"><X className="w-3 h-3" /> Alpa</span>;
    default:
      return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-slate-200">{status}</span>;
  }
}

export function JurnalAbsensiCard({
  canUpdate,
  isAbsensiLoading,
  absensi,
  onUpdateAbsensi
}: JurnalAbsensiCardProps) {
  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Daftar Presensi Siswa
          </h3>
          <p className="text-xs text-slate-400 mt-1">Status kehadiran siswa pada pertemuan ini</p>
        </div>
        {canUpdate && (
          <button
            onClick={onUpdateAbsensi}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl transition-colors border border-blue-100"
          >
            <Edit className="w-4 h-4" />
            Perbarui Absensi
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-655">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-bold">No</th>
              <th className="px-6 py-4 font-bold">Siswa</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isAbsensiLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                </td>
              </tr>
            ) : absensi.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">
                  Belum ada data absensi untuk pertemuan ini.
                </td>
              </tr>
            ) : (
              absensi.map((ab: any, idx: number) => (
                <tr key={ab.absensi_pel_id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-6 py-4 text-slate-400 font-bold">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{ab.siswa?.nama}</div>
                    <div className="text-xs text-slate-400 font-semibold">{ab.siswa?.nis}</div>
                  </td>
                  <td className="px-6 py-4">
                    {getAbsensiBadge(ab.status)}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {ab.keterangan || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
