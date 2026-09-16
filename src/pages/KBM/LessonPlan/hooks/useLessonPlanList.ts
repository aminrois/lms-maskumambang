import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  getLessonPlans,
  getLessonPlanDetails,
  createLessonPlanDetail,
  updateLessonPlanDetail,
  deleteLessonPlan,
  verifyLessonPlanKepsek,
  verifyLessonPlanDirektur,
  verifyLessonPlanDetailKepsek,
  verifyLessonPlanDetailDirektur,
  bulkVerifyLessonPlans,
  resetVerificationLessonPlans,
  deleteJurnalMengajarByDetailIds
} from "@/lib/api/services/kbmService";
import { restClient } from "@/lib/api/axios";
import { getPegawais } from "@/lib/api/services/masterService";
import { getMataPelajarans, getAllJadwalPelajarans } from "@/lib/api/services/akademikService";
import type { LESSON_PLAN, LESSON_PLAN_DETAIL, PEGAWAI } from "@/types/database";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/store/useAuthStore";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export type LessonPlanSummary = LESSON_PLAN & {
  nama_guru?: string;
  nama_mapel?: string;
  detail_count: number;
  details: LESSON_PLAN_DETAIL[];
  status_ringkas: "Menunggu Verifikasi" | "Menunggu Verifikasi Kepsek" | "Menunggu Verifikasi Direktur" | "Disetujui" | "Revisi Kepsek" | "Revisi Direktur";
};

export const resolveDetailStatus = (
  detail?: Partial<LESSON_PLAN_DETAIL> | null
): "Disetujui" | "Menunggu Verifikasi Kepsek" | "Menunggu Verifikasi Direktur" | "Revisi Kepsek" | "Revisi Direktur" => {
  if (!detail) return "Menunggu Verifikasi Kepsek";

  if (
    detail.status_verifikasi_kepsek === "Disetujui" &&
    detail.status_verifikasi_direktur === "Disetujui"
  ) {
    return "Disetujui";
  }

  if (detail.status_verifikasi_kepsek === "Revisi") {
    return "Revisi Kepsek";
  }

  if (detail.status_verifikasi_direktur === "Revisi") {
    return "Revisi Direktur";
  }

  if (detail.status_verifikasi_kepsek !== "Disetujui") {
    return "Menunggu Verifikasi Kepsek";
  }

  if (detail.status_verifikasi_direktur !== "Disetujui") {
    return "Menunggu Verifikasi Direktur";
  }

  return "Menunggu Verifikasi Kepsek";
};

export const resolveStatus = (
  plan: LESSON_PLAN & { details?: LESSON_PLAN_DETAIL[] }
): LessonPlanSummary["status_ringkas"] => {
  const details = plan.details || [];
  if (details.length === 0) {
    if (
      plan.status_verifikasi_kepsek === "Disetujui" &&
      plan.status_verifikasi_direktur === "Disetujui"
    ) {
      return "Disetujui";
    }
    if (plan.status_verifikasi_kepsek === "Revisi") return "Revisi Kepsek";
    if (plan.status_verifikasi_direktur === "Revisi") return "Revisi Direktur";
    if (plan.status_verifikasi_kepsek !== "Disetujui") return "Menunggu Verifikasi Kepsek";
    if (plan.status_verifikasi_direktur !== "Disetujui") return "Menunggu Verifikasi Direktur";
    return "Menunggu Verifikasi Kepsek";
  }

  if (details.some((d) => d.status_verifikasi_kepsek === "Revisi")) {
    return "Revisi Kepsek";
  }

  if (details.some((d) => d.status_verifikasi_direktur === "Revisi")) {
    return "Revisi Direktur";
  }

  const allApproved =
    details.length >= 16 &&
    details.every(
      (d) =>
        d.status_verifikasi_kepsek === "Disetujui" &&
        d.status_verifikasi_direktur === "Disetujui"
    );
  if (allApproved) {
    return "Disetujui";
  }

  const allKepsekApproved =
    details.length >= 16 &&
    details.every((d) => d.status_verifikasi_kepsek === "Disetujui");
  if (allKepsekApproved) {
    return "Menunggu Verifikasi Direktur";
  }

  return "Menunggu Verifikasi Kepsek";
};

const QUERY_KEY = ["kbm", "lesson-plans"] as const;

