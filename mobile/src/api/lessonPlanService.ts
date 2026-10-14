// mobile/src/api/lessonPlanService.ts
import { apiClient } from "./client";

export interface LembagaItem {
  lembaga_id: number;
  nama_lembaga: string;
  singkatan?: string;
}

export interface LessonPlanDetailItem {
  detail_id: number;
  lesson_plan_id: number;
  pertemuan_ke: number;
  materi?: string | null;
  topik_materi?: string | null;
  rencana_pelaksanaan_kbm?: string | null;
  isi?: string | null;
  status_verifikasi_kepsek?: string | null;
  verified_by_kepsek?: number | null;
  catatan_revisi_kepsek?: string | null;
  status_verifikasi_direktur?: string | null;
  verified_by_direktur?: number | null;
  catatan_revisi_direktur?: string | null;
}

export interface LessonPlanItem {
  lesson_plan_id: number;
  pegawai_id: number;
  jadwal_id?: number | null;
  judul_rpp: string;
  status_verifikasi_kepsek?: string | null;
  verified_by_kepsek?: number | null;
  catatan_revisi_kepsek?: string | null;
  status_verifikasi_direktur?: string | null;
  verified_by_direktur?: number | null;
  catatan_revisi_direktur?: string | null;
  pegawai?: {
    pegawai_id: number;
    nama: string;
    nip?: string;
    nig?: string;
  } | null;
  jadwal?: {
    jadwal_id: number;
    hari?: string;
    ruangan?: string;
    kelas?: {
      kelas_id: number;
      nama_kelas: string;
      lembaga_id?: number;
    };
    mapel?: {
      mapel_id: number;
      nama_mapel: string;
      lembaga_id?: number;
    };
    jam_mulai?: {
      jam_id: number;
      jam_mulai: string;
      jam_selesai: string;
    } | null;
    jam_selesai?: {
      jam_id: number;
      jam_mulai: string;
      jam_selesai: string;
    } | null;
  } | null;
  details?: LessonPlanDetailItem[];
}

export type StatusRingkas =
  | "Disetujui"
  | "Menunggu Verifikasi Kepsek"
  | "Menunggu Verifikasi Direktur"
  | "Revisi Kepsek"
  | "Revisi Direktur"
  | "Menunggu Verifikasi";

/**
 * Menghitung status ringkas per-pertemuan sesuai logika web LMS
 */
export const resolveDetailStatus = (
  detail?: Partial<LessonPlanDetailItem> | null
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

/**
 * Menghitung status ringkas keseluruhan RPP sesuai logika web LMS
 */
export const resolvePlanStatus = (plan: LessonPlanItem): StatusRingkas => {
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

export const lessonPlanService = {
  // Ambil list lesson plan dengan filter
  getLessonPlans: async (params?: {
    pegawai_id?: number;
    jadwal_id?: number;
    lembaga_id?: number;
  }): Promise<LessonPlanItem[]> => {
    const response = await apiClient.get("/kbm/lesson-plan", { params });
    const list = response.data?.data || response.data || [];
    return Array.isArray(list) ? list : [];
  },

  // Ambil detail tunggal lesson plan
  getLessonPlanById: async (id: number): Promise<LessonPlanItem | null> => {
    const response = await apiClient.get(`/kbm/lesson-plan/${id}`);
    return response.data?.data || response.data || null;
  },

  // Ambil detail tunggal pertemuan lengkap dengan teks dokumen 'isi'
  getLessonPlanDetailById: async (detailId: number): Promise<LessonPlanDetailItem | null> => {
    try {
      const response = await apiClient.get("/kbm/lesson-plan-detail", {
        params: { detail_id: detailId },
      });
      const list = response.data?.data || response.data || [];
      return Array.isArray(list) && list.length > 0 ? list[0] : null;
    } catch {
      return null;
    }
  },

  // Ambil master lembaga untuk filter pimpinan
  getLembagas: async (): Promise<LembagaItem[]> => {
    try {
      const response = await apiClient.get("/master/lembaga");
      const list = response.data?.data || response.data || [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  // Verifikasi 1 Paket RPP oleh Kepala Sekolah
  verifyLessonPlanKepsek: async (payload: {
    p_lesson_plan_id: number;
    p_action: "Disetujui" | "Revisi";
    p_catatan_revisi?: string;
  }) => {
    const response = await apiClient.post("/rpc/verify_lesson_plan_kepsek", payload);
    return response.data;
  },

  // Verifikasi 1 Paket RPP oleh Direktur
  verifyLessonPlanDirektur: async (payload: {
    p_lesson_plan_id: number;
    p_action: "Disetujui" | "Revisi";
    p_catatan_revisi?: string;
  }) => {
    const response = await apiClient.post("/rpc/verify_lesson_plan_direktur", payload);
    return response.data;
  },

  // Verifikasi Per-Pertemuan oleh Kepala Sekolah
  verifyLessonPlanDetailKepsek: async (payload: {
    p_detail_id: number;
    p_action: "Disetujui" | "Revisi";
    p_catatan_revisi?: string;
  }) => {
    const response = await apiClient.post("/rpc/verify_lesson_plan_detail_kepsek", payload);
    return response.data;
  },

  // Verifikasi Per-Pertemuan oleh Direktur
  verifyLessonPlanDetailDirektur: async (payload: {
    p_detail_id: number;
    p_action: "Disetujui" | "Revisi";
    p_catatan_revisi?: string;
  }) => {
    const response = await apiClient.post("/rpc/verify_lesson_plan_detail_direktur", payload);
    return response.data;
  },
};
