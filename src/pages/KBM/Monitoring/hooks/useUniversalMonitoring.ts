import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { getLembagas } from "@/lib/api/services/masterService";
import { getMonitoringKbm } from "@/lib/api/services/kbmService";
import { getKelass, getJadwalPelajarans } from "@/lib/api/services/akademikService";
import type { MonitoringKBMResponse } from "../Universal";
import { useFeatureRealtimeSync } from "@/hooks/useRealtimeSync";

const HARI_MAP = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function enrichMonitoringRow(item: any, jadwalsList: any[] = []): MonitoringKBMResponse {
  const nama_guru = item.nama_guru || item.jadwal?.pegawai?.nama || item.pegawai?.nama || "Guru";
  const nama_mapel = item.nama_mapel || item.jadwal?.mapel?.nama_mapel || item.mapel?.nama_mapel || "Mata Pelajaran";
  const nama_kelas = item.nama_kelas || item.jadwal?.kelas?.nama_kelas || item.kelas?.nama_kelas || "Kelas";
  const pertemuan_ke = item.pertemuan_ke || 1;
  const lp_pertemuan_ke = item.lp_pertemuan_ke || item.lesson_plan_detail?.pertemuan_ke || pertemuan_ke;

  const rawTglRencana = item.tanggal_rencana || item.lesson_plan_detail?.rencana_pelaksanaan_kbm || item.tgl_rencana || item.tanggal_target || item.tgl_target || item.tanggal_rpp || item.rpp_tanggal || item.tanggal_lesson_plan || "";
  const rawTglAbsensi = item.tanggal;

  let computedStatus = item.status;
  if (!computedStatus || computedStatus === "Sesuai") {
    if (rawTglRencana && rawTglAbsensi) {
      const tglRencana = String(rawTglRencana).split(' ')[0].trim().substring(0, 10);
      const tglAbsensi = String(rawTglAbsensi).split(' ')[0].trim().substring(0, 10);
      
      if (tglAbsensi === tglRencana) {
        computedStatus = "Sesuai";
      } else if (tglAbsensi > tglRencana) {
        computedStatus = "Terlambat";
      } else if (tglAbsensi < tglRencana) {
        computedStatus = "Terlalu Cepat";
      }
    } else if (pertemuan_ke && lp_pertemuan_ke) {
      if (pertemuan_ke === lp_pertemuan_ke) computedStatus = "Sesuai";
      else if (pertemuan_ke < lp_pertemuan_ke) computedStatus = "Terlambat";
      else computedStatus = "Terlalu Cepat";
    }
  }

  // 1. Determine Hari
  let hari = item.hari || item.jadwal?.hari || item.jadwal_hari || item.hari_nama;
  if (!hari && rawTglAbsensi) {
    const d = new Date(rawTglAbsensi);
    if (!isNaN(d.getTime())) {
      hari = HARI_MAP[d.getDay()];
    }
  }

  // 2. Determine Jam
  let jam = item.jam || item.jam_ke || item.lp_jam || item.jam_pelajaran || item.alokasi_waktu;
  if (!jam && item.jadwal?.jam_mulai) {
    const jm = item.jadwal.jam_mulai.jam_mulai?.substring(0, 5);
    const js = item.jadwal.jam_selesai?.jam_selesai?.substring(0, 5);
    if (jm && js) jam = `${jm} - ${js}`;
    else jam = `Jam ${item.jadwal.jam_mulai.urutan_jam}`;
  }
  
  // Match with jadwal_pelajaran if needed
  if (jadwalsList && jadwalsList.length > 0) {
    const matched = jadwalsList.find((j: any) => 
      (j.kelas?.nama_kelas === nama_kelas || j.kelas_id === item.kelas_id) &&
      (j.mapel?.nama_mapel === nama_mapel || j.mapel_id === item.mapel_id)
    );
    if (matched) {
      if (!hari && matched.hari) hari = matched.hari;
      if (!jam && matched.jam_mulai?.jam_mulai && matched.jam_selesai?.jam_selesai) {
        const jm = matched.jam_mulai.jam_mulai.substring(0, 5);
        const js = matched.jam_selesai.jam_selesai.substring(0, 5);
        jam = `${jm} - ${js}`;
      }
    }
  }

  if (!hari) hari = "—";
  if (!jam) {
    jam = pertemuan_ke ? `Pertemuan ke-${pertemuan_ke}` : "—";
  }

  return {
    ...item,
    id: item.id || item.jurnal_id,
    nama_guru,
    nama_mapel,
    nama_kelas,
    pertemuan_ke,
    lp_pertemuan_ke,
    tanggal_rencana: rawTglRencana || item.tanggal_rencana || item.tanggal || "",
    status: computedStatus || "Sesuai",
    hari,
    jam,
  } as MonitoringKBMResponse;
}

const startOfMonth = () =>
  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);
const endOfMonth = () =>
  new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

