import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { restClient } from "@/lib/api/axios";
import { useAuthStore } from "@/store/useAuthStore";
import type { ABSENSI_SUMMARY_REQUEST } from "@/types/database";

export function useRekapSiswa() {
  const { role, lembaga_id, user } = useAuthStore();
  const isGlobalRole = role === 'Direktur';
  const isGuru = role === 'Guru' || role === 'Wali Kelas';
  const pegawai_id = user?.pegawai_id;

  // Default dates: 1st of current month to today
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const [filter, setFilter] = useState<ABSENSI_SUMMARY_REQUEST>({
    lembaga_id: isGlobalRole ? 0 : (lembaga_id || 0),
    tanggal_mulai: formatDate(firstDay),
    tanggal_akhir: formatDate(today),
    kelas_id: undefined,
    mapel_id: undefined
  });

  const [step, setStep] = useState<'select_lembaga' | 'select_kelas' | 'display_results'>(
    isGlobalRole ? 'select_lembaga' : 'select_kelas'
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Sync role and lembaga_id
  useEffect(() => {
    if (!isGlobalRole && lembaga_id) {
      setFilter(prev => ({ ...prev, lembaga_id: lembaga_id }));
      setStep('select_kelas');
    }
  }, [isGlobalRole, lembaga_id]);

  // Fetch Options
  const { data: lembagas = [] } = useQuery({
    queryKey: ['options', 'lembaga'],
    queryFn: async () => {
      const res = await restClient.get('/lembaga?select=lembaga_id,nama_lembaga,singkatan');
      return res.data || [];
    }
  });

  // Fetch kelas untuk Guru: hanya kelas yang ada di jadwal_pelajaran milik guru ini
  const { data: kelasGuru = [], isLoading: isKelasGuruLoading } = useQuery({
    queryKey: ['options', 'kelas-guru', pegawai_id],
    queryFn: async () => {
      if (!pegawai_id) return [];
      const res = await restClient.get(
        `/jadwal_pelajaran?pegawai_id=eq.${pegawai_id}&select=kelas_id,kelas(kelas_id,nama_kelas)`
      );
      const data: any[] = res.data || [];
      const kelasMap = new Map<number, any>();
      data.forEach((item: any) => {
        if (item.kelas && item.kelas_id) {
          kelasMap.set(item.kelas_id, { kelas_id: item.kelas.kelas_id, nama_kelas: item.kelas.nama_kelas });
        }
      });
      return Array.from(kelasMap.values());
    },
    enabled: isGuru && !!pegawai_id
  });

  // Fetch semua kelas berdasarkan lembaga (untuk non-guru)
  const { data: kelasLembaga = [] } = useQuery({
    queryKey: ['options', 'kelas', filter.lembaga_id],
    queryFn: async () => {
      if (!filter.lembaga_id) return [];
      const url = `/kelas?lembaga_id=eq.${filter.lembaga_id}&select=kelas_id,nama_kelas`;
      const res = await restClient.get(url);
      return res.data || [];
    },
    enabled: !isGuru && !!filter.lembaga_id
  });

  // Pilih sumber kelas yang benar
  const kelases = isGuru ? kelasGuru : kelasLembaga;

  // Fetch Mata Pelajaran: jika guru, HANYA ambil mapel yang diampu oleh guru ini
  const { data: mapels = [] } = useQuery({
    queryKey: ['options', 'mapel', isGuru, pegawai_id, filter.kelas_id, filter.lembaga_id],
    queryFn: async () => {
      if (isGuru && pegawai_id) {
        let url = `/jadwal_pelajaran?pegawai_id=eq.${pegawai_id}&select=mapel_id,kelas_id,mapel:mapel_id(mapel_id,nama_mapel)`;
        if (filter.kelas_id) {
          url += `&kelas_id=eq.${filter.kelas_id}`;
        }
        const res = await restClient.get(url);
        const list: any[] = res.data || [];
        const mapelMap = new Map<number, any>();
        const missingIds: number[] = [];

        list.forEach((item: any) => {
          if (item.mapel && item.mapel.mapel_id) {
            mapelMap.set(item.mapel.mapel_id, item.mapel);
          } else if (item.mapel_id) {
            if (!mapelMap.has(item.mapel_id)) {
              missingIds.push(item.mapel_id);
            }
          }
        });

        if (missingIds.length > 0) {
          try {
            const mRes = await restClient.get(`/mata_pelajaran?mapel_id=in.(${missingIds.join(',')})&select=mapel_id,nama_mapel`);
            (mRes.data || []).forEach((m: any) => mapelMap.set(m.mapel_id, m));
          } catch (_) {}
        }

        return Array.from(mapelMap.values()).sort((a, b) => (a.nama_mapel || '').localeCompare(b.nama_mapel || ''));
      } else {
        let url = '/mata_pelajaran?select=mapel_id,nama_mapel';
        if (filter.lembaga_id) {
          url += `&lembaga_id=eq.${filter.lembaga_id}`;
        }
        const res = await restClient.get(url);
        return (res.data || []).sort((a: any, b: any) => (a.nama_mapel || '').localeCompare(b.nama_mapel || ''));
      }
    }
  });

  // Auto-select mapel pertama untuk Guru (menghilangkan kondisi 'Semua Mapel')
  useEffect(() => {
    if (isGuru && mapels.length > 0) {
      const isValid = mapels.some((m: any) => m.mapel_id === filter.mapel_id);
      if (!isValid) {
        setFilter(prev => ({ ...prev, mapel_id: mapels[0].mapel_id }));
      }
    }
  }, [isGuru, mapels, filter.mapel_id]);

  // 1. Fetch Students in the selected class
  const { data: siswaList = [], isLoading: isSiswaLoading, isError: isSiswaError } = useQuery({
    queryKey: ['kbm', 'rekap-siswa-list', filter.kelas_id],
    queryFn: async () => {
      if (!filter.kelas_id) return [];
      const res = await restClient.get(`/siswa?kelas_id=eq.${filter.kelas_id}&select=siswa_id,nama,nis,nisn`);
      return res.data || [];
    },
    enabled: step === 'display_results' && filter.kelas_id !== undefined,
  });

  // 2. Fetch Jurnals and Absensi Pelajaran raw data for the class and date range
  const { data: rawJurnalsData = { jurnals: [], absensi: [] }, isLoading: isAbsensiLoading, isError: isAbsensiError } = useQuery<{ jurnals: any[]; absensi: any[] }>({
    queryKey: ['kbm', 'rekap-absensi-raw', filter.kelas_id, filter.mapel_id, filter.tanggal_mulai, filter.tanggal_akhir],
    queryFn: async () => {
      if (!filter.kelas_id) return { jurnals: [], absensi: [] };
      
      let url = `/jurnal_mengajar?select=jurnal_id,tanggal,status,catatan_tambahan,pertemuan_ke,jadwal_pelajaran!inner(jadwal_id,kelas_id,mapel_id,pegawai_id,hari,mapel:mapel_id(nama_mapel),pegawai:pegawai_id(nama_lengkap),jam_mulai:jam_akademik!jam_mulai_id(jam_mulai,jam_selesai),jam_selesai:jam_akademik!jam_selesai_id(jam_mulai,jam_selesai))`;
      url += `&jadwal_pelajaran.kelas_id=eq.${filter.kelas_id}`;
      if (filter.mapel_id) {
        url += `&jadwal_pelajaran.mapel_id=eq.${filter.mapel_id}`;
      }
      if (filter.tanggal_mulai) {
        url += `&tanggal=gte.${filter.tanggal_mulai}`;
      }
      if (filter.tanggal_akhir) {
        url += `&tanggal=lte.${filter.tanggal_akhir}`;
      }
      url += `&order=tanggal.desc`;
      
      let jurnals: any[] = [];
      try {
        const jurnalsRes = await restClient.get(url);
        jurnals = jurnalsRes.data || [];
      } catch (_) {
        try {
          const fallbackUrl = `/jurnal_mengajar?select=jurnal_id,tanggal,status,catatan_tambahan,pertemuan_ke,jadwal_pelajaran!inner(jadwal_id,kelas_id,mapel_id,pegawai_id,hari)&jadwal_pelajaran.kelas_id=eq.${filter.kelas_id}${filter.mapel_id ? `&jadwal_pelajaran.mapel_id=eq.${filter.mapel_id}` : ''}${filter.tanggal_mulai ? `&tanggal=gte.${filter.tanggal_mulai}` : ''}${filter.tanggal_akhir ? `&tanggal=lte.${filter.tanggal_akhir}` : ''}&order=tanggal.desc`;
          const fallbackRes = await restClient.get(fallbackUrl);
          jurnals = fallbackRes.data || [];
        } catch (e) {
          console.error("Gagal mengambil data jurnal mengajar:", e);
          jurnals = [];
        }
      }
      
      const jurnalIds = jurnals.map((j: any) => j.jurnal_id);
      if (jurnalIds.length === 0) return { jurnals: [], absensi: [] };
      
      // Now fetch absensi for these jurnal_ids
      const chunkSize = 100;
      let allAbsensi: any[] = [];
      for (let i = 0; i < jurnalIds.length; i += chunkSize) {
        const chunk = jurnalIds.slice(i, i + chunkSize);
        const absRes = await restClient.get(`/absensi_pelajaran?jurnal_id=in.(${chunk.join(',')})&select=siswa_id,status,waktu_kehadiran,jurnal_id`);
        allAbsensi = allAbsensi.concat(absRes.data || []);
      }
      return { jurnals, absensi: allAbsensi };
    },
    enabled: step === 'display_results' && filter.kelas_id !== undefined,
  });

  const absensiData = rawJurnalsData?.absensi || [];
  const jurnalsList = rawJurnalsData?.jurnals || [];

  // Hitung Kedisiplinan Guru
  const rekapDisiplinGuru = useMemo(() => {
    let tepatWaktu = 0;
    let terlambat = 0;
    let terlaluCepat = 0;
    let belumAdaStatus = 0;

    const sessionList = jurnalsList.map((j: any) => {
      const st = j.status;
      let normStatus: 'Tepat Waktu' | 'Terlambat' | 'Terlalu Cepat' | 'Belum Ditentukan' = 'Belum Ditentukan';
      if (st === 'Tepat Waktu' || st === 'Sesuai') {
        normStatus = 'Tepat Waktu';
        tepatWaktu++;
      } else if (st === 'Terlambat' || st === 'Tertinggal') {
        normStatus = 'Terlambat';
        terlambat++;
      } else if (st === 'Terlalu Cepat') {
        normStatus = 'Terlalu Cepat';
        terlaluCepat++;
      } else {
        belumAdaStatus++;
      }

      const jadwal = j.jadwal_pelajaran || {};
      const jamMulai = jadwal.jam_mulai?.jam_mulai?.substring(0, 5);
      const jamSelesai = jadwal.jam_selesai?.jam_selesai?.substring(0, 5) || jadwal.jam_mulai?.jam_selesai?.substring(0, 5);
      const rentangJam = jamMulai && jamSelesai ? `${jamMulai} - ${jamSelesai}` : (jamMulai || '-');

      // Ambil waktu kehadiran pertama pada sesi absensi ini sebagai estimasi waktu input
      const matchedAbs = absensiData.find((a: any) => a.jurnal_id === j.jurnal_id && a.waktu_kehadiran);
      const waktuInput = matchedAbs?.waktu_kehadiran?.substring(0, 5) || '-';

      return {
        jurnal_id: j.jurnal_id,
        tanggal: j.tanggal,
        pertemuan_ke: j.pertemuan_ke,
        status: normStatus,
        waktu_input: waktuInput,
        guru_nama: jadwal.pegawai?.nama_lengkap || 'Guru Pengampu',
        mapel_nama: jadwal.mapel?.nama_mapel || 'Mata Pelajaran',
        rentang_jam: rentangJam,
        catatan: j.catatan_tambahan
      };
    });

    const totalSesi = sessionList.length;
    const persenTepatWaktu = totalSesi > 0 ? ((tepatWaktu / totalSesi) * 100).toFixed(1) : "0.0";

    return {
      totalSesi,
      tepatWaktu,
      terlambat,
      terlaluCepat,
      belumAdaStatus,
      persenTepatWaktu,
      sessionList
    };
  }, [jurnalsList, absensiData]);

  // Combine data to get student-level recap
  const rekapData = useMemo(() => {
    return siswaList.map((siswa: any) => {
      const studentAbs = absensiData.filter((a: any) => a.siswa_id === siswa.siswa_id);
      const totalHadir = studentAbs.filter((a: any) => a.status === 'Hadir').length;
      const totalSakit = studentAbs.filter((a: any) => a.status === 'Sakit').length;
      const totalIzin = studentAbs.filter((a: any) => a.status === 'Izin').length;
      const totalAlpha = studentAbs.filter((a: any) => a.status === 'Alpha').length;
      const totalDispen = studentAbs.filter((a: any) => a.status === 'Dispen').length;
      
      return {
        siswa_id: siswa.siswa_id,
        nama: siswa.nama,
        nis: siswa.nis,
        nisn: siswa.nisn,
        total_hadir: totalHadir,
        total_sakit: totalSakit,
        total_izin: totalIzin,
        total_alpha: totalAlpha,
        total_dispen: totalDispen
      };
    });
  }, [siswaList, absensiData]);

  const isLoading = isSiswaLoading || isAbsensiLoading;
  const isError = isSiswaError || isAbsensiError;

  // Calculate Summaries
  const totals = useMemo(() => {
    const totalHadir = rekapData.reduce((acc: number, curr: any) => acc + (Number(curr.total_hadir) || 0), 0);
    const totalSakit = rekapData.reduce((acc: number, curr: any) => acc + (Number(curr.total_sakit) || 0), 0);
    const totalIzin = rekapData.reduce((acc: number, curr: any) => acc + (Number(curr.total_izin) || 0), 0);
    const totalAlpha = rekapData.reduce((acc: number, curr: any) => acc + (Number(curr.total_alpha) || 0), 0);
    const totalDispen = rekapData.reduce((acc: number, curr: any) => acc + (Number(curr.total_dispen) || 0), 0);
    const totalAll = totalHadir + totalSakit + totalIzin + totalAlpha + totalDispen;
    const avgKehadiran = totalAll > 0 ? ((totalHadir / totalAll) * 100).toFixed(1) : "0.0";
    return {
      totalHadir,
      totalSakit,
      totalIzin,
      totalAlpha,
      totalDispen,
      avgKehadiran
    };
  }, [rekapData]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(rekapData.length / ITEMS_PER_PAGE) || 1;
  const paginatedData = useMemo(() => {
    return rekapData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [rekapData, currentPage]);

  const getHealthColor = (percentage: number) => {
    if (percentage >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (percentage >= 75) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value === '' ? undefined : (name.includes('id') ? Number(value) : value)
    }));
    setCurrentPage(1);
  };

  const selectedLembaga = useMemo(() => lembagas.find((l: any) => l.lembaga_id === filter.lembaga_id), [lembagas, filter.lembaga_id]);
  const selectedKelas = useMemo(() => kelases.find((k: any) => k.kelas_id === filter.kelas_id), [kelases, filter.kelas_id]);

  const handleSelectLembaga = (lembagaId: number) => {
    setFilter(prev => ({ ...prev, lembaga_id: lembagaId, kelas_id: undefined }));
    setStep('select_kelas');
  };

  const handleSelectKelas = (kelasId: number) => {
    setFilter(prev => ({ ...prev, kelas_id: kelasId }));
    setStep('display_results');
  };

  return {
    role,
    isGlobalRole,
    isGuru,
    filter,
    step,
    setStep,
    currentPage,
    setCurrentPage,
    lembagas,
    kelases,
    isKelasGuruLoading,
    mapels,
    rekapData,
    rekapDisiplinGuru,
    paginatedData,
    totalPages,
    isLoading,
    isError,
    totals,
    selectedLembaga,
    selectedKelas,
    getHealthColor,
    handleFilterChange,
    handleSelectLembaga,
    handleSelectKelas
  };
}