export function useLessonPlanList() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("Semua");
  const tabs = ["Semua", "Disetujui", "Menunggu Verifikasi", "Revisi"];

  const { canCreate, canUpdate, canDelete, canVerify } = usePermissions("lesson_plan");
  const role = useAuthStore(state => state.role);
  const pegawai_id = useAuthStore(state => state.user?.pegawai_id);
  const lembaga_id = useAuthStore(state => state.lembaga_id);
  const isReadOnlyRole = role === 'Kepala Sekolah' || role === 'WaKa Kurikulum' || role === 'Direktur';
  const finalCanCreate = canCreate && !isReadOnlyRole;
  const finalCanUpdate = canUpdate && !isReadOnlyRole;
  const finalCanDelete = canDelete && !isReadOnlyRole;

  // Realtime: invalidate query saat ada perubahan di tabel lesson_plan, lesson_plan_detail, atau jadwal_pelajaran
  useRealtimeSync([
    { table: "lesson_plan", queryKeys: [Array.from(QUERY_KEY)] },
    { table: "lesson_plan_detail", queryKeys: [Array.from(QUERY_KEY)] },
    { table: "jadwal_pelajaran", queryKeys: [Array.from(QUERY_KEY)] },
  ]);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [expandedPlans, setExpandedPlans] = useState<number[]>([]);

  const toggleExpand = (id: number) => {
    setExpandedPlans(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const [selectedPlan, setSelectedPlan] = useState<LessonPlanSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isRevisiModalOpen, setIsRevisiModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isApproveAllModalOpen, setIsApproveAllModalOpen] = useState(false);
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [revisiNote, setRevisiNote] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Verifikasi Per-Pertemuan
  const [selectedDetailForVerify, setSelectedDetailForVerify] = useState<{ plan: LessonPlanSummary; detail: LESSON_PLAN_DETAIL } | null>(null);
  const [isDetailApproveModalOpen, setIsDetailApproveModalOpen] = useState(false);
  const [isDetailRevisiModalOpen, setIsDetailRevisiModalOpen] = useState(false);
  const [detailRevisiNote, setDetailRevisiNote] = useState("");
  const [isVerifyingDetail, setIsVerifyingDetail] = useState(false);

  // Fetch dengan React Query supaya bisa di-invalidate oleh useRealtimeSync
  const { data: lessonPlans = [], isLoading } = useQuery({
    queryKey: Array.from(QUERY_KEY),
    queryFn: async () => {
      const planParams: Record<string, any> = { order: "lesson_plan_id.desc" };
      if ((role === 'Guru' || role === 'Wali Kelas') && pegawai_id) {
        planParams.pegawai_id = `eq.${pegawai_id}`;
      }

      // Step 1: Ambil plans + data referensi secara paralel (tanpa details dulu)
      const [plans, pegawais, mapels, jadwals, kelasAll] = await Promise.all([
        getLessonPlans(planParams),
        getPegawais({ select: "pegawai_id,nama" }),
        getMataPelajarans({ select: "mapel_id,nama_mapel,lembaga_id" }),
        getAllJadwalPelajarans({ select: "jadwal_id,kelas_id" }),
        restClient.get('/kelas', { params: { select: 'kelas_id,lembaga_id' } }).then((r: any) => r.data || []),
      ]);

      // Step 2: Fetch details HANYA untuk plan_ids yang ditemukan (bukan seluruh tabel)
      let allDetails: any[] = [];
      if (plans.length > 0) {
        const planIds = plans.map((p: LESSON_PLAN) => p.lesson_plan_id).join(',');
        allDetails = await getLessonPlanDetails({
          lesson_plan_id: `in.(${planIds})`,
          order: "pertemuan_ke.asc",
        });
      }

      const detailsByPlanId = allDetails.reduce<Record<number, any[]>>((acc, detail) => {
        if (!acc[detail.lesson_plan_id]) acc[detail.lesson_plan_id] = [];
        acc[detail.lesson_plan_id].push(detail);
        return acc;
      }, {});

      const guruMap = new Map(pegawais.map((item: PEGAWAI) => [item.pegawai_id, item.nama]));
      const mapelLembagaMap = new Map(mapels.map((item: any) => [item.mapel_id, item.lembaga_id]));

      // Build jadwal_id → lembaga_id via kelas (jalur yang sama dengan Satuan Pendidikan di edit page)
      const kelasToLembagaMap = new Map<number, number>();
      kelasAll.forEach((k: any) => kelasToLembagaMap.set(k.kelas_id, k.lembaga_id));
      const jadwalToLembagaMap = new Map<number, number>();
      jadwals.forEach((j: any) => {
        const lmb = kelasToLembagaMap.get(j.kelas_id);
        if (lmb !== undefined) jadwalToLembagaMap.set(j.jadwal_id, lmb);
      });

      const extractMapelFromJudul = (judul?: string, fallback?: string) => {
        if (!judul) return fallback || "";
        const parts = judul.split(/\s+[-–]\s+/);
        return parts[0] || fallback || "";
      };

      let nextRows: LessonPlanSummary[] = plans.map((plan: LESSON_PLAN) => {
        const planDetails = detailsByPlanId[plan.lesson_plan_id] || [];

        return {
          ...plan,
          nama_guru: guruMap.get(plan.pegawai_id),
          nama_mapel: extractMapelFromJudul(plan.judul_rpp, "Mata Pelajaran"),
          detail_count: planDetails.length,
          details: planDetails,
          status_ringkas: resolveStatus({ ...plan, details: planDetails }),
        };
      });

      // Filter berdasarkan lembaga: gunakan jalur jadwal_id → kelas → lembaga_id
      // agar konsisten dengan Satuan Pendidikan yang ditampilkan di halaman edit pertemuan.
      // Berlaku untuk semua role yang memiliki lembaga_id (kecuali Direktur & Super Admin).
      // Filter berdasarkan lembaga: gunakan jalur jadwal_id → kelas → lembaga_id
      // agar konsisten dengan Satuan Pendidikan yang ditampilkan di halaman edit pertemuan.
      // Berlaku untuk semua role yang memiliki lembaga_id (kecuali Direktur & Super Admin).
      const rolesFilterByLembaga = ['Kepala Sekolah', 'WaKa Kurikulum', 'Guru', 'Wali Kelas'];
      if (lembaga_id && rolesFilterByLembaga.includes(role ?? '')) {
        nextRows = nextRows.filter((plan) => {
          const jadwalId = (plan as any).jadwal_id;
          if (!jadwalId) {
            // Fallback: gunakan lembaga dari mapel_id jika tidak ada jadwal_id
            const mapelId = (plan as any).mapel_id;
            return mapelId ? mapelLembagaMap.get(mapelId) === lembaga_id : false;
          }
          return jadwalToLembagaMap.get(jadwalId) === lembaga_id;
        });
      }

      // Deduplikasi baris: jika ada lebih dari 1 RPP dengan guru, jadwal, dan judul yang sama,
      // prioritaskan yang berstatus disetujui / memiliki detail pertemuan terbanyak.
      const dedupMap = new Map<string, LessonPlanSummary>();
      for (const row of nextRows) {
        const normJudul = (row.judul_rpp || "").trim().toLowerCase();
        const key = `${row.pegawai_id}_${row.jadwal_id || 'null'}_${normJudul}`;
        const existing = dedupMap.get(key);
        if (!existing) {
          dedupMap.set(key, row);
        } else {
          const scoreRow = (row.status_verifikasi_direktur === 'Disetujui' ? 4 : 0) +
                           (row.status_verifikasi_kepsek === 'Disetujui' ? 2 : 0) +
                           ((row.details?.length || 0) > 0 ? 1 : 0);
          const scoreExisting = (existing.status_verifikasi_direktur === 'Disetujui' ? 4 : 0) +
                                (existing.status_verifikasi_kepsek === 'Disetujui' ? 2 : 0) +
                                ((existing.details?.length || 0) > 0 ? 1 : 0);
          if (scoreRow > scoreExisting) {
            dedupMap.set(key, row);
          }
        }
      }
      nextRows = Array.from(dedupMap.values());

      return nextRows;
    }
  });

  const handleVerifyAction = (plan: LessonPlanSummary, action: "Disetujui" | "Revisi") => {
    setSelectedPlan(plan);
    if (action === "Revisi") {
      setRevisiNote("");
      setIsRevisiModalOpen(true);
    } else {
      setIsApproveModalOpen(true);
    }
  };

  const executeVerify = async (action: "Disetujui" | "Revisi") => {
    if (!selectedPlan) return;
    setIsVerifying(true);
    try {
      if (role === "Kepala Sekolah") {
        await verifyLessonPlanKepsek({
          p_lesson_plan_id: selectedPlan.lesson_plan_id,
          p_action: action,
          p_catatan_revisi: action === "Revisi" ? revisiNote : "",
        });
      } else if (role === "Direktur") {
        await verifyLessonPlanDirektur({
          p_lesson_plan_id: selectedPlan.lesson_plan_id,
          p_action: action,
          p_catatan_revisi: action === "Revisi" ? revisiNote : "",
        });
      }

      if (action === "Disetujui") {
        toast.success("RPP dan seluruh pertemuannya telah disetujui.");
        setIsApproveModalOpen(false);
      } else {
        toast.info("RPP dikembalikan untuk direvisi.");
        setIsRevisiModalOpen(false);
      }

      queryClient.invalidateQueries({ queryKey: Array.from(QUERY_KEY) });
    } catch (error) {
      console.error(error);
      toast.error("Gagal memproses verifikasi. Silakan coba lagi.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyDetailAction = (plan: LessonPlanSummary, detail: LESSON_PLAN_DETAIL, action: "Disetujui" | "Revisi") => {
    setSelectedDetailForVerify({ plan, detail });
    if (action === "Revisi") {
      const existingNote = role === "Direktur" ? detail.catatan_revisi_direktur : detail.catatan_revisi_kepsek;
      setDetailRevisiNote(existingNote || "");
      setIsDetailRevisiModalOpen(true);
    } else {
      setIsDetailApproveModalOpen(true);
    }
  };

  const executeVerifyDetail = async (action: "Disetujui" | "Revisi") => {
    if (!selectedDetailForVerify) return;
    const { plan, detail } = selectedDetailForVerify;

    setIsVerifyingDetail(true);
    try {
      let detailId = detail.detail_id;
      if (!detailId || detailId === 0) {
        const created = await createLessonPlanDetail({
          lesson_plan_id: plan.lesson_plan_id,
          pertemuan_ke: detail.pertemuan_ke,
          materi: detail.materi || "",
          topik_materi: detail.topik_materi || "",
          rencana_pelaksanaan_kbm: detail.rencana_pelaksanaan_kbm || null,
          isi: detail.isi || null,
          status_verifikasi_kepsek: role === "Kepala Sekolah" ? action : "Menunggu Verifikasi",
          catatan_revisi_kepsek: role === "Kepala Sekolah" && action === "Revisi" ? detailRevisiNote : "",
          status_verifikasi_direktur: role === "Direktur" ? action : "Menunggu Verifikasi",
          catatan_revisi_direktur: role === "Direktur" && action === "Revisi" ? detailRevisiNote : "",
          verified_by_kepsek: role === "Kepala Sekolah" ? (pegawai_id || null) : null,
          verified_by_direktur: role === "Direktur" ? (pegawai_id || null) : null,
        });
        detailId = created.detail_id;
      } else {
        if (role === "Kepala Sekolah") {
          await verifyLessonPlanDetailKepsek({
            p_detail_id: detailId,
            p_action: action,
            p_catatan_revisi: action === "Revisi" ? detailRevisiNote : "",
            p_verified_by: pegawai_id,
          });
        } else if (role === "Direktur" || role === "Super Admin") {
          await verifyLessonPlanDetailDirektur({
            p_detail_id: detailId,
            p_action: action,
            p_catatan_revisi: action === "Revisi" ? detailRevisiNote : "",
            p_verified_by: pegawai_id,
          });
        }
      }

      if (action === "Disetujui") {
        toast.success(`Pertemuan Ke-${detail.pertemuan_ke} telah disetujui.`);
        setIsDetailApproveModalOpen(false);
      } else {
        toast.info(`Pertemuan Ke-${detail.pertemuan_ke} dikembalikan untuk direvisi.`);
        setIsDetailRevisiModalOpen(false);
      }

      queryClient.invalidateQueries({ queryKey: Array.from(QUERY_KEY) });
    } catch (error) {
      console.error(error);
      toast.error("Gagal memproses verifikasi pertemuan. Silakan coba lagi.");
    } finally {
      setIsVerifyingDetail(false);
    }
  };

  const [isResetVerifikasiModalOpen, setIsResetVerifikasiModalOpen] = useState(false);
  const [isResettingVerifikasi, setIsResettingVerifikasi] = useState(false);

  const eligiblePlansToApprove = useMemo(() => {
    if (!canVerify) return [];
    return lessonPlans.filter((plan) => {
      if (role === "Kepala Sekolah") {
        return plan.status_verifikasi_kepsek !== "Disetujui";
      }
      if (role === "Direktur" || role === "Super Admin") {
        return plan.status_verifikasi_direktur !== "Disetujui" || plan.status_verifikasi_kepsek !== "Disetujui";
      }
      return false;
    });
  }, [canVerify, role, lessonPlans]);

  const handleOpenSetujuiSemua = () => {
    if (eligiblePlansToApprove.length === 0) {
      toast.info("Seluruh Lesson Plan (RPP) sudah berstatus Disetujui.");
      return;
    }
    setIsApproveAllModalOpen(true);
  };

  const executeVerifyAll = async () => {
    if (eligiblePlansToApprove.length === 0) return;
    setIsApprovingAll(true);
    try {
      const planIds = eligiblePlansToApprove.map(p => p.lesson_plan_id);
      const res = await bulkVerifyLessonPlans({
        role: role || undefined,
        lembaga_id: role === "Kepala Sekolah" ? (lembaga_id || null) : null,
        lesson_plan_ids: planIds,
      });

      toast.success(res.message || `Berhasil menyetujui ${planIds.length} Lesson Plan beserta seluruh pertemuannya!`);
      queryClient.invalidateQueries({ queryKey: Array.from(QUERY_KEY) });
      setIsApproveAllModalOpen(false);
    } catch (error: any) {
      console.error("Gagal menyetujui semua RPP:", error);
      const msg = error?.response?.data?.error || error?.message || "Gagal memproses persetujuan massal. Silakan coba lagi.";
      toast.error(msg);
    } finally {
      setIsApprovingAll(false);
    }
  };

  const executeResetVerifikasi = async (target: 'kepsek' | 'direktur' | 'both', pin: string) => {
    setIsResettingVerifikasi(true);
    try {
      const res = await resetVerificationLessonPlans({
        pin,
        target,
        lembaga_id: lembaga_id || null,
      });

      toast.success(res.message || "Reset verifikasi Lesson Plan berhasil!");
      queryClient.invalidateQueries({ queryKey: Array.from(QUERY_KEY) });
      setIsResetVerifikasiModalOpen(false);
    } catch (error: any) {
      console.error("Gagal reset verifikasi RPP:", error);
      const msg = error?.response?.data?.error || error?.message || "Gagal melakukan reset verifikasi. Pastikan PIN benar.";
      toast.error(msg);
      throw error;
    } finally {
      setIsResettingVerifikasi(false);
    }
  };

  const confirmDelete = (plan: LessonPlanSummary) => {
    setSelectedPlan(plan);
    setIsDeleteOpen(true);
  };

  const executeDelete = async () => {
    if (!selectedPlan) return;
    setIsDeleting(true);
    try {
      const detailIds = (selectedPlan.details || []).map((d: any) => d.detail_id).filter(Boolean);

      if (detailIds.length > 0) {
        await deleteJurnalMengajarByDetailIds(detailIds);
      }

      await deleteLessonPlan(selectedPlan.lesson_plan_id);
      toast.success("Lesson Plan dan Jurnal terkait berhasil dihapus!");

      // Invalidate agar data ter-refresh via React Query
      queryClient.invalidateQueries({ queryKey: Array.from(QUERY_KEY) });
      setIsDeleteOpen(false);
      setSelectedPlan(null);
    } catch (err: any) {
      console.error(err);
      toast.error("RPP gagal dihapus. Silakan coba lagi.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = (plan: LessonPlanSummary) => {
    const exportData = plan.details && plan.details.length > 0 ? plan.details.map(d => ({
      "Pertemuan Ke": d.pertemuan_ke,
      "Materi": d.materi || "",
      "Sub-Topik": d.topik_materi || "",
      "Rencana Pelaksanaan KBM": d.rencana_pelaksanaan_kbm || "",
      "Dokumen RPP (Isi)": d.isi || "",
    })) : [{
      "Pertemuan Ke": 1,
      "Materi": "",
      "Sub-Topik": "",
      "Rencana Pelaksanaan KBM": "",
      "Dokumen RPP (Isi)": "",
    }];

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Lesson Plan");
    XLSX.writeFile(wb, `RPP_${plan.judul_rpp.replace(/\s+/g, "_")}.xlsx`);
  };

  const [isImporting, setIsImporting] = useState(false);
  const [planToImport, setPlanToImport] = useState<LessonPlanSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = (plan: LessonPlanSummary) => {
    setPlanToImport(plan);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const processImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !planToImport) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target?.result as ArrayBuffer;
        const wb = XLSX.read(arrayBuffer, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        if (data.length === 0) {
          toast.error("File Excel kosong.");
          setIsImporting(false);
          return;
        }

        const existingDetails = await getLessonPlanDetails({ "lesson_plan_id": `eq.${planToImport.lesson_plan_id}` });

        for (const row of data) {
          const pertemuanKe = parseInt(row["Pertemuan Ke"]);
          if (isNaN(pertemuanKe) || pertemuanKe <= 0) continue;

          const materi = row["Materi"] ? String(row["Materi"]).trim() : "";
          const topikMateri = row["Sub-Topik"] ? String(row["Sub-Topik"]).trim() : "";
          const rencana = row["Rencana Pelaksanaan KBM"] ? String(row["Rencana Pelaksanaan KBM"]).trim() : "";
          const isi = row["Dokumen RPP (Isi)"] ? String(row["Dokumen RPP (Isi)"]).trim() : "";

          const detail = existingDetails.find(d => d.pertemuan_ke === pertemuanKe);
          
          if (detail) {
            await updateLessonPlanDetail(detail.detail_id, {
              materi: materi,
              topik_materi: topikMateri,
              rencana_pelaksanaan_kbm: rencana || null,
              isi: isi || null,
              status_verifikasi_kepsek: "Menunggu Verifikasi",
              verified_by_kepsek: null,
              catatan_revisi_kepsek: "",
              status_verifikasi_direktur: "Menunggu Verifikasi",
              verified_by_direktur: null,
              catatan_revisi_direktur: "",
            });
          } else {
            await createLessonPlanDetail({
              lesson_plan_id: planToImport.lesson_plan_id,
              pertemuan_ke: pertemuanKe,
              materi: materi,
              topik_materi: topikMateri,
              rencana_pelaksanaan_kbm: rencana || null,
              isi: isi || null,
              status_verifikasi_kepsek: "Menunggu Verifikasi",
              verified_by_kepsek: null,
              catatan_revisi_kepsek: "",
              status_verifikasi_direktur: "Menunggu Verifikasi",
              verified_by_direktur: null,
              catatan_revisi_direktur: "",
            });
          }
        }
        
        toast.success(`Berhasil mengimpor detail pertemuan RPP!`);
        queryClient.invalidateQueries({ queryKey: Array.from(QUERY_KEY) });
      } catch (error: any) {
        toast.error("Gagal mengimpor data. Pastikan format file Excel valid.");
        console.error(error);
      } finally {
        setIsImporting(false);
        setPlanToImport(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Pagination state
  const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [kelasFilter, setKelasFilter] = useState("Semua Kelas");
  const [mapelFilter, setMapelFilter] = useState("Semua Mapel");
  const [pertemuanFilter, setPertemuanFilter] = useState<number | null>(null);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  // Opsi unik untuk filter Kelas & Mapel
  const kelasOptions = useMemo(() => {
    const set = new Set<string>();
    lessonPlans.forEach((plan) => {
      const namaKelas = plan.judul_rpp?.split(/\s+[-–]\s+/)?.[1];
      if (namaKelas) set.add(namaKelas.trim());
    });
    return Array.from(set).sort();
  }, [lessonPlans]);

  const mapelOptions = useMemo(() => {
    const set = new Set<string>();
    lessonPlans.forEach((plan) => {
      const namaMapel = plan.nama_mapel || plan.judul_rpp?.split(/\s+[-–]\s+/)?.[0];
      if (namaMapel) set.add(namaMapel.trim());
    });
    return Array.from(set).sort();
  }, [lessonPlans]);

  const executeKirimVerifikasi = async (plan: LessonPlanSummary) => {
    setIsSendingVerification(true);
    try {
      // Alur sekuensial: kirim/kirim-ulang selalu mulai dari Kepala Sekolah terlebih dahulu.
      await restClient.patch(`/lesson_plan?lesson_plan_id=eq.${plan.lesson_plan_id}`, {
        status_verifikasi_kepsek: "Menunggu Verifikasi",
        status_verifikasi_direktur: "Menunggu Verifikasi",
        catatan_revisi_kepsek: "",
        catatan_revisi_direktur: "",
      });
      await restClient.patch(`/lesson_plan_detail?lesson_plan_id=eq.${plan.lesson_plan_id}`, {
        status_verifikasi_kepsek: "Menunggu Verifikasi",
        status_verifikasi_direktur: "Menunggu Verifikasi",
        catatan_revisi_kepsek: "",
        catatan_revisi_direktur: "",
      });
      toast.success(`RPP "${plan.judul_rpp}" berhasil dikirim untuk verifikasi ke Kepala Sekolah!`);
      queryClient.invalidateQueries({ queryKey: Array.from(QUERY_KEY) });
    } catch (error: any) {
      console.error("Gagal mengirim verifikasi:", error);
      toast.error("Gagal mengirim RPP untuk verifikasi. Silakan coba lagi.");
    } finally {
      setIsSendingVerification(false);
    }
  };

  const filteredLessonPlans = useMemo(() => {
    const list = lessonPlans.filter((plan) => {
      // Jika Filter Pertemuan aktif (contoh: Pertemuan 1)
      if (pertemuanFilter !== null) {
        const targetDetail = (plan.details || []).find((d) => d.pertemuan_ke === pertemuanFilter) || {
          status_verifikasi_kepsek: plan.status_verifikasi_kepsek || "Menunggu Verifikasi",
          status_verifikasi_direktur: plan.status_verifikasi_direktur || "Menunggu Verifikasi",
        };
        const dtStatus = resolveDetailStatus(targetDetail);

        // Filter Status Tab untuk pertemuan terpilih
        if (activeTab === "Menunggu Verifikasi" && !dtStatus.startsWith("Menunggu")) {
          return false;
        }
        if (activeTab === "Revisi" && !dtStatus.startsWith("Revisi")) {
          return false;
        }
        if (activeTab === "Disetujui" && dtStatus !== "Disetujui") {
          return false;
        }
      } else {
        // Filter Status Tab untuk keseluruhan RPP
        if (activeTab === "Menunggu Verifikasi" && !plan.status_ringkas?.startsWith("Menunggu")) {
          return false;
        }
        if (activeTab === "Revisi" && !plan.status_ringkas?.startsWith("Revisi")) {
          return false;
        }
        if (activeTab !== "Semua" && activeTab !== "Menunggu Verifikasi" && activeTab !== "Revisi" && plan.status_ringkas !== activeTab) {
          return false;
        }
      }

      // Filter Kelas
      const namaKelas = plan.judul_rpp?.split(/\s+[-–]\s+/)?.[1] || "";
      if (kelasFilter !== "Semua Kelas" && !namaKelas.includes(kelasFilter)) {
        return false;
      }

      // Filter Mapel
      const namaMapel = plan.nama_mapel || plan.judul_rpp?.split(/\s+[-–]\s+/)?.[0] || "";
      if (mapelFilter !== "Semua Mapel" && namaMapel !== mapelFilter) {
        return false;
      }

      // Filter Search Query
      if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase().trim();
        const matchTitle = plan.judul_rpp?.toLowerCase().includes(query);
        const matchGuru = plan.nama_guru?.toLowerCase().includes(query);
        const matchMapel = namaMapel.toLowerCase().includes(query);
        const matchKelas = namaKelas.toLowerCase().includes(query);
        if (!matchTitle && !matchGuru && !matchMapel && !matchKelas) {
          return false;
        }
      }

      return true;
    });

    // PENGURUTAN PRIORITAS:
    // Untuk role Kepala Sekolah, Direktur, dan Super Admin, letakkan yang membutuhkan verifikasi di urutan paling atas.
    return [...list].sort((a, b) => {
      const getPriority = (plan: LessonPlanSummary) => {
        const details = plan.details || [];

        // Jika Filter Pertemuan aktif, prioritas ditentukan oleh status pertemuan tersebut
        if (pertemuanFilter !== null) {
          const detail = details.find((d) => d.pertemuan_ke === pertemuanFilter) || {
            status_verifikasi_kepsek: plan.status_verifikasi_kepsek || "Menunggu Verifikasi",
            status_verifikasi_direktur: plan.status_verifikasi_direktur || "Menunggu Verifikasi",
          };

          if (role === "Kepala Sekolah") {
            const needsVerify = detail.status_verifikasi_kepsek !== "Disetujui" && detail.status_verifikasi_kepsek !== "Revisi";
            if (needsVerify) return 1;
            if (detail.status_verifikasi_kepsek === "Revisi") return 2;
            return 3;
          }

          if (role === "Direktur") {
            const needsVerify =
              detail.status_verifikasi_kepsek === "Disetujui" &&
              detail.status_verifikasi_direktur !== "Disetujui" &&
              detail.status_verifikasi_direktur !== "Revisi";
            if (needsVerify) return 1;
            if (detail.status_verifikasi_direktur === "Revisi") return 2;
            return 3;
          }

          if (role === "Super Admin") {
            const needsVerify =
              (detail.status_verifikasi_kepsek !== "Disetujui" && detail.status_verifikasi_kepsek !== "Revisi") ||
              (detail.status_verifikasi_kepsek === "Disetujui" && detail.status_verifikasi_direktur !== "Disetujui" && detail.status_verifikasi_direktur !== "Revisi");
            if (needsVerify) return 1;
            return 2;
          }

          return 2;
        }

        // Mode Semua Pertemuan
        if (role === "Kepala Sekolah") {
          const needsVerify =
            details.some((d) => d.status_verifikasi_kepsek !== "Disetujui" && d.status_verifikasi_kepsek !== "Revisi") ||
            (plan.status_verifikasi_kepsek !== "Disetujui" && plan.status_verifikasi_kepsek !== "Revisi");
          if (needsVerify) return 1;

          const hasRevisi =
            details.some((d) => d.status_verifikasi_kepsek === "Revisi") ||
            plan.status_verifikasi_kepsek === "Revisi";
          if (hasRevisi) return 2;

          return 3;
        }

        if (role === "Direktur") {
          const needsVerify =
            details.some((d) => d.status_verifikasi_kepsek === "Disetujui" && d.status_verifikasi_direktur !== "Disetujui" && d.status_verifikasi_direktur !== "Revisi") ||
            (plan.status_verifikasi_kepsek === "Disetujui" && plan.status_verifikasi_direktur !== "Disetujui" && plan.status_verifikasi_direktur !== "Revisi");
          if (needsVerify) return 1;

          const hasRevisi =
            details.some((d) => d.status_verifikasi_direktur === "Revisi") ||
            plan.status_verifikasi_direktur === "Revisi";
          if (hasRevisi) return 2;

          return 3;
        }

        if (role === "Super Admin") {
          const needsVerify = details.some(
            (d) =>
              (d.status_verifikasi_kepsek !== "Disetujui" && d.status_verifikasi_kepsek !== "Revisi") ||
              (d.status_verifikasi_kepsek === "Disetujui" && d.status_verifikasi_direktur !== "Disetujui" && d.status_verifikasi_direktur !== "Revisi")
          );
          if (needsVerify) return 1;
          return 2;
        }

        return 2;
      };

      const priorityA = getPriority(a);
      const priorityB = getPriority(b);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Urutan sekunder: ID terbaru di atas
      return b.lesson_plan_id - a.lesson_plan_id;
    });
  }, [activeTab, kelasFilter, mapelFilter, pertemuanFilter, debouncedSearchQuery, lessonPlans, role]);

  // Reset ke halaman 1 setiap kali filter / search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, kelasFilter, mapelFilter, pertemuanFilter, debouncedSearchQuery]);

  // Slice untuk halaman saat ini
  const totalPages = Math.max(1, Math.ceil(filteredLessonPlans.length / pageSize));
  const paginatedLessonPlans = filteredLessonPlans.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const [isPertemuanModalOpen, setIsPertemuanModalOpen] = useState(false);
  const [selectedPertemuan, setSelectedPertemuan] = useState<any | null>(null);
  const [selectedPlanForPertemuan, setSelectedPlanForPertemuan] = useState<LessonPlanSummary | null>(null);
  const [isSavingPertemuan, setIsSavingPertemuan] = useState(false);

  // Query info tambahan untuk Lembaga & Tahun Ajaran
  const { data: activeTahunAjaran } = useQuery({
    queryKey: ['master-data', 'tahun-ajaran-active'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const res = await restClient.get('/tahun_ajaran', {
        params: { is_active: 'eq.true', limit: 1 }
      });
      return res.data?.[0] || null;
    }
  });

  const { data: lembagaMap = new Map() } = useQuery({
    queryKey: ['master-data', 'lembaga-map'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const res = await restClient.get('/lembaga', {
        params: { select: 'lembaga_id,nama_lembaga' }
      });
      const map = new Map<number, string>();
      (res.data || []).forEach((item: any) => map.set(item.lembaga_id, item.nama_lembaga));
      return map;
    }
  });

  const { data: kelasMap = new Map() } = useQuery({
    queryKey: ['master-data', 'kelas-map'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const res = await restClient.get('/kelas', {
        params: { select: 'kelas_id,nama_kelas,lembaga_id' }
      });
      const map = new Map<number, { nama_kelas: string; lembaga_id: number }>();
      (res.data || []).forEach((item: any) => map.set(item.kelas_id, { nama_kelas: item.nama_kelas, lembaga_id: item.lembaga_id }));
      return map;
    }
  });

  const { data: jadwalPelajarans = [] } = useQuery({
    queryKey: ['akademik', 'jadwal-pelajaran'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const rows = await getAllJadwalPelajarans({
        select:
          "jadwal_id,hari,ruangan,kelas_id,mapel_id,pegawai_id,kelas(nama_kelas),mapel:mata_pelajaran(nama_mapel),jam_mulai:jam_akademik!jam_mulai_id(jam_mulai,urutan_jam,tipe),jam_selesai:jam_akademik!jam_selesai_id(jam_selesai)",
        order: "hari.asc,jam_mulai_id.asc",
      });
      return rows as any[];
    }
  });

  const getJadwalInfoForPlan = (plan?: LessonPlanSummary) => {
    if (!plan?.jadwal_id) return null;
    const anchorJadwal = jadwalPelajarans.find((j: any) => j.jadwal_id === plan.jadwal_id);
    if (!anchorJadwal) return null;

    // Safety guard: if plan has pegawai_id and anchor has pegawai_id, they must match
    if (plan.pegawai_id && anchorJadwal.pegawai_id && anchorJadwal.pegawai_id !== plan.pegawai_id) {
      return null;
    }

    // Find all consecutive matching slots with same kelas, mapel, hari, and pegawai
    const matching = jadwalPelajarans
      .filter((j: any) =>
        j.kelas_id === anchorJadwal.kelas_id &&
        j.mapel_id === anchorJadwal.mapel_id &&
        j.hari === anchorJadwal.hari &&
        (!anchorJadwal.pegawai_id || j.pegawai_id === anchorJadwal.pegawai_id)
      )
      .sort((a: any, b: any) => {
        if ((a.jam_mulai?.urutan_jam || 0) !== (b.jam_mulai?.urutan_jam || 0)) {
          return (a.jam_mulai?.urutan_jam || 0) - (b.jam_mulai?.urutan_jam || 0);
        }
        return (a.jam_mulai?.jam_mulai || "").localeCompare(b.jam_mulai?.jam_mulai || "");
      });

    if (matching.length === 0) return null;

    const firstSlot = matching[0];
    const lastSlot = matching[matching.length - 1];

    const jamMulai = (firstSlot.jam_mulai?.jam_mulai || "").substring(0, 5);
    const jamSelesai = (lastSlot.jam_selesai?.jam_selesai || "").substring(0, 5);
    const namaKelas = anchorJadwal.kelas?.nama_kelas || kelasMap.get(anchorJadwal.kelas_id)?.nama_kelas || "";

    return {
      hari: anchorJadwal.hari || "",
      jam_mulai: jamMulai,
      jam_selesai: jamSelesai,
      jumlah_jam: matching.length,
      nama_kelas: namaKelas,
      ruangan: anchorJadwal.ruangan || "",
    };
  };

  const getAlokasiWaktuForPlan = (plan?: LessonPlanSummary) => {
    if (!plan || !plan.jadwal_id) return "";

    const anchorJadwal = jadwalPelajarans.find((j: any) => j.jadwal_id === plan.jadwal_id);
    if (!anchorJadwal) return "";
    
    // Cari semua jam pada hari yang sama, mapel sama, kelas sama, pegawai sama
    const matching = jadwalPelajarans
      .filter((j: any) => {
        return (
          j.kelas_id === anchorJadwal.kelas_id && 
          j.mapel_id === anchorJadwal.mapel_id &&
          j.hari === anchorJadwal.hari &&
          (!anchorJadwal.pegawai_id || j.pegawai_id === anchorJadwal.pegawai_id)
        );
      })
      .sort((a: any, b: any) => (a.jam_mulai?.urutan_jam || 0) - (b.jam_mulai?.urutan_jam || 0));

    if (matching.length === 0) return "";

    const firstSlot = matching[0];
    const lastSlot = matching[matching.length - 1];
    const start = (firstSlot.jam_mulai?.jam_mulai || "").substring(0, 5).replace(":", ".");
    const end = (lastSlot.jam_selesai?.jam_selesai || "").substring(0, 5).replace(":", ".");
    const durationNote = matching.length > 1 ? ` (${matching.length} Jam Pelajaran)` : "";

    return start && end ? `${start} - ${end}${durationNote}` : "";
  };

  const getLembagaNamaForPlan = (plan?: LessonPlanSummary) => {
    if (plan?.jadwal_id) {
      const anchorJadwal = jadwalPelajarans.find((j: any) => j.jadwal_id === plan.jadwal_id);
      if (anchorJadwal?.kelas_id) {
        const kls = kelasMap.get(anchorJadwal.kelas_id);
        if (kls?.lembaga_id) {
          const lbg = lembagaMap.get(kls.lembaga_id);
          if (lbg) return lbg;
        }
      }
    }
    // Fallback: If no jadwal_id or not found, try to use userLembagaId
    if (lembaga_id) {
      const lbg = lembagaMap.get(lembaga_id);
      if (lbg) return lbg;
    }
    return "Pondok Pesantren Maskumambang";
  };

  const handleOpenPertemuan = (plan: LessonPlanSummary, detail: any) => {
    setSelectedPlanForPertemuan(plan);
    setSelectedPertemuan(detail);
    setIsPertemuanModalOpen(true);
  };

  const handleSavePertemuan = async (updatedDetail: any) => {
    if (!selectedPlanForPertemuan) return;
    setIsSavingPertemuan(true);
    try {
      if (updatedDetail.detail_id && updatedDetail.detail_id > 0) {
        await updateLessonPlanDetail(updatedDetail.detail_id, {
          materi: updatedDetail.materi,
          topik_materi: updatedDetail.topik_materi,
          rencana_pelaksanaan_kbm: updatedDetail.rencana_pelaksanaan_kbm,
          isi: updatedDetail.isi,
          status_verifikasi_kepsek: "Menunggu Verifikasi",
          verified_by_kepsek: null,
          catatan_revisi_kepsek: "",
          status_verifikasi_direktur: "Menunggu Verifikasi",
          verified_by_direktur: null,
          catatan_revisi_direktur: "",
        });
      } else {
        await createLessonPlanDetail({
          lesson_plan_id: selectedPlanForPertemuan.lesson_plan_id,
          pertemuan_ke: updatedDetail.pertemuan_ke,
          materi: updatedDetail.materi,
          topik_materi: updatedDetail.topik_materi,
          rencana_pelaksanaan_kbm: updatedDetail.rencana_pelaksanaan_kbm,
          isi: updatedDetail.isi,
          status_verifikasi_kepsek: "Menunggu Verifikasi",
          verified_by_kepsek: null,
          catatan_revisi_kepsek: "",
          status_verifikasi_direktur: "Menunggu Verifikasi",
          verified_by_direktur: null,
          catatan_revisi_direktur: "",
        });
      }

      // Reset parent plan status as well if it had been disetujui or revisi
      await restClient.patch(`/lesson_plan?lesson_plan_id=eq.${selectedPlanForPertemuan.lesson_plan_id}`, {
        status_verifikasi_kepsek: "Menunggu Verifikasi",
        status_verifikasi_direktur: "Menunggu Verifikasi",
      });

      toast.success(`Pertemuan Ke-${updatedDetail.pertemuan_ke} berhasil disimpan! Status verifikasi pertemuan telah direset ke Menunggu Verifikasi.`);
      queryClient.invalidateQueries({ queryKey: Array.from(QUERY_KEY) });
      setIsPertemuanModalOpen(false);
      setSelectedPertemuan(null);
      setSelectedPlanForPertemuan(null);
    } catch (error: any) {
      console.error("Gagal menyimpan detail pertemuan:", error);
      toast.error("Gagal menyimpan detail pertemuan. Silakan coba lagi.");
    } finally {
      setIsSavingPertemuan(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    tabs,
    lessonPlans,
    isLoading,
    role,
    finalCanCreate,
    finalCanUpdate,
    finalCanDelete,
    canVerify,
    isDeleteOpen,
    setIsDeleteOpen,
    expandedPlans,
    toggleExpand,
    selectedPlan,
    setSelectedPlan,
    isDeleting,
    isRevisiModalOpen,
    setIsRevisiModalOpen,
    isApproveModalOpen,
    setIsApproveModalOpen,
    isApproveAllModalOpen,
    setIsApproveAllModalOpen,
    isApprovingAll,
    eligiblePlansToApprove,
    handleOpenSetujuiSemua,
    executeVerifyAll,
    isResetVerifikasiModalOpen,
    setIsResetVerifikasiModalOpen,
    isResettingVerifikasi,
    executeResetVerifikasi,
    revisiNote,
    setRevisiNote,
    isVerifying,
    handleVerifyAction,
    executeVerify,
    // Per-Meeting Verification
    selectedDetailForVerify,
    setSelectedDetailForVerify,
    isDetailApproveModalOpen,
    setIsDetailApproveModalOpen,
    isDetailRevisiModalOpen,
    setIsDetailRevisiModalOpen,
    detailRevisiNote,
    setDetailRevisiNote,
    isVerifyingDetail,
    handleVerifyDetailAction,
    executeVerifyDetail,
    confirmDelete,
    executeDelete,
    handleExport,
    handleImportClick,
    processImport,
    isImporting,
    fileInputRef,
    filteredLessonPlans,
    isPertemuanModalOpen,
    setIsPertemuanModalOpen,
    selectedPertemuan,
    setSelectedPertemuan,
    selectedPlanForPertemuan,
    setSelectedPlanForPertemuan,
    isSavingPertemuan,
    handleOpenPertemuan,
    handleSavePertemuan,
    activeTahunAjaran,
    lembagaMap,
    kelasMap,
    searchQuery,
    setSearchQuery,
    kelasFilter,
    setKelasFilter,
    mapelFilter,
    setMapelFilter,
    pertemuanFilter,
    setPertemuanFilter,
    kelasOptions,
    mapelOptions,
    executeKirimVerifikasi,
    isSendingVerification,
    getAlokasiWaktuForPlan,
    getLembagaNamaForPlan,
    getJadwalInfoForPlan,
    jadwalPelajarans,
    // Pagination
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedLessonPlans,
    PAGE_SIZE_OPTIONS,
  };
}