export function useUniversalMonitoring() {
  const { role, lembaga_id } = useAuthStore();
  const isGlobalRole = role === 'Direktur';

  useFeatureRealtimeSync("KBM_JURNAL_MENGAJAR");
  useFeatureRealtimeSync("KBM_LESSON_PLAN");

  const [selectedLembagaId, setSelectedLembagaId] = useState("");
  const [selectedKelasId, setSelectedKelasId] = useState("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);

  const [isStatusInfoOpen, setIsStatusInfoOpen] = useState(false);
  const [tanggalMulai, setTanggalMulai] = useState(startOfMonth());
  const [tanggalAkhir, setTanggalAkhir] = useState(endOfMonth());

  const [step, setStep] = useState<'select_lembaga' | 'select_kelas' | 'display_results'>(
    isGlobalRole ? 'select_lembaga' : 'select_kelas'
  );

  // Sync role and lembaga_id
  useEffect(() => {
    if (!isGlobalRole && lembaga_id) {
      setSelectedLembagaId(String(lembaga_id));
      setStep('select_kelas');
    }
  }, [isGlobalRole, lembaga_id]);

  // Load Lembagas (Global Role Only)
  const { data: lembagas = [] } = useQuery({
    queryKey: ['master-data', 'lembaga-options'],
    staleTime: 10 * 60 * 1000,
    queryFn: () => getLembagas({ select: "lembaga_id,nama_lembaga,singkatan" }),
  });

  // Load Kelases
  const { data: kelases = [] } = useQuery({
    queryKey: ['options', 'kelas-lembaga', selectedLembagaId],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      if (!selectedLembagaId) return [];
      return await getKelass({
        lembaga_id: `eq.${selectedLembagaId}`,
        select: "kelas_id,nama_kelas",
        order: "nama_kelas.asc"
      });
    },
    enabled: !!selectedLembagaId
  });

  // Load Jadwal Pelajaran for Hari & Jam enrichment
  const { data: jadwals = [] } = useQuery({
    queryKey: ['monitoring', 'jadwal-enrichment', selectedLembagaId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!selectedLembagaId) return [];
      // Filter by kelas.lembaga_id agar hanya jadwal lembaga ini yang diambil
      return await getJadwalPelajarans({
        select: 'jadwal_id,hari,pegawai_id,kelas_id,mapel_id,kelas(nama_kelas,lembaga_id),mapel:mata_pelajaran(nama_mapel),jam_mulai:jam_akademik!jam_mulai_id(jam_mulai),jam_selesai:jam_akademik!jam_selesai_id(jam_selesai)',
        'kelas.lembaga_id': `eq.${selectedLembagaId}`,
      });
    },
    enabled: !!selectedLembagaId && step === 'display_results'
  });

  // Load Monitoring Data
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['kbm', 'monitoring', selectedLembagaId, selectedKelasId, tanggalMulai, tanggalAkhir, jadwals],
    staleTime: 60 * 1000,
    queryFn: async () => {
      if (!selectedLembagaId || step !== 'display_results') {
        return [];
      }
      const payload: any = {
        lembaga_id: Number(selectedLembagaId),
        tanggal_mulai: tanggalMulai,
        tanggal_akhir: tanggalAkhir,
      };
      if (selectedKelasId !== "Semua") {
        payload.kelas_id = Number(selectedKelasId);
      }
      const response = await getMonitoringKbm(payload);
      return response.map((item: any) => enrichMonitoringRow(item, jadwals));
    },
    enabled: !!selectedLembagaId && step === 'display_results'
  });

  const baseFilteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        `${row.nama_guru} ${row.nama_mapel} ${row.nama_kelas} ${row.hari || ''} ${row.jam || ''}`
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());
      const matchesKelas = selectedKelasId === "Semua" || 
        String(row.kelas_id) === String(selectedKelasId) || 
        row.nama_kelas === kelases.find(k => String(k.kelas_id) === selectedKelasId)?.nama_kelas;
      return matchesSearch && matchesKelas;
    });
  }, [rows, debouncedSearchTerm, selectedKelasId, kelases]);

  const filteredRows = useMemo(() => {
    return baseFilteredRows.filter((row) => {
      if (statusFilter === "Semua") return true;
      const s = (row.status || "").trim();
      if (statusFilter === "Terlambat" || statusFilter === "Tertinggal") {
        return s === "Terlambat" || s === "Tertinggal";
      }
      return s === statusFilter;
    });
  }, [baseFilteredRows, statusFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedKelasId, statusFilter]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE) || 1;
  const paginatedRows = useMemo(() => {
    return filteredRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const summary = useMemo(() => {
    return {
      terlambat: baseFilteredRows.filter((row) => {
        const s = (row.status || "").trim();
        return s === "Terlambat" || s === "Tertinggal";
      }).length,
      sesuai: baseFilteredRows.filter((row) => (row.status || "").trim() === "Sesuai").length,
      cepat: baseFilteredRows.filter((row) => (row.status || "").trim() === "Terlalu Cepat").length,
    };
  }, [baseFilteredRows]);

  const selectedLembaga = useMemo(() => lembagas.find((l) => String(l.lembaga_id) === selectedLembagaId), [lembagas, selectedLembagaId]);
  const selectedKelas = useMemo(() => kelases.find((k) => String(k.kelas_id) === selectedKelasId), [kelases, selectedKelasId]);

  return {
    role,
    isGlobalRole,
    lembagas,
    kelases,
    selectedLembagaId,
    setSelectedLembagaId,
    selectedKelasId,
    setSelectedKelasId,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    isStatusInfoOpen,
    setIsStatusInfoOpen,
    tanggalMulai,
    setTanggalMulai,
    tanggalAkhir,
    setTanggalAkhir,
    rows,
    isLoading,
    step,
    setStep,
    baseFilteredRows,
    filteredRows,
    totalPages,
    paginatedRows,
    summary,
    selectedLembaga,
    selectedKelas
  };
}
