import React, { useState, useEffect, useMemo } from "react";
import { restClient } from "@/lib/api/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/store/useAuthStore";
import { getLembagas } from "@/lib/api/services/masterService";
import {
  createActivityPlan,
  updateActivityPlan,
  deleteActivityPlan,
  getTahunAjarans,
  createKalenderAkademik,
  getKalenderAkademiks,
} from "@/lib/api/services/akademikService";
import { verifyActivityPlan } from "@/lib/api/services/kbmService";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import type { ACTIVITY_PLAN } from "@/types/database";

export type ActivityPlanWithLembaga = ACTIVITY_PLAN & {
  lembaga?: {
    nama_lembaga: string;
    singkatan?: string;
  };
};

export function useActivityPlan() {
  const queryClient = useQueryClient();
  const { role, lembaga_id: userLembagaId } = useAuthStore();
  const { canCreate, canUpdate, canDelete, canVerify } = usePermissions("activity_plan");

  // Realtime: auto-refresh saat ada perubahan activity plan dari user lain
  useRealtimeSync([
    { table: 'activity_plan', queryKeys: [['kbm', 'activity-plans']] },
    { table: 'kalender_akademik', queryKeys: [['kbm', 'activity-plan', 'kalender-events'], ['akademik', 'kalender']] },
  ]);

  const [activeTab, setActiveTab] = useState("Semua");
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ACTIVITY_PLAN | null>(null);

  const [isRevisiModalOpen, setIsRevisiModalOpen] = useState(false);
  const [revisiNote, setRevisiNote] = useState("");
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    nama_kegiatan: "",
    kategori: "Akademik" as 'Akademik' | 'Acara' | 'Libur' | 'Lainnya',
    tanggal_mulai: "",
    tanggal_berakhir: "",
    deskripsi: "",
    lembaga_id: "",
    tahun_id: "",
  });

  const isSuperAdminOrDirektur = role === "Super Admin" || role === "Direktur";
  const isLembagaDisabled = !isSuperAdminOrDirektur && !!userLembagaId;

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Use 5 to be consistent with UI lists typically

  // Reset page to 1 when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // 1. Fetch Activity Plans with Pagination
  const { data: activityData = { data: [], totalCount: 0 }, isLoading } = useQuery({
    queryKey: ["kbm", "activity-plans", activeTab, currentPage],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const params: any = {
        select: "*,lembaga(nama_lembaga,singkatan)",
        order: "tanggal_mulai.desc",
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage
      };

      if (activeTab !== "Semua") {
        params.kategori = `eq.${activeTab}`;
      }

      const response = await restClient.get('/activity_plan', {
        params,
        headers: { 'Prefer': 'count=exact' }
      });

      const range = response.headers['content-range'];
      let totalCount = 0;
      if (range) {
        totalCount = parseInt(range.split('/')[1], 10);
      }

      return {
        data: response.data as ActivityPlanWithLembaga[],
        totalCount
      };
    },
  });

  const activityPlans = activityData.data;
  const totalCount = activityData.totalCount;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // 2. Fetch Lembaga Options
  const { data: lembagas = [] } = useQuery({
    queryKey: ["options", "lembagas"],
    staleTime: 10 * 60 * 1000, // 10 menit
    queryFn: async () => {
      return getLembagas({ select: "lembaga_id,nama_lembaga,singkatan" });
    },
  });

  // 3. Fetch Tahun Ajaran Options
  const { data: activeTahuns = [] } = useQuery({
    queryKey: ["kbm", "activity-plan", "tahun-ajarans"],
    staleTime: 10 * 60 * 1000, // 10 menit
    queryFn: async () => {
      return getTahunAjarans({ select: "tahun_id,lembaga_id,is_active,nama_tahun,semester" });
    },
  });

  // 4. Fetch Kalender Akademik to check if activity plan is already added
  const { data: kalenderEvents = [] } = useQuery({
    queryKey: ["kbm", "activity-plan", "kalender-events"],
    staleTime: 2 * 60 * 1000, // 2 menit (auto-invalidated via useRealtimeSync)
    queryFn: async () => {
      return getKalenderAkademiks({ select: "kalender_id,nama_kegiatan,kategori,tanggal_mulai,tanggal_berakhir" });
    },
  });

  // Filter tahun ajaran based on selected lembaga
  const filteredTahuns = useMemo(() => {
    if (!formData.lembaga_id) return [];
    const selectedLembagaId = parseInt(formData.lembaga_id);
    return activeTahuns.filter((t) => t.lembaga_id === selectedLembagaId);
  }, [formData.lembaga_id, activeTahuns]);

  // Auto-select active tahun_ajaran when lembaga_id is selected
  useEffect(() => {
    if (formData.lembaga_id && activeTahuns.length > 0) {
      const selectedLembagaId = parseInt(formData.lembaga_id);
      const activeTahun = activeTahuns.find(
        (t) => t.lembaga_id === selectedLembagaId && t.is_active
      );
      if (activeTahun) {
        setFormData((prev) => ({ ...prev, tahun_id: String(activeTahun.tahun_id) }));
      } else {
        setFormData((prev) => ({ ...prev, tahun_id: "" }));
      }
    }
  }, [formData.lembaga_id, activeTahuns]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createActivityPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kbm", "activity-plans"] });
      queryClient.invalidateQueries({ queryKey: ["dash-activity"] });
      setIsOpen(false);
      toast.success("Activity Plan berhasil ditambahkan!");
    },
    onError: () => {
      toast.error("Rencana kegiatan gagal ditambahkan. Periksa kembali isian dan coba lagi.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => updateActivityPlan(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kbm", "activity-plans"] });
      queryClient.invalidateQueries({ queryKey: ["dash-activity"] });
      setIsOpen(false);
      toast.success("Activity Plan berhasil diubah!");
    },
    onError: () => {
      toast.error("Rencana kegiatan gagal diubah. Silakan coba lagi.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteActivityPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kbm", "activity-plans"] });
      queryClient.invalidateQueries({ queryKey: ["dash-activity"] });
      setIsDeleteOpen(false);
      toast.success("Activity Plan berhasil dihapus!");
    },
    onError: () => {
      toast.error("Rencana kegiatan gagal dihapus. Silakan coba lagi.");
    },
  });

  const adakanMutation = useMutation({
    mutationFn: createKalenderAkademik,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["akademik", "kalender"] });
      queryClient.invalidateQueries({ queryKey: ["kbm", "activity-plan", "kalender-events"] });
      toast.success("Kegiatan berhasil diadakan and ditambahkan ke Kalender Akademik!");
    },
    onError: () => {
      toast.error("Gagal menambahkan kegiatan ke Kalender Akademik. Silakan coba lagi.");
    },
  });

  const verifyMutation = useMutation({
    mutationFn: verifyActivityPlan,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kbm", "activity-plans"] });
      if (variables.action === "Disetujui") {
        toast.success("Activity Plan telah disetujui.");
        setIsApproveModalOpen(false);
      } else {
        toast.info("Activity Plan dikembalikan untuk direvisi.");
        setIsRevisiModalOpen(false);
      }
    },
    onError: () => {
      toast.error("Gagal memproses verifikasi. Silakan coba lagi.");
    }
  });

  const handleAdakan = (item: ActivityPlanWithLembaga) => {
    adakanMutation.mutate({
      nama_kegiatan: item.nama_kegiatan,
      kategori: item.kategori,
      tanggal_mulai: item.tanggal_mulai,
      tanggal_berakhir: item.tanggal_berakhir,
      lembaga_id: item.lembaga_id ?? undefined,
      tahun_id: item.tahun_id,
    } as any);
  };

  const handleOpenAdd = () => {
    setSelectedPlan(null);
    setFormData({
      nama_kegiatan: "",
      kategori: "Akademik",
      tanggal_mulai: "",
      tanggal_berakhir: "",
      deskripsi: "",
      lembaga_id: userLembagaId ? String(userLembagaId) : "",
      tahun_id: "",
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (plan: ACTIVITY_PLAN) => {
    setSelectedPlan(plan);
    setFormData({
      nama_kegiatan: plan.nama_kegiatan,
      kategori: plan.kategori,
      tanggal_mulai: plan.tanggal_mulai,
      tanggal_berakhir: plan.tanggal_berakhir,
      deskripsi: plan.deskripsi || "",
      lembaga_id: String(plan.lembaga_id),
      tahun_id: String(plan.tahun_id),
    });
    setIsOpen(true);
  };

  const handleOpenDelete = (plan: ACTIVITY_PLAN) => {
    setSelectedPlan(plan);
    setIsDeleteOpen(true);
  };

  const handleVerifyAction = (plan: ACTIVITY_PLAN, action: "Disetujui" | "Revisi") => {
    setSelectedPlan(plan);
    if (action === "Revisi") {
      setRevisiNote("");
      setIsRevisiModalOpen(true);
    } else {
      setIsApproveModalOpen(true);
    }
  };

  const executeVerify = (action: "Disetujui" | "Revisi") => {
    if (!selectedPlan) return;
    verifyMutation.mutate({
      activity_id: selectedPlan.activity_id,
      action,
      catatan_revisi: action === "Revisi" ? revisiNote : "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama_kegiatan.trim()) {
      toast.error("Nama kegiatan harus diisi");
      return;
    }
    if (!formData.tanggal_mulai || !formData.tanggal_berakhir) {
      toast.error("Tanggal mulai dan berakhir harus diisi");
      return;
    }
    if (new Date(formData.tanggal_mulai) > new Date(formData.tanggal_berakhir)) {
      toast.error("Tanggal mulai tidak boleh melebihi tanggal berakhir");
      return;
    }
    if (!formData.lembaga_id) {
      toast.error("Lembaga harus dipilih");
      return;
    }
    if (!formData.tahun_id) {
      toast.error("Tahun ajaran harus dipilih");
      return;
    }

    const payload = {
      nama_kegiatan: formData.nama_kegiatan.trim(),
      kategori: formData.kategori,
      tanggal_mulai: formData.tanggal_mulai,
      tanggal_berakhir: formData.tanggal_berakhir,
      deskripsi: formData.deskripsi.trim() || undefined,
      lembaga_id: parseInt(formData.lembaga_id),
      tahun_id: parseInt(formData.tahun_id),
      status_verifikasi: "Menunggu Verifikasi" as const,
      catatan_revisi: null,
    };

    if (selectedPlan) {
      updateMutation.mutate({ id: selectedPlan.activity_id, payload: payload as any });
    } else {
      createMutation.mutate(payload as any);
    }
  };

  const handleDelete = () => {
    if (selectedPlan) {
      deleteMutation.mutate(selectedPlan.activity_id);
    }
  };

  const filteredActivity = activityPlans;

  return {
    role,
    canCreate,
    canUpdate,
    canDelete,
    canVerify,
    activeTab,
    setActiveTab,
    isOpen,
    setIsOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    isApproveModalOpen,
    setIsApproveModalOpen,
    isRevisiModalOpen,
    setIsRevisiModalOpen,
    selectedPlan,
    revisiNote,
    setRevisiNote,
    formData,
    setFormData,
    isLembagaDisabled,
    activityPlans,
    lembagas,
    filteredTahuns,
    kalenderEvents,
    isLoading,
    createMutation,
    updateMutation,
    deleteMutation,
    verifyMutation,
    adakanMutation,
    handleAdakan,
    handleOpenAdd,
    handleOpenEdit,
    handleOpenDelete,
    handleVerifyAction,
    executeVerify,
    handleSubmit,
    handleDelete,
    filteredActivity,
    currentPage,
    setCurrentPage,
    totalPages,
  };
}
