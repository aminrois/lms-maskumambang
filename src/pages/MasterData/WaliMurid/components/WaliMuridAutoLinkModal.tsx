import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { Sparkles, Loader2, Link2, Search, Check } from "lucide-react";
import { restClient } from "../../../../lib/api/axios";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface UnlinkedSiswaItem {
  siswa_id: number;
  nis: string;
  nama: string;
  no_kk?: string;
  alamat?: string;
  kelas?: { nama_kelas: string; lembaga?: { singkatan: string } };
}

interface WaliMuridAutoLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataWali: any[];
  onRefreshData?: () => void;
}

export default function WaliMuridAutoLinkModal({
  isOpen,
  onClose,
  dataWali,
  onRefreshData,
}: WaliMuridAutoLinkModalProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [unlinkedStudents, setUnlinkedStudents] = useState<UnlinkedSiswaItem[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<Record<number, number>>({}); // siswa_id -> wali_id
  const [searchQuery, setSearchQuery] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  // Fetch unlinked students when modal opens
  React.useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchUnlinked = async () => {
      setIsLoading(true);
      try {
        const res = await restClient.get("/siswa", {
          params: {
            wali_murid_id: "is.null",
            status: "neq.Tidak Aktif",
            select: "siswa_id,nis,nama,no_kk,alamat,kelas(nama_kelas,lembaga(singkatan))",
            limit: 500,
          },
        });
        if (isMounted) {
          const list = res.data || [];
          setUnlinkedStudents(list);

          // Auto-detect matches
          const initialMap: Record<number, number> = {};
          list.forEach((s: UnlinkedSiswaItem) => {
            const match = findBestMatch(s, dataWali);
            if (match && match.confidence >= 70) {
              initialMap[s.siswa_id] = match.wali.wali_id;
            }
          });
          setSelectedMatches(initialMap);
        }
      } catch (err: any) {
        console.error("Gagal memuat siswa belum tertaut:", err);
        toast.error("Gagal memuat daftar santri belum tertaut.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUnlinked();
    return () => {
      isMounted = false;
    };
  }, [isOpen, dataWali]);

  // Scoring function to match student with wali
  const findBestMatch = (siswa: UnlinkedSiswaItem, waliList: any[]) => {
    if (!waliList || waliList.length === 0) return null;

    let bestWali: any = null;
    let highestScore = 0;
    let matchReason = "";

    const sKK = (siswa.no_kk || "").trim();
    const sNama = (siswa.nama || "").toLowerCase();

    for (const w of waliList) {
      let score = 0;
      let reason = "";

      // 1. Check if an existing child of this wali has the exact same No KK (Confirmed Sibling!)
      if (sKK && sKK.length >= 10 && w.siswa && Array.isArray(w.siswa)) {
        const hasSiblingSameKK = w.siswa.some((sib: any) => (sib.no_kk || "").trim() === sKK);
        if (hasSiblingSameKK) {
          score = 100;
          reason = "Saudara Kandung (Nomor KK sama persis)";
        }
      }

      // 2. Check NIK prefix/district match with KK
      if (score === 0 && sKK && sKK.length >= 10) {
        const wNik = (w.nik_wali || w.nik_ayah || "").trim();
        if (wNik && sKK.slice(0, 10) === wNik.slice(0, 10)) {
          score = 80;
          reason = "Kecocokan Kode Wilayah KK & NIK Orang Tua";
        }
      }

      // 3. Name similarity with Ayah/Wali
      if (score === 0) {
        const namaAyah = (w.nama_ayah || w.nama_wali || "").toLowerCase();
        if (namaAyah && namaAyah.length > 4 && sNama.includes(namaAyah)) {
          score = 75;
          reason = "Nama Ayah tertera pada nama santri";
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestWali = w;
        matchReason = reason;
      }
    }

    if (highestScore > 0) {
      return { wali: bestWali, confidence: highestScore, reason: matchReason };
    }
    return null;
  };

  // Filtered view
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return unlinkedStudents;
    const q = searchQuery.toLowerCase();
    return unlinkedStudents.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        (s.nis || "").toLowerCase().includes(q) ||
        (s.no_kk || "").includes(q)
    );
  }, [unlinkedStudents, searchQuery]);

  // Execute linking
  const handleLinkSelected = async () => {
    const entries = Object.entries(selectedMatches).filter(([_, wid]) => Boolean(wid));
    if (entries.length === 0) {
      toast.warning("Pilih setidaknya satu santri dan calon wali untuk ditautkan.");
      return;
    }

    setIsLinking(true);
    let successCount = 0;
    let failCount = 0;

    for (const [sIdStr, wId] of entries) {
      const siswaId = Number(sIdStr);
      try {
        await restClient.patch(`/siswa?siswa_id=eq.${siswaId}`, { wali_murid_id: wId });
        successCount++;
      } catch (err) {
        console.error(`Gagal tautkan siswa ${siswaId}:`, err);
        failCount++;
      }
    }

    setIsLinking(false);
    toast.success(`Berhasil menautkan ${successCount} santri ke wali murid!`);
    if (failCount > 0) {
      toast.warning(`${failCount} santri gagal ditautkan.`);
    }

    // Refresh queries
    queryClient.invalidateQueries({ queryKey: ["master-data", "siswa-all"] });
    queryClient.invalidateQueries({ queryKey: ["master-data", "wali_murid"] });
    queryClient.invalidateQueries({ queryKey: ["master-data", "wali-options"] });
    if (onRefreshData) onRefreshData();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0 border-b pb-3">
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Asisten Auto-Link: Rekonsiliasi Santri & Wali Murid
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-1">
            Fitur cerdas untuk mendeteksi dan menautkan santri yang belum memiliki wali murid berdasarkan No. KK, kesamaan NIK, atau nama keluarga.
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium">Memindai data santri dan mencocokkan ke wali murid...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
            {/* Summary card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 border rounded-lg p-3">
                <span className="text-xs text-slate-500 block">Total Santri Belum Tertaut</span>
                <span className="text-xl font-bold text-slate-800">{unlinkedStudents.length} Santri</span>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                <span className="text-xs text-indigo-600 block">Kecocokan Terdeteksi</span>
                <span className="text-xl font-bold text-indigo-900">
                  {Object.keys(selectedMatches).length} Santri
                </span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                <span className="text-xs text-emerald-600 block">Status Rekonsiliasi</span>
                <span className="text-xs font-semibold text-emerald-800 block mt-1">
                  Siap ditautkan dengan 1-klik
                </span>
              </div>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama santri, NIS, atau No. KK..."
                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Matching table */}
            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b text-slate-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-3.5 py-2.5">Santri</th>
                    <th className="px-3.5 py-2.5">No. KK / Alamat</th>
                    <th className="px-3.5 py-2.5">Calon Wali Terdeteksi</th>
                    <th className="px-3.5 py-2.5 text-center">Status / Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-600">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        Tidak ada santri yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((s) => {
                      const selectedWaliId = selectedMatches[s.siswa_id];
                      const matchedWali = selectedWaliId
                        ? dataWali.find((w: any) => w.wali_id === selectedWaliId)
                        : null;

                      return (
                        <tr key={s.siswa_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-3.5 py-2.5">
                            <p className="font-bold text-slate-900">{s.nama}</p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              NIS: {s.nis || "—"} | Kelas: {s.kelas?.nama_kelas || "—"}
                            </p>
                          </td>

                          <td className="px-3.5 py-2.5">
                            <p className="font-mono text-slate-700 font-medium">
                              {s.no_kk ? `KK: ${s.no_kk}` : "—"}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate max-w-xs">{s.alamat || "—"}</p>
                          </td>

                          <td className="px-3.5 py-2.5">
                            <select
                              value={selectedWaliId || ""}
                              onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : undefined;
                                setSelectedMatches((prev) => {
                                  const next = { ...prev };
                                  if (val) next[s.siswa_id] = val;
                                  else delete next[s.siswa_id];
                                  return next;
                                });
                              }}
                              className={`w-full max-w-xs px-2 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white ${
                                selectedWaliId ? "border-emerald-400 bg-emerald-50/30 font-medium text-emerald-950" : "border-slate-300 text-slate-500"
                              }`}
                            >
                              <option value="">-- Pilih / Tidak Ditautkan --</option>
                              {dataWali.map((w: any) => (
                                <option key={w.wali_id} value={w.wali_id}>
                                  {w.nama_wali || w.nama_ayah || w.nama_ibu} (NIK: {w.nik_wali || w.nik_ayah || "—"})
                                </option>
                              ))}
                            </select>
                            {matchedWali && (
                              <p className="text-[10px] text-emerald-700 mt-0.5">
                                Terpilih: {matchedWali.nama_wali || matchedWali.nama_ayah} (HP: {matchedWali.no_hp_wali || matchedWali.no_hp_ayah || "—"})
                              </p>
                            )}
                          </td>

                          <td className="px-3.5 py-2.5 text-center">
                            {selectedWaliId ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3" /> Siap Taut
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Belum dipilih</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter className="shrink-0 border-t pt-3 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="text-xs text-slate-500">
            {Object.keys(selectedMatches).length} santri siap ditautkan ke wali murid.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isLinking}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleLinkSelected}
              disabled={isLinking || Object.keys(selectedMatches).length === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-md transition-colors flex items-center gap-2 shadow-sm"
            >
              {isLinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
              Tautkan Sekarang ({Object.keys(selectedMatches).length})
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
