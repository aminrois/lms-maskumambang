import { restClient } from "../axios";
import * as Types from "../../../types/database";

// LESSON_PLAN CRUD
export const getLessonPlans = async (
  params?: Record<string, any>,
): Promise<Types.LESSON_PLAN[]> => {
  const response = await restClient.get<Types.LESSON_PLAN[]>("/lesson_plan", {
    params,
  });
  return response.data;
};

// Fetch semua lesson_plan dengan pagination untuk menghindari limit 1000 baris Supabase.
export const getAllLessonPlans = async (
  params?: Record<string, any>,
): Promise<Types.LESSON_PLAN[]> => {
  const PAGE_SIZE = 1000;
  let allData: Types.LESSON_PLAN[] = [];
  let page = 0;

  while (true) {
    const response = await restClient.get<Types.LESSON_PLAN[]>("/lesson_plan", {
      params: { ...params, limit: PAGE_SIZE, offset: page * PAGE_SIZE },
    });
    const data = response.data || [];
    allData = [...allData, ...data];
    if (data.length < PAGE_SIZE) break;
    page++;
  }

  return allData;
};

export const getLessonPlanById = async (
  id: string | number,
): Promise<Types.LESSON_PLAN> => {
  const response = await restClient.get<Types.LESSON_PLAN[]>(
    `/lesson_plan?lesson_plan_id=eq.${id}`,
  );
  return response.data[0];
};

export const createLessonPlan = async (
  payload: Types.LESSON_PLAN_CREATE,
): Promise<Types.LESSON_PLAN> => {
  const response = await restClient.post<Types.LESSON_PLAN[]>(
    "/lesson_plan",
    payload,
    {
      headers: { Prefer: "return=representation" },
    },
  );
  return response.data[0];
};

export const updateLessonPlan = async (
  id: string | number,
  payload: Types.LESSON_PLAN_UPDATE,
): Promise<Types.LESSON_PLAN> => {
  const response = await restClient.patch<Types.LESSON_PLAN[]>(
    `/lesson_plan?lesson_plan_id=eq.${id}`,
    payload,
    {
      headers: { Prefer: "return=representation" },
    },
  );
  return response.data[0];
};

export const deleteLessonPlan = async (id: string | number): Promise<void> => {
  await restClient.delete(`/lesson_plan?lesson_plan_id=eq.${id}`);
};

// LESSON_PLAN_DETAIL CRUD
export const getLessonPlanDetails = async (
  params?: Record<string, any>,
): Promise<Types.LESSON_PLAN_DETAIL[]> => {
  const response = await restClient.get<Types.LESSON_PLAN_DETAIL[]>(
    "/lesson_plan_detail",
    { params },
  );
  return response.data;
};

// Fetch semua lesson_plan_detail dengan pagination untuk menghindari limit 1000 baris Supabase.
// 100 RPP × 16 pertemuan = 1.600 baris → wajib dipaginasi.
export const getAllLessonPlanDetails = async (
  params?: Record<string, any>,
): Promise<Types.LESSON_PLAN_DETAIL[]> => {
  const PAGE_SIZE = 1000;
  let allData: Types.LESSON_PLAN_DETAIL[] = [];
  let page = 0;

  while (true) {
    const response = await restClient.get<Types.LESSON_PLAN_DETAIL[]>(
      "/lesson_plan_detail",
      { params: { ...params, limit: PAGE_SIZE, offset: page * PAGE_SIZE } },
    );
    const data = response.data || [];
    allData = [...allData, ...data];
    if (data.length < PAGE_SIZE) break;
    page++;
  }

  return allData;
};

export const getLessonPlanDetailById = async (
  id: string | number,
): Promise<Types.LESSON_PLAN_DETAIL> => {
  const response = await restClient.get<Types.LESSON_PLAN_DETAIL[]>(
    `/lesson_plan_detail?detail_id=eq.${id}`,
  );
  return response.data[0];
};

export const createLessonPlanDetail = async (
  payload: Types.LESSON_PLAN_DETAIL_CREATE,
): Promise<Types.LESSON_PLAN_DETAIL> => {
  const response = await restClient.post<Types.LESSON_PLAN_DETAIL[]>(
    "/lesson_plan_detail",
    payload,
    {
      headers: { Prefer: "return=representation" },
    },
  );
  return response.data[0];
};

