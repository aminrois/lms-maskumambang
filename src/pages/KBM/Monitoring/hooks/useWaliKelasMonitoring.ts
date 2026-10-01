import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { restClient } from "@/lib/api/axios";
import { getLembagas } from "@/lib/api/services/masterService";
import { getMonitoringKbm } from "@/lib/api/services/kbmService";
import { getJadwalPelajarans } from "@/lib/api/services/akademikService";
import type { LEMBAGA } from "@/types/database";
import type { MonitoringKBMResponse } from "../Universal";
import { enrichMonitoringRow } from "./useUniversalMonitoring";

const startOfMonth = () =>
  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);
const endOfMonth = () =>
  new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

export function useWaliKelasMonitoring() {
  const [lembagas, setLembagas] = useState<LEMBAGA[]>([]);
  const [selectedLembagaId, setSelectedLembagaId] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState(startOfMonth());
  const [tanggalAkhir, setTanggalAkhir] = useState(endOfMonth());
  const [rows, setRows] = useState<MonitoringKBMResponse[]>([]);
  const [jadwalsList, setJadwalsList] = useState<any[]>([]);
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
  const [isLoading, setIsLoading] = useState(true);

  // Collapse state untuk info status
  const [isStatusInfoOpen, setIsStatusInfoOpen] = useState(false);
  
  const user = useAuthStore(state => state.user);
  const [isWaliKelas, setIsWaliKelas] = useState<boolean | null>(null);
  const [waliKelasList, setWaliKelasList] = useState<any[]>([]);
  const [waliKelasKelasId, setWaliKelasKelasId] = useState<number | null>(null);
  const [activeClassName, setActiveClassName] = useState("Kelas asuhan belum ditemukan");
  const [activeTeacher, setActiveTeacher] = useState("Wali Kelas");

  useEffect(() => {
    if (user?.pegawai_id) {
      restClient.get('/kelas', { params: { wali_kelas_id: `eq.${user.pegawai_id}`, select: '*,pegawai:pegawai!wali_kelas_id(nama),lembaga(lembaga_id,nama_lembaga,singkatan)', order: 'nama_kelas.asc' } })
        .then(res => {
          const classes = res.data || [];
          const hasClass = classes.length > 0;
          setIsWaliKelas(hasClass);
          setWaliKelasList(classes);
          if (hasClass) {
            setWaliKelasKelasId(prev => {
              const matched = classes.find((c: any) => c.kelas_id === prev);
              if (matched) {
                setActiveClassName(matched.nama_kelas);
                if (matched.lembaga_id) setSelectedLembagaId(String(matched.lembaga_id));
                return matched.kelas_id;
              }
              const firstClass = classes[0];
              setActiveClassName(firstClass.nama_kelas);
              if (firstClass.lembaga_id) {
                setSelectedLembagaId(String(firstClass.lembaga_id));
              }
              return firstClass.kelas_id;
            });
            if (classes[0]?.pegawai?.nama) {
              setActiveTeacher(classes[0].pegawai.nama);
            }
          }
        })
        .catch(() => setIsWaliKelas(false));
    } else {
      setIsWaliKelas(false);
    }
  }, [user]);

  const handleSelectKelas = (kelasId: number | string) => {
    const targetId = Number(kelasId);
    setWaliKelasKelasId(targetId);
    const found = waliKelasList.find((c: any) => c.kelas_id === targetId);
    if (found) {
      setActiveClassName(found.nama_kelas);
      if (found.lembaga_id) {
        setSelectedLembagaId(String(found.lembaga_id));
      }
    }
  };

  useEffect(() => {
    const loadLembagas = async () => {
      try {
        const response = await getLembagas({
          select: "lembaga_id,nama_lembaga,singkatan",
        });
        setLembagas(response);
        setSelectedLembagaId(prev => {
          if (prev) return prev;
          return response[0] ? String(response[0].lembaga_id) : "";
        });
      } catch (error) {
        console.error("Gagal memuat lembaga:", error);
      }
    };

    loadLembagas();
  }, []);

  // Fetch Jadwal Pelajaran for enrichment
  useEffect(() => {
    if (!selectedLembagaId) return;
    // Filter jadwal hanya dari lembaga ini (via kelas.lembaga_id)
    getJadwalPelajarans({
      select: 'jadwal_id,hari,pegawai_id,kelas_id,mapel_id,kelas(nama_kelas,lembaga_id),mapel:mata_pelajaran(nama_mapel),jam_mulai:jam_akademik!jam_mulai_id(jam_mulai),jam_selesai:jam_akademik!jam_selesai_id(jam_selesai)',
      'kelas.lembaga_id': `eq.${selectedLembagaId}`,
    })
      .then(data => setJadwalsList(data || []))
      .catch(() => setJadwalsList([]));
  }, [selectedLembagaId]);

  useEffect(() => {
    const loadMonitoring = async () => {
      if (!selectedLembagaId || !waliKelasKelasId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await getMonitoringKbm({
          lembaga_id: Number(selectedLembagaId),
          kelas_id: Number(waliKelasKelasId),
          tanggal_mulai: tanggalMulai,
          tanggal_akhir: tanggalAkhir,
        });
        
        const computedResponse = response.map((item: any) => enrichMonitoringRow(item, jadwalsList));
        setRows(computedResponse);
      } catch (error) {
        console.error("Gagal memuat monitoring wali kelas:", error);
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMonitoring();
  }, [selectedLembagaId, waliKelasKelasId, tanggalMulai, tanggalAkhir, jadwalsList]);

  const baseFilteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        `${row.nama_guru} ${row.nama_mapel} ${row.nama_kelas} ${row.hari || ''} ${row.jam || ''}`
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [rows, debouncedSearchTerm]);

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
  }, [debouncedSearchTerm, statusFilter]);

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

  return {
    isWaliKelas,
    waliKelasList,
    waliKelasKelasId,
    handleSelectKelas,
    activeClassName,
    activeTeacher,
    lembagas,
    selectedLembagaId,
    setSelectedLembagaId,
    tanggalMulai,
    setTanggalMulai,
    tanggalAkhir,
    setTanggalAkhir,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    isStatusInfoOpen,
    setIsStatusInfoOpen,
    rows,
    isLoading,
    baseFilteredRows,
    filteredRows,
    totalPages,
    paginatedRows,
    summary,
    selectedLembaga,
  };
}
