import { restClient } from '../axios';
import * as Types from '../../../types/database';

// RPC: Verify Lesson Plan — Kepala Sekolah
export const verifyLessonPlanKepsek = async (payload: Types.VERIFY_LESSON_PLAN_KEPSEK_REQUEST) => {
  const response = await restClient.post('/rpc/verify_lesson_plan_kepsek', payload);
  return response.data;
};

// RPC: Verify Lesson Plan — Direktur
export const verifyLessonPlanDirektur = async (payload: Types.VERIFY_LESSON_PLAN_DIREKTUR_REQUEST) => {
  const response = await restClient.post('/rpc/verify_lesson_plan_direktur', payload);
  return response.data;
};

// RPC: Verify Lesson Plan Detail (Per Pertemuan) — Kepala Sekolah
export const verifyLessonPlanDetailKepsek = async (payload: Types.VERIFY_LESSON_PLAN_DETAIL_KEPSEK_REQUEST) => {
  const response = await restClient.post('/rpc/verify_lesson_plan_detail_kepsek', payload);
  return response.data;
};

// RPC: Verify Lesson Plan Detail (Per Pertemuan) — Direktur
export const verifyLessonPlanDetailDirektur = async (payload: Types.VERIFY_LESSON_PLAN_DETAIL_DIREKTUR_REQUEST) => {
  const response = await restClient.post('/rpc/verify_lesson_plan_detail_direktur', payload);
  return response.data;
};

// RPC: Verify Activity Plan — Direktur
export const verifyActivityPlan = async (payload: Types.VERIFY_ACTIVITY_PLAN_REQUEST) => {
  const response = await restClient.post('/rpc/verify_activity_plan', payload);
  return response.data;
};

// RPC: Monitoring KBM — Agregasi data KBM per lembaga/kelas
export const monitoringKbm = async (payload: Types.MONITORING_KBM_REQUEST) => {
  const rpcPayload = {
    p_lembaga_id: payload.lembaga_id || 0,
    p_kelas_id: payload.kelas_id || 0,
    p_tanggal_mulai: payload.tanggal_mulai,
    p_tanggal_akhir: payload.tanggal_akhir,
  };
  const response = await restClient.post('/rpc/monitoring_kbm', rpcPayload);
  return response.data;
};

// RPC: Absensi Summary — Aggregate attendance summary per class/subject
export const absensiSummary = async (payload: Types.ABSENSI_SUMMARY_REQUEST) => {
  const response = await restClient.post('/rpc/absensi_summary', payload);
  return response.data;
};