export const updateLessonPlanDetail = async (
  id: string | number,
  payload: Types.LESSON_PLAN_DETAIL_UPDATE,
): Promise<Types.LESSON_PLAN_DETAIL> => {
  const response = await restClient.patch<Types.LESSON_PLAN_DETAIL[]>(
    `/lesson_plan_detail?detail_id=eq.${id}`,
    payload,
    {
      headers: { Prefer: "return=representation" },
    },
  );
  return response.data[0];
};

// Terapkan template ke pertemuan yang BELUM memiliki isi (isi IS NULL)
// RPP yang sudah memiliki isi tidak akan ditimpa
// lessonPlanIds: opsional — jika diberikan, hanya update detail milik lesson_plan tersebut
export const batchUpdateEmptyLessonPlanDetails = async (
  templateContent: string,
  lessonPlanIds?: number[],
): Promise<void> => {
  if (lessonPlanIds && lessonPlanIds.length > 0) {
    // Update hanya pertemuan kosong (isi NULL atau empty string) milik lesson_plan yang dipilih
    await restClient.patch(
      `/lesson_plan_detail?or=(isi.is.null,isi.eq.)&lesson_plan_id=in.(${lessonPlanIds.join(",")})`,
      { isi: templateContent },
    );
  } else {
    // Fallback: update semua pertemuan yang isi NULL atau empty string
    await restClient.patch(
      `/lesson_plan_detail?or=(isi.is.null,isi.eq.)`,
      { isi: templateContent },
    );
  }
};

export const deleteLessonPlanDetail = async (
  id: string | number,
): Promise<void> => {
  await restClient.delete(`/lesson_plan_detail?detail_id=eq.${id}`);
};


// JURNAL_MENGAJAR CRUD
export const getJurnalMengajars = async (
  params?: Record<string, any>,
): Promise<Types.JURNAL_MENGAJAR[]> => {
  const response = await restClient.get<Types.JURNAL_MENGAJAR[]>(
    "/jurnal_mengajar",
    { params },
  );
  return response.data;
};

export const getJurnalMengajarById = async (
  id: string | number,
): Promise<Types.JURNAL_MENGAJAR> => {
  const response = await restClient.get<Types.JURNAL_MENGAJAR[]>(
    `/jurnal_mengajar?jurnal_id=eq.${id}`,
  );
  return response.data[0];
};


export const createJurnalMengajar = async (
  payload: Types.JURNAL_MENGAJAR_CREATE,
): Promise<Types.JURNAL_MENGAJAR> => {
  const response = await restClient.post<Types.JURNAL_MENGAJAR[]>(
    "/jurnal_mengajar",
    payload,
    {
      headers: { Prefer: "return=representation" },
    },
  );
  return response.data[0];
};

export const updateJurnalMengajar = async (
  id: string | number,
  payload: Types.JURNAL_MENGAJAR_UPDATE,
): Promise<Types.JURNAL_MENGAJAR> => {
  const response = await restClient.patch<Types.JURNAL_MENGAJAR[]>(
    `/jurnal_mengajar?jurnal_id=eq.${id}`,
    payload,
    {
      headers: { Prefer: "return=representation" },
    },
  );
  return response.data[0];
};

export const deleteJurnalMengajar = async (
  id: string | number,
): Promise<void> => {
  await restClient.delete(`/jurnal_mengajar?jurnal_id=eq.${id}`);
};

// Hapus semua jurnal mengajar yang terhubung ke lesson_plan_detail_ids tertentu (batch)
export const deleteJurnalMengajarByDetailIds = async (
  detailIds: number[],
): Promise<void> => {
  if (!detailIds || detailIds.length === 0) return;
  await restClient.delete(`/jurnal_mengajar?lesson_plan_detail_id=in.(${detailIds.join(',')})`);
};

// ABSENSI_PELAJARAN CRUD
export const getAbsensiPelajarans = async (
  params?: Record<string, any>,
): Promise<Types.ABSENSI_PELAJARAN[]> => {
  const response = await restClient.get<Types.ABSENSI_PELAJARAN[]>(
    "/absensi_pelajaran",
    { params },
  );
  return response.data;
};

export const getAbsensiPelajaranById = async (
  id: string | number,
): Promise<Types.ABSENSI_PELAJARAN> => {
  const response = await restClient.get<Types.ABSENSI_PELAJARAN[]>(
    `/absensi_pelajaran?absensi_pel_id=eq.${id}`,
  );
  return response.data[0];
};

