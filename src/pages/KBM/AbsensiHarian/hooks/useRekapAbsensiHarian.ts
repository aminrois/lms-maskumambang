import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { restClient } from "@/lib/api/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { getSiswas } from "@/lib/api/services/masterService";

export function useRekapAbsensiHarian() {
  const { role, lembaga_id, user } = useAuthStore();
  const isGlobalRole = role === 'Direktur' || role === 'Super Admin';
  const isGuru = role === 'Guru' || role === 'Wali Kelas';
  const pegawai_id = user?.pegawai_id;

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const [tanggalMulai, setTanggalMulai] = useState(formatDate(firstDay));
  const [tanggalAkhir, setTanggalAkhir] = useState(formatDate(today));

  const [selectedLembagaId, setSelectedLembagaId] = useState<number | null>(null);
  const [selectedKelasId, setSelectedKelasId] = useState<number | null>(null);

  const [step, setStep] = useState<'select_lembaga' | 'select_kelas' | 'display_results'>(
    isGlobalRole ? 'select_lembaga' : 'select_kelas'
  );

  // Fetch Options Lembaga
  const { data: lembagas = [] } = useQuery({
    queryKey: ['options', 'lembaga'],
    queryFn: async () => {
      const res = await restClient.get('/lembaga?select=lembaga_id,nama_lembaga,singkatan');
      return res.data || [];
    },
    enabled: isGlobalRole
  });

  // Fetch kelas per lembaga (untuk non-Guru / Global Role)
  const { data: kelases = [], isLoading: isKelasLoading } = useQuery({
    queryKey: ['options', 'kelas', selectedLembagaId],
    queryFn: async () => {
      if (!selectedLembagaId) return [];
      const res = await restClient.get(
        `/kelas?lembaga_id=eq.${selectedLembagaId}&select=kelas_id,nama_kelas`
      );
      return res.data || [];
    },
    enabled: !!selectedLembagaId && !isGuru
  });

  // Fetch kelas untuk Wali Kelas / Guru (hanya kelas yg diawasi)
  const { data: kelasGuru = [], isLoading: isKelasGuruLoading } = useQuery({
    queryKey: ['options', 'kelas-wali', pegawai_id],
    queryFn: async () => {
      if (!pegawai_id) return [];
      const res = await restClient.get(
        `/kelas?wali_kelas_id=eq.${pegawai_id}&select=kelas_id,nama_kelas`
      );
      return res.data || [];
    },
    enabled: !!pegawai_id && isGuru
  });

  const availableKelas = isGuru ? kelasGuru : kelases;
  const isKelasLoadingCombined = isGuru ? isKelasGuruLoading : isKelasLoading;
  const hasMultipleClasses = isGlobalRole || availableKelas.length > 1;

  // Sync role, lembaga_id, dan auto-select kelas jika pengguna bukan Direktur
  useEffect(() => {
    if (!isGlobalRole) {
      if (lembaga_id && !selectedLembagaId) {
        setSelectedLembagaId(lembaga_id);
      }

      if (availableKelas.length > 0) {
        if (availableKelas.length === 1) {
          if (selectedKelasId !== availableKelas[0].kelas_id) {
            setSelectedKelasId(availableKelas[0].kelas_id);
          }
          setStep('display_results');
        } else if (!selectedKelasId && step !== 'display_results') {
          setStep('select_kelas');
        }
      }
    }
  }, [isGlobalRole, lembaga_id, selectedLembagaId, availableKelas, selectedKelasId, step]);

  const selectedLembaga = lembagas.find((l: any) => l.lembaga_id === selectedLembagaId) || (selectedLembagaId ? { lembaga_id: selectedLembagaId, nama_lembaga: "" } : null);
  const selectedKelas = availableKelas.find((k: any) => k.kelas_id === selectedKelasId) || null;

  // Fetch Siswa
  const { data: siswaList = [], isLoading: isSiswaLoading, isError: isSiswaError } = useQuery({
    queryKey: ['master-data', 'siswa', selectedKelasId],
    queryFn: async () => {
      if (!selectedKelasId) return [];
      return await getSiswas({
        select: "siswa_id,nama,nis,nisn",
        kelas_id: `eq.${selectedKelasId}`,
        order: "nama.asc"
      });
    },
    enabled: step === 'display_results' && !!selectedKelasId,
  });

  // Fetch Absensi Harian raw data
  const { data: absensiData = [], isLoading: isAbsensiLoading, isError: isAbsensiError } = useQuery({
    queryKey: ['kbm', 'rekap-absensi-harian-raw', selectedKelasId, tanggalMulai, tanggalAkhir],
    queryFn: async () => {
      if (!selectedKelasId || siswaList.length === 0) return [];
      
      const siswaIds = siswaList.map(s => s.siswa_id);
      const chunkSize = 100;
      let allAbsensi: any[] = [];
      
      for (let i = 0; i < siswaIds.length; i += chunkSize) {
        const chunk = siswaIds.slice(i, i + chunkSize);
        let url = `/absensi_harian?siswa_id=in.(${chunk.join(',')})&select=siswa_id,status`;
        if (tanggalMulai) url += `&tanggal=gte.${tanggalMulai}`;
        if (tanggalAkhir) url += `&tanggal=lte.${tanggalAkhir}`;
        
        const absRes = await restClient.get(url);
        allAbsensi = allAbsensi.concat(absRes.data || []);
      }
      return allAbsensi;
    },
    enabled: step === 'display_results' && !!selectedKelasId && siswaList.length > 0,
  });

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
    
    const sum = totalHadir + totalSakit + totalIzin + totalAlpha + totalDispen;
    const avgHadir = sum > 0 ? (totalHadir / sum) * 100 : 0;
    
    return {
      totalHadir, totalSakit, totalIzin, totalAlpha, totalDispen, avgHadir, sum
    };
  }, [rekapData]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return rekapData.slice(start, start + itemsPerPage);
  }, [rekapData, currentPage]);
  
  const totalPages = Math.ceil(rekapData.length / itemsPerPage);

  const getHealthColor = (percentage: number) => {
    if (percentage >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (percentage >= 75) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const handleSelectLembaga = (lembagaId: number) => {
    setSelectedLembagaId(lembagaId);
    setSelectedKelasId(null);
    setStep('select_kelas');
  };

  const handleSelectKelas = (kelasId: number) => {
    setSelectedKelasId(kelasId);
    setStep('display_results');
  };

  return {
    isGlobalRole,
    isGuru,
    step,
    setStep,
    hasMultipleClasses,
    currentPage,
    setCurrentPage,
    lembagas,
    kelases: availableKelas,
    isKelasLoading: isKelasLoadingCombined,
    rekapData,
    paginatedData,
    totalPages,
    isLoading,
    isError,
    totals,
    selectedLembaga,
    selectedKelas,
    tanggalMulai,
    setTanggalMulai,
    tanggalAkhir,
    setTanggalAkhir,
    handleSelectLembaga,
    handleSelectKelas,
    getHealthColor
  };
}
