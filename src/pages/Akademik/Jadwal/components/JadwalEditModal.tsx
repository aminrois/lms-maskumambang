import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle, ArrowRightLeft, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMataPelajarans, updateJadwalPelajaran } from "@/lib/api/services/akademikService";
import { getPegawais } from "@/lib/api/services/masterService";
import { getLessonPlans, deleteLessonPlan, updateLessonPlan } from "@/lib/api/services/kbmService";
import { toast } from "sonner";
import type { JadwalRow } from "../hooks/useJadwalAkademik";

interface JadwalEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedData: JadwalRow | null;
  allJadwalData: JadwalRow[];
}

type ConflictInfo = {
  slot: JadwalRow;          // slot lama yang bentrok
  targetSlot: JadwalRow;    // slot baru yang akan diisi
};

const isCountedCategory = (tipe?: string): boolean => {
  if (!tipe) return true;
  return tipe.trim().toLowerCase() === "belajar";
};

export const JadwalEditModal: React.FC<JadwalEditModalProps> = ({
  open,
  onOpenChange,
  selectedData,
  allJadwalData,
}) => {
  const queryClient = useQueryClient();

  // "null" (string) = user sengaja kosongkan; "" = belum dipilih
  const [formData, setFormData] = useState({
    mapel_id: "",
    pegawai_id: "",
    ruangan: "",
  });

  const [isAdvanced, setIsAdvanced] = useState(false);
  const [targetEndJadwalId, setTargetEndJadwalId] = useState<string>("");

  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [overwriteSlots, setOverwriteSlots] = useState<JadwalRow[]>([]);
  const [pendingTargetSlots, setPendingTargetSlots] = useState<JadwalRow[]>([]);

  // State untuk dialog bentrok guru (Sonar-style)
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [pendingConflictTargetSlots, setPendingConflictTargetSlots] = useState<JadwalRow[]>([]);

  // Simpan formData saat sub-dialog dibuka agar tidak hilang ketika dialog utama ditutup sementara
  const [savedFormData, setSavedFormData] = useState<typeof formData | null>(null);

  // Kumpulan slot di hari & kelas yang sama, diurutkan secara kronologis berdasarkan waktu
  const daySlots = useMemo(() => {
    if (!selectedData) return [];
    return allJadwalData
      .filter(
        (j) =>
          j.hari === selectedData.hari &&
          j.kelas_id === selectedData.kelas_id
      )
      .sort((a, b) => {
        const timeA = a.jam_mulai?.jam_mulai || "";
        const timeB = b.jam_mulai?.jam_mulai || "";
        if (timeA && timeB) return timeA.localeCompare(timeB);
        return (a.jam_mulai?.urutan_jam ?? 0) - (b.jam_mulai?.urutan_jam ?? 0);
      });
  }, [selectedData, allJadwalData]);

  // Mapping urutan jam pelajaran berurutan per harinya khusus untuk kategori Belajar
  const slotJamNumberMap = useMemo(() => {
    if (!selectedData) return new Map<number, number | null>();
    const map = new Map<number, number | null>();
    let jamCounter = 0;
    daySlots.forEach((slot) => {
      const tipe = slot.jam_mulai?.tipe || "";
      if (isCountedCategory(tipe)) {
        jamCounter += 1;
        map.set(slot.jadwal_id, jamCounter);
      } else {
        map.set(slot.jadwal_id, null);
      }
    });
    return map;
  }, [selectedData, daySlots]);

  const getJamLabel = (slot: JadwalRow | null): string => {
    if (!slot) return "";
    const jamNum = slotJamNumberMap.get(slot.jadwal_id);
    if (jamNum !== null && jamNum !== undefined) {
      return `Jam ${jamNum}`;
    }
    return slot.jam_mulai?.tipe || "Sesi Khusus";
  };

  // Query mata pelajaran
  const { data: mapelList = [], isLoading: isLoadingMapel } = useQuery<any[]>({
    queryKey: ['master-data', 'mapel-options'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const response = await getMataPelajarans({
        select: "mapel_id,nama_mapel,lembaga_id",
        order: "nama_mapel.asc"
      });
      return (response as any) || [];
    },
    enabled: open,
  });

  // Query semua pegawai beserta relasi lembaga
  const { data: pegawaiList = [], isLoading: isLoadingPegawai } = useQuery({
    queryKey: ['master-data', 'pegawai-options-with-lembaga'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const response = await getPegawais({
        select: "pegawai_id,nama,pegawai_lembaga(lembaga_id)",
        order: "nama.asc"
      });
      return response || [];
    },
    enabled: open,
  });

  // Filter mapel by lembaga_id of the class
  const filteredMapel = selectedData?.kelas?.lembaga_id
    ? mapelList.filter((m: any) => m.lembaga_id === selectedData.kelas?.lembaga_id)
    : mapelList;

  // Filter pegawai: tampilkan semua pegawai yang tertaut ke lembaga kelas tersebut (tanpa filter role Guru)
  const filteredPegawai = useMemo(() => {
    const targetLembagaId = selectedData?.kelas?.lembaga_id;
    return pegawaiList.filter((p: any) => {
      if (selectedData?.pegawai_id && Number(p.pegawai_id) === Number(selectedData.pegawai_id)) {
        return true;
      }

      if (targetLembagaId) {
        if (p.pegawai_lembaga && Array.isArray(p.pegawai_lembaga)) {
          return p.pegawai_lembaga.some((pl: any) => Number(pl.lembaga_id) === Number(targetLembagaId));
        }
        return false;
      }

      return true;
    });
  }, [pegawaiList, selectedData]);

  // Reset form saat selectedData berubah
  useEffect(() => {
    if (selectedData) {
      setFormData({
        mapel_id: selectedData.mapel_id ? String(selectedData.mapel_id) : "",
        pegawai_id: selectedData.pegawai_id ? String(selectedData.pegawai_id) : "",
        ruangan: selectedData.ruangan ? String(selectedData.ruangan) : "",
      });
      setIsAdvanced(false);
      setTargetEndJadwalId("");
    }
  }, [selectedData]);

  // Reset sub-dialog state HANYA saat dialog utama dibuka (bukan saat ditutup)
  useEffect(() => {
    if (open) {
      setShowConflictDialog(false);
      setConflicts([]);
      setShowOverwriteConfirm(false);
      setSavedFormData(null);
    }
  }, [open]);

  // Cari sisa jam di hari yang sama untuk opsi lanjutan (hanya slot bertipe Belajar setelah slot terpilih)
  const subsequentSlots = useMemo(() => {
    if (!selectedData) return [];
    const selectedIndex = daySlots.findIndex((j) => j.jadwal_id === selectedData.jadwal_id);
    if (selectedIndex === -1) return [];
    return daySlots.slice(selectedIndex + 1).filter((j) => isCountedCategory(j.jam_mulai?.tipe));
  }, [selectedData, daySlots]);

  // Mutation: simpan jadwal (bisa disertai clear slot lama)
  const mutation = useMutation({
    mutationFn: async ({
      targetSlots,
      conflictTransfers,
    }: {
      targetSlots: JadwalRow[];
      conflictTransfers?: { oldSlot: JadwalRow; newSlot: JadwalRow }[];
    }) => {
      const willMapelBeNull = !formData.mapel_id || formData.mapel_id === "__null__";
      const willPegawaiBeNull = !formData.pegawai_id;

      const payload = {
        mapel_id: formData.mapel_id && formData.mapel_id !== "__null__" ? Number(formData.mapel_id) : null,
        pegawai_id: formData.pegawai_id ? Number(formData.pegawai_id) : null,
        ruangan: formData.ruangan.trim() ? formData.ruangan.trim() : null,
      };

      // 1. Jika ada transfer konflik (Pemindahan Penuh), tangani secara khusus dan hentikan alur default
      if (conflictTransfers && conflictTransfers.length > 0) {
        for (const transfer of conflictTransfers) {
          const { oldSlot, newSlot } = transfer;

          // Kosongkan slot lama sepenuhnya
          await updateJadwalPelajaran(oldSlot.jadwal_id, {
            mapel_id: null,
            pegawai_id: null,
            ruangan: null,
          });

          // Isi slot baru dengan konten dari slot lama
          await updateJadwalPelajaran(newSlot.jadwal_id, {
            mapel_id: oldSlot.mapel_id,
            pegawai_id: oldSlot.pegawai_id,
            ruangan: oldSlot.ruangan,
          });

          // Cari lesson plan yang terhubung dengan jadwal_id lama
          const linkedPlans = await getLessonPlans({
            jadwal_id: `eq.${oldSlot.jadwal_id}`,
            select: "lesson_plan_id,jadwal_id"
          });

          // Pindahkan semua lesson plan tersebut ke jadwal_id yang baru
          if (linkedPlans.length > 0) {
            for (const lp of linkedPlans) {
              await updateLessonPlan(lp.lesson_plan_id, {
                jadwal_id: newSlot.jadwal_id,
              });
            }
          }
        }
        return; // Hentikan eksekusi setelah transfer penuh selesai
      }

      // 2. Isi slot baru (alur normal non-konflik)
      await Promise.all(targetSlots.map((slot) =>
        updateJadwalPelajaran(slot.jadwal_id, payload)
      ));

      // 3. Jika mapel DAN pegawai dikosongkan, tangani lesson plan yang terhubung
      if (willMapelBeNull && willPegawaiBeNull) {
        for (const slot of targetSlots) {
          // Simpan mapel dan pegawai asli dari slot sebelum dikosongkan
          const originalMapelId = slot.mapel_id;
          const originalPegawaiId = slot.pegawai_id;

          if (!originalMapelId || !originalPegawaiId) continue;

          // Cari lesson plan yang terhubung ke slot ini
          const linkedPlans = await getLessonPlans({
            jadwal_id: `eq.${slot.jadwal_id}`,
            select: "lesson_plan_id,jadwal_id"
          });
          if (linkedPlans.length === 0) continue;

          // Cari jadwal lain (bukan slot yang dikosongkan) yang punya mapel+pegawai sama
          const targetSlotIds = new Set(targetSlots.map(s => s.jadwal_id));
          const alternativeSlot = allJadwalData.find(j =>
            !targetSlotIds.has(j.jadwal_id) &&
            j.mapel_id === originalMapelId &&
            j.pegawai_id === originalPegawaiId
          );

          for (const lp of linkedPlans) {
            if (alternativeSlot) {
              // Ada slot lain yang valid — pindahkan jadwal_id lesson plan ke sana
              await updateLessonPlan(lp.lesson_plan_id, {
                jadwal_id: alternativeSlot.jadwal_id,
              });
            } else {
              // Tidak ada slot lain — hapus lesson plan
              await deleteLessonPlan(lp.lesson_plan_id);
            }
          }
        }
      }
    },
    onSuccess: (_, { targetSlots, conflictTransfers }) => {
      if (conflictTransfers && conflictTransfers.length > 0) {
        toast.success(`Seluruh jadwal (Mata Pelajaran, Guru, Ruangan, dan RPP) berhasil dipindahkan!`);
      } else if (targetSlots.length > 1) {
        toast.success(`Berhasil memperbarui jadwal untuk ${targetSlots.length} jam pelajaran sekaligus!`);
      } else {
        toast.success("Jadwal pelajaran berhasil diperbarui!");
      }
      queryClient.invalidateQueries({ queryKey: ['akademik', 'jadwal-pelajaran'] });
      queryClient.invalidateQueries({ queryKey: ['kbm', 'lesson-plans'] });
      onOpenChange(false);
    },
    onError: (err) => {
      console.error("Gagal update jadwal:", err);
      toast.error("Gagal memperbarui jadwal pelajaran. Silakan coba lagi.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedData) return;

    // 1. Tentukan target slots (hanya slot bertipe Belajar dari slot terpilih hingga slot batas akhir)
    let targetSlots = [selectedData];
    if (isAdvanced && targetEndJadwalId) {
      const selectedIndex = daySlots.findIndex((j) => j.jadwal_id === selectedData.jadwal_id);
      const targetIndex = daySlots.findIndex((j) => j.jadwal_id === Number(targetEndJadwalId));
      if (selectedIndex !== -1 && targetIndex !== -1) {
        targetSlots = daySlots
          .slice(selectedIndex, targetIndex + 1)
          .filter((j) => isCountedCategory(j.jam_mulai?.tipe));
      }
    }

    // 2. Validasi Kategori Jam (Hanya bisa diisi jika tipe = Belajar)
    if (formData.mapel_id) {
      const nonBelajarSlots = targetSlots.filter(s => s.jam_mulai?.tipe && s.jam_mulai.tipe.toLowerCase() !== "belajar");
      if (nonBelajarSlots.length > 0) {
        const jamList = nonBelajarSlots.map(s => getJamLabel(s)).join(", ");
        toast.error(`Gagal: ${jamList} tidak bisa diisi karena merupakan kategori ${nonBelajarSlots[0].jam_mulai?.tipe} (bukan jam belajar).`);
        return;
      }
    }

    // 3. Validasi bentrok guru — kumpulkan semua bentrok
    if (formData.pegawai_id) {
      const foundConflicts: ConflictInfo[] = [];
      for (const slot of targetSlots) {
        const conflict = allJadwalData.find(j =>
          j.hari === slot.hari &&
          j.jam_mulai?.urutan_jam === slot.jam_mulai?.urutan_jam &&
          j.pegawai_id === Number(formData.pegawai_id) &&
          j.kelas_id !== slot.kelas_id
        );
        if (conflict) {
          foundConflicts.push({ slot: conflict, targetSlot: slot });
        }
      }

      if (foundConflicts.length > 0) {
        setConflicts(foundConflicts);
        setPendingConflictTargetSlots(targetSlots);
        setSavedFormData(formData);
        // Tutup dialog utama dulu agar sub-dialog bisa tampil dengan benar
        onOpenChange(false);
        setShowConflictDialog(true);
        return;
      }
    }

    // 4. Peringatan timpa jadwal — hanya jika mapel berubah (bukan hanya guru)
    const overwrittenSlots = targetSlots.filter(s =>
      s.mapel_id !== null &&
      s.mapel_id !== Number(formData.mapel_id)
    );

    if (overwrittenSlots.length > 0) {
      setOverwriteSlots(overwrittenSlots);
      setPendingTargetSlots(targetSlots);
      setSavedFormData(formData);
      // Tutup dialog utama dulu agar sub-dialog bisa tampil dengan benar
      onOpenChange(false);
      setShowOverwriteConfirm(true);
      return;
    }

    mutation.mutate({ targetSlots });
  };

  const handleConfirmOverwrite = () => {
    setShowOverwriteConfirm(false);
    setSavedFormData(null);
    mutation.mutate({ targetSlots: pendingTargetSlots });
  };


  const handleGabungKelas = async () => {
    setShowConflictDialog(false);
    setSavedFormData(null);

    // 1. Simpan jadwal baru (slot yang sedang diedit) dengan mapel + guru
    await mutation.mutateAsync({ targetSlots: pendingConflictTargetSlots });

    // 2. Update judul_rpp Lesson Plan yang terhubung dengan slot konflik
    for (const conflict of conflicts) {
      const linkedPlans = await getLessonPlans({
        jadwal_id: `eq.${conflict.slot.jadwal_id}`,
        select: "lesson_plan_id,judul_rpp"
      });

      for (const lp of linkedPlans) {
        // Ambil nama kelas baru (kelas yang sedang diedit)
        const namaKelasTarget = conflict.targetSlot.kelas?.nama_kelas || "";
        // Jangan duplikat jika sudah ada
        if (namaKelasTarget && lp.judul_rpp && !lp.judul_rpp.includes(namaKelasTarget)) {
          const newJudul = `${lp.judul_rpp}, ${namaKelasTarget}`;
          await updateLessonPlan(lp.lesson_plan_id, { judul_rpp: newJudul });
        }
      }
    }

    toast.success("Kelas berhasil digabungkan! RPP yang terkait kini berlaku untuk semua kelas paralel.");
  };

  // User memilih "Pindahkan" — transfer konten slot lama ke slot baru
  const handleMoveTeacher = () => {
    setShowConflictDialog(false);
    setSavedFormData(null);
    const conflictTransfers = conflicts.map(c => ({
      oldSlot: c.slot,
      newSlot: c.targetSlot
    }));
    mutation.mutate({ targetSlots: pendingConflictTargetSlots, conflictTransfers });
  };

  const isPending = mutation.isPending;
  const isLoading = isLoadingMapel || isLoadingPegawai;

  // Data form yang aktif: pakai savedFormData saat sub-dialog terbuka (dialog utama sudah ditutup)
  const activeFormData = savedFormData ?? formData;

  // Nama guru yang dipilih saat ini
  const selectedGuruName = useMemo(() => {
    const found = (pegawaiList as any[]).find((p: any) => String(p.pegawai_id) === activeFormData.pegawai_id);
    return found?.nama || "Guru ini";
  }, [pegawaiList, activeFormData.pegawai_id]);

  // true jika SEMUA konflik punya mapel yang sama dengan mapel yang dipilih
  const isSameMapel = conflicts.length > 0 && conflicts.every(c =>
    c.slot.mapel_id !== null &&
    String(c.slot.mapel_id) === activeFormData.mapel_id
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              Edit Detail Pelajaran
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-900" />
              <span className="ml-2 text-sm text-gray-500 font-medium">Memuat data...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              {/* Info Kelas & Jam */}
              {selectedData && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-sm text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-800">Kelas:</span>{" "}
                    {selectedData.kelas?.nama_kelas || "—"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Hari & Waktu:</span>{" "}
                    {selectedData.hari},{" "}
                    {selectedData.jam_mulai?.jam_mulai?.substring(0, 5)}–
                    {selectedData.jam_selesai?.jam_selesai?.substring(0, 5)}
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                      {getJamLabel(selectedData)}
                    </span>
                  </div>
                </div>
              )}

              {/* Mata Pelajaran Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Mata Pelajaran
                </label>
                <select
                  value={formData.mapel_id}
                  onChange={(e) =>
                    setFormData({ ...formData, mapel_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="">— Pilih Mata Pelajaran —</option>
                  {filteredMapel.map((item: any) => (
                    <option key={item.mapel_id} value={item.mapel_id}>
                      {item.nama_mapel}
                    </option>
                  ))}
                </select>
              </div>

              {/* Guru Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Guru / Pegawai Pengampu
                </label>
                <select
                  value={formData.pegawai_id}
                  onChange={(e) =>
                    setFormData({ ...formData, pegawai_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="">— Pilih Guru / Pegawai —</option>
                  {filteredPegawai.map((item: any) => (
                    <option key={item.pegawai_id} value={item.pegawai_id}>
                      {item.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ruangan Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Ruangan
                </label>
                <input
                  type="text"
                  placeholder="cth: R.101 / Lab Komputer"
                  value={formData.ruangan}
                  onChange={(e) =>
                    setFormData({ ...formData, ruangan: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                />
              </div>

              {/* Opsi Lanjutan: Terapkan ke beberapa jam */}
              {subsequentSlots.length > 0 && (
                <div className="pt-2 border-t mt-4">
                  <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={isAdvanced}
                      onChange={(e) => {
                        setIsAdvanced(e.target.checked);
                        if (!e.target.checked) setTargetEndJadwalId("");
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-indigo-700">Opsi Lanjutan: Terapkan ke beberapa jam sekaligus</span>
                  </label>

                  {isAdvanced && (
                    <div className="pl-6 space-y-2">
                      <label className="text-xs font-medium text-gray-600">
                        Terapkan jadwal ini mulai {getJamLabel(selectedData)} sampai dengan:
                      </label>
                      <select
                        required={isAdvanced}
                        value={targetEndJadwalId}
                        onChange={(e) => setTargetEndJadwalId(e.target.value)}
                        className="w-full px-3 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50 text-sm"
                      >
                        <option value="">-- Pilih batas akhir jam pelajaran --</option>
                        {subsequentSlots.map((slot) => (
                          <option key={slot.jadwal_id} value={slot.jadwal_id}>
                            {getJamLabel(slot)} ({slot.jam_mulai?.jam_mulai?.substring(0, 5)}–{slot.jam_selesai?.jam_selesai?.substring(0, 5)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="pt-4 border-t gap-2 sm:gap-0 mt-4">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  disabled={isPending}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md transition-colors"
                  disabled={isPending}
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Jadwal
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Timpa Jadwal (mapel existing) */}
      <Dialog
        open={showOverwriteConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setShowOverwriteConfirm(false);
            setSavedFormData(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              Peringatan Timpa Jadwal
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-700">
            <p className="mb-3">
              Anda akan menimpa <strong>{overwriteSlots.length} jam pelajaran</strong> yang sudah terisi:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mb-4 text-gray-600 max-h-[40vh] overflow-y-auto pr-2">
              {overwriteSlots.map(s => (
                <li key={s.jadwal_id}>
                  {getJamLabel(s)}: <span className="font-medium text-gray-800">{s.mapel?.nama_mapel || 'Mata Pelajaran'}</span>
                </li>
              ))}
            </ul>
            <p className="font-medium text-red-600/90 bg-red-50 p-2.5 rounded-lg border border-red-100">
              Apakah Anda yakin ingin melanjutkan dan menimpa jadwal tersebut?
            </p>
          </div>
          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0 mt-4">
            <button
              type="button"
              onClick={() => {
                setShowOverwriteConfirm(false);
                setSavedFormData(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmOverwrite}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              Ya, Timpa Jadwal
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Bentrok Guru — Sonar-style */}
      <Dialog
        open={showConflictDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowConflictDialog(false);
            setSavedFormData(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl bg-white p-0 overflow-hidden">
          {/* Header merah khas Sonar */}
          <div className="bg-linear-to-r from-amber-500 to-orange-500 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">
                  Bentrok Jadwal Guru!
                </h2>
                <p className="text-amber-100 text-sm mt-0.5">
                  {selectedGuruName} sudah terjadwal di kelas lain pada waktu yang sama.
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-gray-600">
              Ditemukan <strong className="text-gray-800">{conflicts.length} konflik jadwal</strong>. Berikut detail bentrokan:
            </p>

            {/* Daftar bentrok */}
            <div className="space-y-3">
              {conflicts.map((c, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-amber-200 bg-amber-50 p-3.5"
                >
                  {/* Baris: slot lama → slot baru */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 mb-2.5">
                    <span className="px-2 py-0.5 bg-amber-200 rounded-full">{getJamLabel(c.slot)}</span>
                    <span className="text-amber-500">|</span>
                    <span>{c.slot.hari}</span>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-sm">
                    {/* Jadwal lama */}
                    <div className="bg-white rounded-lg border border-amber-100 p-2.5 shadow-xs">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Jadwal Sekarang</p>
                      <p className="font-semibold text-gray-800 text-sm leading-tight">{c.slot.kelas?.nama_kelas || "?"}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.slot.kelas?.lembaga?.nama_lembaga || c.slot.kelas?.lembaga?.singkatan || "—"}</p>
                      <p className="text-xs text-blue-600 mt-1 font-medium">{c.slot.mapel?.nama_mapel || "—"}</p>
                    </div>

                    <ArrowRightLeft className="w-4 h-4 text-amber-400 shrink-0" />

                    {/* Jadwal baru */}
                    <div className="bg-white rounded-lg border border-blue-100 p-2.5 shadow-xs ring-1 ring-blue-200">
                      <p className="text-[10px] uppercase tracking-wide text-blue-400 font-semibold mb-1">Akan Dipindah ke</p>
                      <p className="font-semibold text-gray-800 text-sm leading-tight">{c.targetSlot.kelas?.nama_kelas || "?"}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.targetSlot.kelas?.lembaga?.nama_lembaga || c.targetSlot.kelas?.lembaga?.singkatan || "—"}</p>
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        {filteredMapel.find((m: any) => String(m.mapel_id) === activeFormData.mapel_id)?.nama_mapel || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Keterangan aksi */}
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3.5 text-sm text-blue-800">
              <p className="font-semibold mb-1">Jika memilih "Pindahkan Guru":</p>
              <ul className="list-disc pl-4 space-y-1 text-blue-700 text-xs">
                <li><strong>Seluruh</strong> detail pelajaran (Guru, Mata Pelajaran, Ruangan, dan Lesson Plan) akan berpindah dari jadwal sekarang ke kelas yang baru Anda pilih.</li>
                <li>Jadwal di kelas yang lama akan dikosongkan sepenuhnya.</li>
              </ul>
            </div>
            {isSameMapel && (
              <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 text-sm text-emerald-800">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Tersedia: Gabung Kelas Paralel
                </p>
                <ul className="list-disc pl-4 space-y-1 text-emerald-700 text-xs">
                  <li>Guru dan Mata Pelajaran yang dipilih <strong>sama persis</strong> dengan jadwal yang bentrok.</li>
                  <li>Pilih <strong>"Gabung Kelas"</strong> agar kedua kelas menggunakan <strong>satu RPP bersama</strong>.</li>
                  <li>Jurnal Mengajar dan Absensi tetap <strong>terpisah</strong> per kelas seperti biasa.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowConflictDialog(false);
                setSavedFormData(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isPending}
            >
              Batal
            </button>
            {isSameMapel && (
              <button
                type="button"
                onClick={handleGabungKelas}
                disabled={isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-lg transition-all shadow-md shadow-emerald-200 disabled:opacity-60"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                Gabung Kelas
              </button>
            )}
            <button
              type="button"
              onClick={handleMoveTeacher}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg transition-all shadow-md shadow-amber-200 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRightLeft className="w-4 h-4" />
              )}
              Pindahkan Guru
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