export const createAbsensiPelajaran = async (
  payload: Types.ABSENSI_PELAJARAN_CREATE,
): Promise<Types.ABSENSI_PELAJARAN> => {
  const response = await restClient.post<Types.ABSENSI_PELAJARAN[]>(
    "/absensi_pelajaran",
    payload,
    {
      headers: { Prefer: "return=representation" },
    },
  );
  return response.data[0];
};

export const updateAbsensiPelajaran = async (
  id: string | number,
  payload: Types.ABSENSI_PELAJARAN_UPDATE,
): Promise<Types.ABSENSI_PELAJARAN> => {
  const response = await restClient.patch<Types.ABSENSI_PELAJARAN[]>(
    `/absensi_pelajaran?absensi_pel_id=eq.${id}`,
    payload,
    {
      headers: { Prefer: "return=representation" },
    },
  );
  return response.data[0];
};

export const deleteAbsensiPelajaran = async (
  id: string | number,
): Promise<void> => {
  await restClient.delete(`/absensi_pelajaran?absensi_pel_id=eq.${id}`);
};

// RPC helpers
export const verifyActivityPlan = async (
  payload: Types.VERIFY_ACTIVITY_PLAN_REQUEST,
): Promise<void> => {
  const rpcPayload = {
    p_activity_id: payload.activity_id,
    p_action: payload.action,
    p_catatan_revisi: payload.catatan_revisi
  };
  await restClient.post("/rpc/verify_activity_plan", rpcPayload);
};

export const verifyLessonPlanDetailKepsek = async (
  payload: Types.VERIFY_LESSON_PLAN_DETAIL_KEPSEK_REQUEST,
): Promise<void> => {
  if (payload.p_action === "Disetujui") {
    await restClient.patch(`/lesson_plan_detail?detail_id=eq.${payload.p_detail_id}`, {
      status_verifikasi_kepsek: "Disetujui",
      catatan_revisi_kepsek: "",
      status_verifikasi_direktur: "Menunggu Verifikasi",
      catatan_revisi_direktur: "",
      verified_by_kepsek: payload.p_verified_by || null,
    });
  } else if (payload.p_action === "Revisi") {
    await restClient.patch(`/lesson_plan_detail?detail_id=eq.${payload.p_detail_id}`, {
      status_verifikasi_kepsek: "Revisi",
      catatan_revisi_kepsek: payload.p_catatan_revisi || "",
      verified_by_kepsek: payload.p_verified_by || null,
    });
  }
};

export const verifyLessonPlanDetailDirektur = async (
  payload: Types.VERIFY_LESSON_PLAN_DETAIL_DIREKTUR_REQUEST,
): Promise<void> => {
  if (payload.p_action === "Disetujui") {
    await restClient.patch(`/lesson_plan_detail?detail_id=eq.${payload.p_detail_id}`, {
      status_verifikasi_direktur: "Disetujui",
      catatan_revisi_direktur: "",
      verified_by_direktur: payload.p_verified_by || null,
    });
  } else if (payload.p_action === "Revisi") {
    await restClient.patch(`/lesson_plan_detail?detail_id=eq.${payload.p_detail_id}`, {
      status_verifikasi_direktur: "Revisi",
      catatan_revisi_direktur: payload.p_catatan_revisi || "",
      verified_by_direktur: payload.p_verified_by || null,
    });
  }
};

export const verifyLessonPlanKepsek = async (
  payload: Types.VERIFY_LESSON_PLAN_KEPSEK_REQUEST,
): Promise<void> => {
  if (payload.p_action === "Disetujui") {
    await restClient.patch(`/lesson_plan?lesson_plan_id=eq.${payload.p_lesson_plan_id}`, {
      status_verifikasi_kepsek: "Disetujui",
      catatan_revisi_kepsek: "",
      status_verifikasi_direktur: "Menunggu Verifikasi",
    });
    // Juga setujui semua detail pertemuan untuk RPP ini
    await restClient.patch(`/lesson_plan_detail?lesson_plan_id=eq.${payload.p_lesson_plan_id}`, {
      status_verifikasi_kepsek: "Disetujui",
      catatan_revisi_kepsek: "",
      status_verifikasi_direktur: "Menunggu Verifikasi",
      catatan_revisi_direktur: "",
    });
  } else if (payload.p_action === "Revisi") {
    await restClient.patch(`/lesson_plan?lesson_plan_id=eq.${payload.p_lesson_plan_id}`, {
      status_verifikasi_kepsek: "Revisi",
      catatan_revisi_kepsek: payload.p_catatan_revisi || "",
    });
    await restClient.patch(`/lesson_plan_detail?lesson_plan_id=eq.${payload.p_lesson_plan_id}`, {
      status_verifikasi_kepsek: "Revisi",
      catatan_revisi_kepsek: payload.p_catatan_revisi || "",
    });
  }
};

