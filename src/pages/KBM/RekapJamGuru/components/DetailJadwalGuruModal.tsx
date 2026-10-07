import { 
  X, School, Calendar, MapPin, Download 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { utils, writeFile } from "xlsx";
import type { GuruJamRekap } from "../hooks/useRekapJamGuru";

interface DetailJadwalGuruModalProps {
  isOpen: boolean;
  onClose: () => void;
  guru: GuruJamRekap | null;
  lembagas: any[];
}

export function DetailJadwalGuruModal({
  isOpen,
  onClose,
  guru,
  lembagas,
}: DetailJadwalGuruModalProps) {
  if (!isOpen || !guru) return null;

  const handleExportSingleGuru = () => {
    const exportData = guru.jadwals.map((j, idx) => ({
      "No": idx + 1,
      "Lembaga": j.singkatan_lembaga,
      "Kelas": j.nama_kelas,
      "Mata Pelajaran": j.nama_mapel,
      "Hari": j.hari,
      "Jam Ke-": `${j.urutan_jam_mulai} - ${j.urutan_jam_selesai}`,
      "Waktu": `${j.jam_mulai_display} - ${j.jam_selesai_display}`,
      "Beban Jam (JP)": j.jp,
      "Ruangan": j.ruangan || "-",
    }));

    const worksheet = utils.json_to_sheet(exportData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, `Jadwal_${guru.nama_guru.substring(0, 20)}`);
    writeFile(
      workbook,
      `Jadwal_Mengajar_${guru.nama_guru.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header Modal */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white flex items-center justify-between relative">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/30">
                Rincian Jadwal Mengajar
              </span>
              <span className="text-xs text-slate-300 font-mono">
                NIP: {guru.nip !== "—" ? guru.nip : "Non-NIP"}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">{guru.nama_guru}</h2>
            <p className="text-xs text-slate-300">
              Total Beban: <strong className="text-emerald-400 font-bold text-sm">{guru.total_jp} JP</strong> ({guru.total_kelas} Kelas • {guru.total_mapel} Mapel)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSingleGuru}
              className="rounded-xl border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs h-9 font-medium"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Ekspor
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lembaga Breakdown Pills */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Beban Per Lembaga:
          </span>
          {lembagas.map((lem) => {
            const jp = guru.jam_per_lembaga[lem.lembaga_id] || 0;
            if (jp === 0) return null;
            return (
              <div
                key={lem.lembaga_id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs font-semibold text-slate-700"
              >
                <School className="w-3.5 h-3.5 text-blue-600" />
                <span>{lem.singkatan || lem.nama_lembaga}:</span>
                <span className="text-blue-700 font-bold">{jp} JP</span>
              </div>
            );
          })}
        </div>

        {/* Table Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {guru.jadwals.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">Belum ada sesi jadwal mengajar yang terhubung.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-center w-10">No</th>
                    <th className="px-4 py-3">Lembaga</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3">Mata Pelajaran</th>
                    <th className="px-4 py-3">Hari & Jam</th>
                    <th className="px-4 py-3 text-center">Beban (JP)</th>
                    <th className="px-4 py-3">Ruangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {guru.jadwals.map((j, idx) => (
                    <tr key={j.jadwal_id ?? idx} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-bold">
                          {j.singkatan_lembaga}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        <div>{j.nama_kelas}</div>
                        {j.is_paralel && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                            Paralel ({j.jumlah_kelas_paralel} Kelas)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{j.nama_mapel}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{j.hari}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Jam ke-{j.urutan_jam_mulai} s/d {j.urutan_jam_selesai} ({j.jam_mulai_display} - {j.jam_selesai_display})
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-100">
                          {j.jp} JP
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {j.ruangan ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" /> {j.ruangan}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            Total {guru.jadwals.length} sesi pertemuan mengajar terdaftar di sistem.
          </span>
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-slate-200 text-slate-700 bg-white"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
