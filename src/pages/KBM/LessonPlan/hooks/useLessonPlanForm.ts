import React, { useEffect, useState, useRef, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useNavigationStore } from "@/store/useNavigationStore";
import { useAuthStore } from "@/store/useAuthStore";
import {
  createLessonPlan,
  updateLessonPlan,
  createLessonPlanDetail,
  updateLessonPlanDetail,
  deleteLessonPlanDetail,
  getLessonPlanById,
  getLessonPlanDetails,
  getLessonPlans,
  getJurnalMengajars,
} from "@/lib/api/services/kbmService";
import { getMataPelajarans } from "@/lib/api/services/akademikService";
import { getPegawais } from "@/lib/api/services/masterService";
import type { MATA_PELAJARAN, PEGAWAI } from "@/types/database";

export type DetailForm = {
  detail_id?: number;
  pertemuan_ke: number;
  tema: string;
  deskripsi: string;
  materi?: string;
  topik_materi?: string;
};

export function useLessonPlanForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const role = useAuthStore(state => state.role);
  const userPegawaiId = useAuthStore(state => state.user?.pegawai_id);
  const lembagaId = useAuthStore(state => state.lembaga_id);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showVerifikasiResetDialog, setShowVerifikasiResetDialog] = useState(false);
  // Simpan status verifikasi asli RPP saat mode edit
  const [originalVerifikasiStatus, setOriginalVerifikasiStatus] = useState<{
    kepsek: string;
    direktur: string;
  } | null>(null);
  // Jumlah pertemuan yang sudah punya absensi dan akan terdampak jika dihapus
  const [absensiTerimpakCount, setAbsensiTerimpakCount] = useState(0);
  // Detail IDs yang akan dihapus (dihitung saat handleSubmit untuk ditampilkan di dialog)
  const [detailsToDelete, setDetailsToDelete] = useState<number[]>([]);
  const [pegawais, setPegawais] = useState<PEGAWAI[]>([]);
  const [mapels, setMapels] = useState<MATA_PELAJARAN[]>([]);
  const [formData, setFormData] = useState({
    judul_rpp: "",
    pegawai_id: "",
    mapel_id: "",
  });
  const [details, setDetails] = useState<DetailForm[]>([
    { pertemuan_ke: 1, tema: "", deskripsi: "" },
  ]);

  // Handle browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSubmitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSubmitting]);

  const { setBlockingFn, pendingPath, setPendingPath } = useNavigationStore();

  useEffect(() => {
    if (!isSubmitting) {
      setBlockingFn(() => true);
    } else {
      setBlockingFn(null);
    }
    return () => setBlockingFn(null);
  }, [isSubmitting, setBlockingFn]);

  useEffect(() => {
    if (pendingPath) {
      setShowCancelDialog(true);
    }
  }, [pendingPath]);

  const handleCancelProceed = () => {
    setShowCancelDialog(false);
    setBlockingFn(null);
    if (pendingPath) {
      navigate(pendingPath);
      setPendingPath(null);
    } else {
      navigate(-1);
    }
  };

  const handleCancelReset = () => {
    setShowCancelDialog(false);
    setPendingPath(null);
  };

  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadOptionsAndData = async () => {
      setIsLoading(true);
      try {
        // Masalah 2: Filter pegawai hanya dari lembaga aktif menggunakan 2-step approach
        // yang kompatibel dengan semua versi Supabase/PostgREST
        const isGlobalRole = ['Super Admin', 'Direktur'].includes(role || '');
        let pegawaiRows: PEGAWAI[];

        if (!isGlobalRole && lembagaId) {
          // Step 1: Ambil daftar pegawai_id yang terdaftar di lembaga aktif
          const { restClient } = await import('@/lib/api/axios');
          const relRes = await restClient.get(`/pegawai_lembaga?lembaga_id=eq.${lembagaId}&select=pegawai_id`);
          const pegawaiIds: number[] = (relRes.data || []).map((r: any) => r.pegawai_id);

          if (pegawaiIds.length === 0) {
            pegawaiRows = [];
          } else {
            // Step 2: Fetch pegawai dengan filter by IDs
            pegawaiRows = await getPegawais({
              select: "pegawai_id,nama",
              pegawai_id: `in.(${pegawaiIds.join(',')})`
            });
          }
        } else {
          // Global role: fetch semua pegawai tanpa filter lembaga
          pegawaiRows = await getPegawais({ select: "pegawai_id,nama" });
        }

        setPegawais(pegawaiRows);

        if (id) {
          const planData = await getLessonPlanById(Number(id));
          const planDetails = await getLessonPlanDetails({ "lesson_plan_id": `eq.${id}` });

          setFormData({
            judul_rpp: planData.judul_rpp,
            pegawai_id: String(planData.pegawai_id),
            mapel_id: String((planData as any).mapel_id || ""),
          });

          // Simpan status verifikasi asli untuk pengecekan saat submit
          setOriginalVerifikasiStatus({
            kepsek: planData.status_verifikasi_kepsek || "Menunggu Verifikasi",
            direktur: planData.status_verifikasi_direktur || "Menunggu Verifikasi",
          });

          if (planDetails.length > 0) {
            const mappedDetails: DetailForm[] = planDetails.map((d: any) => ({
              detail_id: d.detail_id,
              pertemuan_ke: d.pertemuan_ke,
              tema: d.materi || "",
              deskripsi: d.topik_materi || "",
            }));
            setDetails(mappedDetails);
          }
        } else {
          let defaultPegawaiId = pegawaiRows[0] ? String(pegawaiRows[0].pegawai_id) : "";
          if ((role === 'Guru' || role === 'Wali Kelas') && userPegawaiId) {
            defaultPegawaiId = String(userPegawaiId);
          }

          if (defaultPegawaiId) {
            setFormData((previous) => ({
              ...previous,
              pegawai_id: defaultPegawaiId,
            }));
          }
        }
      } catch (error) {
        console.error("Gagal memuat form lesson plan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOptionsAndData();
  }, [id, role, userPegawaiId, lembagaId]);

  useEffect(() => {
    const loadMapels = async () => {
      if (!formData.pegawai_id) {
        setMapels([]);
        return;
      }
      try {
        // Query jadwal pelajaran yang diampu oleh guru ini
        const { restClient } = await import('@/lib/api/axios');
        const jadwalRes = await restClient.get('/jadwal_pelajaran', {
          params: {
            pegawai_id: `eq.${formData.pegawai_id}`,
            select: 'mapel_id,mapel(mapel_id,nama_mapel,lembaga_id)'
          }
        });

        const jadwalList = jadwalRes.data || [];
        const mapelMap = new Map<number, MATA_PELAJARAN>();
        for (const j of jadwalList) {
          if (j.mapel && j.mapel.mapel_id) {
            mapelMap.set(j.mapel.mapel_id, j.mapel);
          }
        }

        let mapelRows = Array.from(mapelMap.values()).sort((a, b) => a.nama_mapel.localeCompare(b.nama_mapel));

        // Jika guru belum memiliki jadwal pelajaran, fallback ke seluruh mapel di lembaga
        if (mapelRows.length === 0) {
          const params: any = { select: "mapel_id,nama_mapel,lembaga_id", order: "nama_mapel.asc" };
          if (lembagaId) {
            params.lembaga_id = `eq.${lembagaId}`;
          }
          mapelRows = await getMataPelajarans(params);
        }

        setMapels(mapelRows);

        if (mapelRows.length > 0) {
          setFormData(prev => {
            const isCurrentMapelValid = mapelRows.some(m => String(m.mapel_id) === prev.mapel_id);
            return {
              ...prev,
              mapel_id: isCurrentMapelValid ? prev.mapel_id : String(mapelRows[0].mapel_id)
            };
          });
        } else {
          setFormData(prev => ({ ...prev, mapel_id: "" }));
        }
      } catch (error) {
        console.error("Gagal memuat mata pelajaran untuk guru ini:", error);
        setMapels([]);
      }
    };

    loadMapels();
  }, [formData.pegawai_id, lembagaId]);

  const tambahPertemuan = () => {
    // pertemuan_ke selalu otomatis = jumlah detail saat ini + 1
    setDetails(prev => [
      ...prev,
      {
        pertemuan_ke: prev.length + 1,
        tema: "",
        deskripsi: "",
      },
    ]);
  };

  const handleDownloadTemplate = () => {
    const templateData = [{
      "Pertemuan Ke": 1,
      "Materi": "Pengenalan Ekosistem",
      "Topik Materi": "Siswa diajak memahami komponen biotik dan abiotik.",
    },
    {
      "Pertemuan Ke": 2,
      "Materi": "Jaring-jaring Makanan",
      "Topik Materi": "Mempelajari interaksi antar makhluk hidup.",
    }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Detail Pertemuan");
    XLSX.writeFile(wb, "Template_Import_Detail_Pertemuan.xlsx");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

        const newDetails: DetailForm[] = [];
        const pertemuanKeys = new Set<number>();
        let hasDuplicatePertemuan = false;
        let hasEmptyTema = false;
        let hasInvalidPertemuanNo = false;

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const isEmptyRow = !row["Pertemuan Ke"] && !row["Tema"] && !row["Deskripsi"];
          if (isEmptyRow) continue;

          const pertemuanKeStr = row["Pertemuan Ke"] !== undefined ? String(row["Pertemuan Ke"]).trim() : "";
          const pertemuanKe = parseInt(pertemuanKeStr);
          const tema = (row["Materi"] !== undefined ? row["Materi"] : row["Tema"] !== undefined ? row["Tema"] : "") ? String(row["Materi"] || row["Tema"]).trim() : "";
          const deskripsi = (row["Topik Materi"] !== undefined ? row["Topik Materi"] : row["Deskripsi"] !== undefined ? row["Deskripsi"] : "") ? String(row["Topik Materi"] || row["Deskripsi"]).trim() : "";

          if (!pertemuanKeStr || isNaN(pertemuanKe) || pertemuanKe <= 0) {
            hasInvalidPertemuanNo = true;
          }

          if (pertemuanKeys.has(pertemuanKe)) {
            hasDuplicatePertemuan = true;
          }
          pertemuanKeys.add(pertemuanKe);

          if (!tema) {
            hasEmptyTema = true;
          }

          newDetails.push({
            pertemuan_ke: isNaN(pertemuanKe) ? (i + 1) : pertemuanKe,
            tema,
            deskripsi,
          });
        }

        if (newDetails.length === 0) {
          toast.error("Data di file tidak lengkap atau tidak sesuai template (kolom: Pertemuan Ke, Materi, Topik Materi).");
          setIsImporting(false);
          return;
        }

        if (hasInvalidPertemuanNo) {
          toast.error("Impor gagal: Kolom 'Pertemuan Ke' wajib diisi dengan angka bulat positif.");
          setIsImporting(false);
          return;
        }

        if (hasDuplicatePertemuan) {
          toast.error("Impor gagal: Terdapat nomor pertemuan ('Pertemuan Ke') yang kembar di file Excel.");
          setIsImporting(false);
          return;
        }

        if (hasEmptyTema) {
          toast.error("Impor gagal: Kolom 'Materi' wajib diisi pada setiap baris pertemuan.");
          setIsImporting(false);
          return;
        }

        setDetails(newDetails);
        toast.success(`Berhasil mengimpor ${newDetails.length} pertemuan. Data ditempelkan ke form.`);
      } catch (error: any) {
        toast.error("Gagal mengimpor data. Pastikan format file Excel valid.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const hapusPertemuan = (index: number) => {
    if (details.length === 1) {
      return;
    }

    if (index !== details.length - 1) {
      toast.error("Hapus pertemuan terakhir terlebih dahulu");
      return;
    }

    setDetails(details.filter((_, currentIndex) => currentIndex !== index));
  };

  // Eksekusi simpan yang sebenarnya (dipanggil setelah konfirmasi jika ada warning)
  const doSave = async () => {
    setIsSubmitting(true);
    try {
      const { restClient } = await import('@/lib/api/axios');
      let matchedJadwalId: number | undefined = undefined;
      if (formData.mapel_id) {
        const matchJadwalRes = await restClient.get('/jadwal_pelajaran', {
          params: {
            pegawai_id: `eq.${formData.pegawai_id}`,
            mapel_id: `eq.${formData.mapel_id}`,
            limit: 1,
          },
        });
        if (matchJadwalRes.data && matchJadwalRes.data.length > 0) {
          matchedJadwalId = matchJadwalRes.data[0].jadwal_id;
        }
      }

      if (id) {
        await updateLessonPlan(Number(id), {
          judul_rpp: formData.judul_rpp,
          pegawai_id: Number(formData.pegawai_id),
          ...(matchedJadwalId ? { jadwal_id: matchedJadwalId } : {}),
          status_verifikasi_kepsek: "Menunggu Verifikasi",
          status_verifikasi_direktur: "Menunggu Verifikasi",
          catatan_revisi_kepsek: "",
          catatan_revisi_direktur: "",
        });

        const currentDetails = await getLessonPlanDetails({ "lesson_plan_id": `eq.${id}` });
        const currentDetailIds = currentDetails.map(d => d.detail_id);
        const submittedDetailIds = details.filter(d => d.detail_id && d.tema.trim()).map(d => d.detail_id!);

        const toDeleteIds = currentDetailIds.filter(cid => !submittedDetailIds.includes(cid));

        for (const delId of toDeleteIds) {
          await deleteLessonPlanDetail(delId);
        }

        const filteredDetails = details.filter((item) => (item.materi || item.tema || "").trim());
        for (let i = 0; i < filteredDetails.length; i++) {
          const detail = filteredDetails[i];
          // pertemuan_ke otomatis dari posisi urutan (i + 1)
          const pertemuanKe = i + 1;
          if (detail.detail_id) {
            await updateLessonPlanDetail(detail.detail_id, {
              pertemuan_ke: pertemuanKe,
              materi: detail.materi || detail.tema || "",
              topik_materi: detail.topik_materi || detail.deskripsi || undefined,
            });
          } else {
            await createLessonPlanDetail({
              lesson_plan_id: Number(id),
              pertemuan_ke: pertemuanKe,
              materi: detail.materi || detail.tema || "",
              topik_materi: detail.topik_materi || detail.deskripsi || undefined,
            });
          }
        }
        toast.success("Lesson Plan berhasil diperbarui!");
      } else {
        const createdPlan = await createLessonPlan({
          judul_rpp: formData.judul_rpp,
          pegawai_id: Number(formData.pegawai_id),
          jadwal_id: matchedJadwalId,
          status_verifikasi_kepsek: "Menunggu Verifikasi",
          status_verifikasi_direktur: "Menunggu Verifikasi",
        });

        const filteredNewDetails = details.filter((item) => (item.materi || item.tema || "").trim());
        const detailPromises = filteredNewDetails.map((detail, i) =>
          createLessonPlanDetail({
            lesson_plan_id: createdPlan.lesson_plan_id,
            pertemuan_ke: i + 1, // pertemuan_ke otomatis dari posisi urutan
            materi: detail.materi || detail.tema || "",
            topik_materi: detail.topik_materi || detail.deskripsi || undefined,
          })
        );
        await Promise.all(detailPromises);
        toast.success("Lesson Plan berhasil disimpan!");
      }

      setBlockingFn(null);
      navigate("/kbm/lesson-plan");
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || "Terjadi kesalahan saat menyimpan data.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!formData.judul_rpp) {
      toast.error("Judul RPP wajib diisi.");
      return;
    }
    if (!formData.pegawai_id) {
      toast.error("Guru Pengampu wajib dipilih.");
      return;
    }
    if (!formData.mapel_id) {
      toast.error("Mata Pelajaran wajib dipilih.");
      return;
    }

    // pertemuan_ke otomatis berdasarkan urutan, tidak perlu validasi duplikasi

    try {
      const existing = await getLessonPlans({
        pegawai_id: `eq.${formData.pegawai_id}`
      });
      const isDuplicate = existing.some((lp: any) => (!id || lp.lesson_plan_id !== Number(id)) && String((lp as any).mapel_id || (lp as any).jadwal_id) === String(formData.mapel_id));
      if (isDuplicate) {
        toast.error("Gagal menyimpan: RPP untuk Guru pengampu dan Mata Pelajaran ini sudah terdaftar di sistem. Tidak diperbolehkan membuat lebih dari satu RPP untuk pengampu & mapel yang sama.");
        return;
      }
    } catch (err) {
      console.error("Gagal memvalidasi duplikasi RPP:", err);
    }

    // Jika mode edit dan RPP sudah diverifikasi (oleh Kepsek atau Direktur),
    // tampilkan dialog peringatan bahwa menyimpan akan mereset status verifikasi.
    if (id && originalVerifikasiStatus) {
      const sudahDiverifikasi =
        originalVerifikasiStatus.kepsek === "Disetujui" ||
        originalVerifikasiStatus.direktur === "Disetujui";
      if (sudahDiverifikasi) {
        // Cek apakah ada pertemuan yang akan dihapus dan sudah punya absensi
        try {
          const currentDetails = await getLessonPlanDetails({ "lesson_plan_id": `eq.${id}` });
          const currentDetailIds = currentDetails.map(d => d.detail_id);
          const submittedDetailIds = details.filter(d => d.detail_id && d.tema.trim()).map(d => d.detail_id!);
          const toDeleteIds = currentDetailIds.filter(cid => !submittedDetailIds.includes(cid));

          if (toDeleteIds.length > 0) {
            // Cek jurnal mengajar yang terhubung ke detail yang akan dihapus
            const jurnals = await getJurnalMengajars({
              lesson_plan_detail_id: `in.(${toDeleteIds.join(',')})`
            });
            setAbsensiTerimpakCount(jurnals.length);
            setDetailsToDelete(toDeleteIds);
          } else {
            setAbsensiTerimpakCount(0);
            setDetailsToDelete([]);
          }
        } catch (err) {
          console.error("Gagal cek absensi terdampak:", err);
          setAbsensiTerimpakCount(0);
          setDetailsToDelete([]);
        }

        setShowVerifikasiResetDialog(true);
        return; // Tahan submit, tunggu konfirmasi
      }
    }

    await doSave();
  };

  const handleVerifikasiResetConfirm = async () => {
    setShowVerifikasiResetDialog(false);
    await doSave();
  };

  const handleVerifikasiResetCancel = () => {
    setShowVerifikasiResetDialog(false);
  };

  const handleDetailChange = (index: number, field: keyof DetailForm, value: any) => {
    setDetails(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };

  const handleCancelClick = () => {
    const hasChanges = details.some(d => d.tema.trim() || d.deskripsi.trim()) || formData.judul_rpp.trim();
    if (hasChanges) {
      setShowCancelDialog(true);
    } else {
      navigate(-1);
    }
  };

  return {
    id,
    role,
    isLoading,
    isSubmitting,
    showCancelDialog,
    showVerifikasiResetDialog,
    originalVerifikasiStatus,
    absensiTerimpakCount,
    detailsToDelete,
    pegawais,
    mapels,
    formData,
    setFormData,
    details,
    setDetails,
    tambahPertemuan,
    hapusPertemuan,
    handleDetailChange,
    handleDownloadTemplate,
    handleImport,
    handleSubmit,
    handleCancelClick,
    handleCancelProceed,
    handleCancelReset,
    handleVerifikasiResetConfirm,
    handleVerifikasiResetCancel,
    isImporting,
    fileInputRef
  };
}