export const verifyLessonPlanDirektur = async (
  payload: Types.VERIFY_LESSON_PLAN_DIREKTUR_REQUEST,
): Promise<void> => {
  if (payload.p_action === "Disetujui") {
    await restClient.patch(`/lesson_plan?lesson_plan_id=eq.${payload.p_lesson_plan_id}`, {
      status_verifikasi_direktur: "Disetujui",
      catatan_revisi_direktur: "",
    });
    // Juga setujui semua detail pertemuan yang sudah disetujui kepsek
    await restClient.patch(`/lesson_plan_detail?lesson_plan_id=eq.${payload.p_lesson_plan_id}&status_verifikasi_kepsek=eq.Disetujui`, {
      status_verifikasi_direktur: "Disetujui",
      catatan_revisi_direktur: "",
    });
  } else if (payload.p_action === "Revisi") {
    await restClient.patch(`/lesson_plan?lesson_plan_id=eq.${payload.p_lesson_plan_id}`, {
      status_verifikasi_direktur: "Revisi",
      catatan_revisi_direktur: payload.p_catatan_revisi || "",
    });
    await restClient.patch(`/lesson_plan_detail?lesson_plan_id=eq.${payload.p_lesson_plan_id}&status_verifikasi_kepsek=eq.Disetujui`, {
      status_verifikasi_direktur: "Revisi",
      catatan_revisi_direktur: payload.p_catatan_revisi || "",
    });
  }
};

export const getMonitoringKbm = async (
  payload: Types.MONITORING_KBM_REQUEST,
): Promise<any[]> => {
  const rpcPayload = {
    p_lembaga_id: payload.lembaga_id || 0,
    p_kelas_id: payload.kelas_id ?? null,
    p_tanggal_mulai: payload.tanggal_mulai,
    p_tanggal_akhir: payload.tanggal_akhir,
  };
  const response = await restClient.post<any[]>("/rpc/monitoring_kbm", rpcPayload);
  return response.data;
};

export const getAbsensiSummary = async (
  payload: Types.ABSENSI_SUMMARY_REQUEST,
): Promise<any[]> => {
  const rpcPayload = {
    p_lembaga_id: payload.lembaga_id || 0,
    p_kelas_id: payload.kelas_id ?? null,
    p_mapel_id: payload.mapel_id ?? null,
    p_tanggal_mulai: payload.tanggal_mulai,
    p_tanggal_akhir: payload.tanggal_akhir,
  };

  const response = await restClient.post<any[]>(
    "/rpc/absensi_summary",
    rpcPayload,
  );
  return response.data;
};

export interface AbsensiHarianSummaryResponse {
  kelas_id: number;
  nama_kelas: string;
  total_siswa: number;
  total_hadir: number;
  total_dispen: number;
  total_hari: number;
  total_sakit: number;
  total_izin: number;
  total_alpha: number;
}

export const getAbsensiHarianSummary = async (params: {
  p_lembaga_id: number;
  p_kelas_id?: number | null;
  p_tanggal_mulai?: string | null;
  p_tanggal_akhir?: string | null;
}): Promise<AbsensiHarianSummaryResponse[]> => {
  const response = await restClient.post<AbsensiHarianSummaryResponse[]>(
    "/rpc/absensi_harian_summary",
    params
  );
  return response.data;
};

export const getAbsensiHarians = async (
  params?: Record<string, any>,
): Promise<Types.ABSENSI_HARIAN[]> => {
  const response = await restClient.get<Types.ABSENSI_HARIAN[]>("/absensi_harian", {
    params,
  });
  return response.data;
};

export const upsertAbsensiHarian = async (
  payload: Types.ABSENSI_HARIAN_CREATE[],
): Promise<Types.ABSENSI_HARIAN[]> => {
  const response = await restClient.post<Types.ABSENSI_HARIAN[]>(
    "/absensi_harian",
    payload,
    {
      headers: { Prefer: "return=representation,resolution=merge-duplicates" },
      params: { on_conflict: "siswa_id,tanggal" }
    }
  );
  return response.data;
};
