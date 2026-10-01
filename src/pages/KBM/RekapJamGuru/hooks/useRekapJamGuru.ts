import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllJadwalPelajarans } from "@/lib/api/services/akademikService";
import { getLembagas, getPegawais } from "@/lib/api/services/masterService";
import { utils, writeFile } from "xlsx";

export interface JadwalDetailItem {
  jadwal_id: number;
  lembaga_id: number;
  nama_lembaga: string;
  singkatan_lembaga: string;
  kelas_id: number;
  nama_kelas: string;
  mapel_id: number;
  nama_mapel: string;
  hari: string;
  urutan_jam_mulai: number;
  urutan_jam_selesai: number;
  jam_mulai_display: string;
  jam_selesai_display: string;
  jp: number;
  ruangan?: string | null;
}

export interface GuruJamRekap {
  pegawai_id: number;
  nama_guru: string;
  nip: string;
  bagian?: string | null;
  jam_per_lembaga: Record<number, number>; // lembaga_id -> total JP
  total_jp: number;
  total_kelas: number;
  total_mapel: number;
  jadwals: JadwalDetailItem[];
}

export function useRekapJamGuru() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLembagaFilter, setSelectedLembagaFilter] = useState<string>("Semua");
  const [sortBy, setSortBy] = useState<"jam_desc" | "jam_asc" | "nama_asc">("jam_desc");
  const [selectedGuruDetail, setSelectedGuruDetail] = useState<GuruJamRekap | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 1. Load Daftar Lembaga
  const { data: lembagas = [], isLoading: isLoadingLembaga } = useQuery({
    queryKey: ["master", "lembagas-rekap-jam"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const res = await getLembagas({
        select: "lembaga_id,nama_lembaga,singkatan",
        order: "lembaga_id.asc",
      });
      return res || [];
    },
  });

  // 2. Load Pegawai (Khusus yang memiliki role Guru atau terdaftar sebagai pendidik)
  const { data: pegawais = [], isLoading: isLoadingPegawai } = useQuery({
    queryKey: ["master", "pegawai-all-rekap-jam"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const res = await getPegawais({
        select: "pegawai_id,nama,nip,bagian,user_id",
        order: "nama.asc",
      });
      return res || [];
    },
  });

  // 3. Load Seluruh Jadwal Pelajaran Aktif
  const { data: rawJadwals = [], isLoading: isLoadingJadwal, refetch } = useQuery({
    queryKey: ["akademik", "jadwal-pelajaran-all-rekap"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      return await getAllJadwalPelajarans({
        select:
          "jadwal_id,hari,ruangan,kelas_id,mapel_id,pegawai_id,kelas(kelas_id,nama_kelas,lembaga_id,lembaga(lembaga_id,nama_lembaga,singkatan)),mapel:mata_pelajaran(nama_mapel),pegawai(pegawai_id,nama,nip,bagian),jam_mulai:jam_akademik!jam_mulai_id(jam_mulai,urutan_jam,tipe),jam_selesai:jam_akademik!jam_selesai_id(jam_selesai,urutan_jam,tipe)",
        order: "hari.asc,jam_mulai_id.asc",
      });
    },
  });

  // 4. Proses Rekapitulasi Data
  const rekapData: GuruJamRekap[] = useMemo(() => {
    if (!lembagas.length && !rawJadwals.length) return [];

    // Map untuk mengumpulkan beban jam per pegawai
    const guruMap = new Map<number, GuruJamRekap>();

    // Seed data dari daftar pegawai yang ada
    pegawais.forEach((p: any) => {
      if (!p.pegawai_id) return;
      guruMap.set(p.pegawai_id, {
        pegawai_id: p.pegawai_id,
        nama_guru: p.nama || `Guru #${p.pegawai_id}`,
        nip: p.nip || "—",
        bagian: p.bagian || null,
        jam_per_lembaga: {},
        total_jp: 0,
        total_kelas: 0,
        total_mapel: 0,
        jadwals: [],
      });
    });

    // Proses setiap baris jadwal
    rawJadwals.forEach((row: any) => {
      const pegawaiId = row.pegawai_id || row.pegawai?.pegawai_id;
      if (!pegawaiId) return;

      const kelas = row.kelas || {};
      const lembaga = kelas.lembaga || {};
      const lembagaId = Number(kelas.lembaga_id || lembaga.lembaga_id);
      const namaLembaga = lembaga.nama_lembaga || "Lembaga";
      const singkatanLembaga = lembaga.singkatan || namaLembaga;

      const mapel = row.mapel || {};
      const namaMapel = mapel.nama_mapel || "Mata Pelajaran";
      const namaKelas = kelas.nama_kelas || "Kelas";

      // Hitung Durasi Jam Pelajaran (JP)
      const uMulai = Number(row.jam_mulai?.urutan_jam) || 0;
      const uSelesai = Number(row.jam_selesai?.urutan_jam) || uMulai;
      let jp = 1;
      if (uMulai > 0 && uSelesai >= uMulai) {
        jp = uSelesai - uMulai + 1;
      }

      const jamMulaiDisplay = row.jam_mulai?.jam_mulai ? String(row.jam_mulai.jam_mulai).substring(0, 5) : "—";
      const jamSelesaiDisplay = row.jam_selesai?.jam_selesai ? String(row.jam_selesai.jam_selesai).substring(0, 5) : "—";

      // Ambil / Buat objek guru
      if (!guruMap.has(pegawaiId)) {
        guruMap.set(pegawaiId, {
          pegawai_id: pegawaiId,
          nama_guru: row.pegawai?.nama || `Guru #${pegawaiId}`,
          nip: row.pegawai?.nip || "—",
          bagian: row.pegawai?.bagian || null,
          jam_per_lembaga: {},
          total_jp: 0,
          total_kelas: 0,
          total_mapel: 0,
          jadwals: [],
        });
      }

      const guru = guruMap.get(pegawaiId)!;

      // Akumulasikan JP ke lembaga terkait
      if (lembagaId) {
        guru.jam_per_lembaga[lembagaId] = (guru.jam_per_lembaga[lembagaId] || 0) + jp;
      }
      guru.total_jp += jp;

      // Simpan rincian sesi jadwal
      guru.jadwals.push({
        jadwal_id: row.jadwal_id,
        lembaga_id: lembagaId,
        nama_lembaga: namaLembaga,
        singkatan_lembaga: singkatanLembaga,
        kelas_id: Number(row.kelas_id || kelas.kelas_id),
        nama_kelas: namaKelas,
        mapel_id: Number(row.mapel_id || mapel.mapel_id),
        nama_mapel: namaMapel,
        hari: row.hari || "—",
        urutan_jam_mulai: uMulai,
        urutan_jam_selesai: uSelesai,
        jam_mulai_display: jamMulaiDisplay,
        jam_selesai_display: jamSelesaiDisplay,
        jp,
        ruangan: row.ruangan || null,
      });
    });

    // Hitung metadata total kelas & total mapel unik yang diampu tiap guru
    const result: GuruJamRekap[] = [];
    guruMap.forEach((guru) => {
      // Hanya sertakan guru yang memiliki jam mengajar (> 0) atau terdaftar
      if (guru.total_jp > 0 || guru.jadwals.length > 0) {
        const uniqueClasses = new Set(guru.jadwals.map((j) => j.nama_kelas));
        const uniqueMapels = new Set(guru.jadwals.map((j) => j.nama_mapel));
        guru.total_kelas = uniqueClasses.size;
        guru.total_mapel = uniqueMapels.size;
        result.push(guru);
      }
    });

    return result;
  }, [lembagas, pegawais, rawJadwals]);

  // 5. Filter & Sorting
  const filteredAndSortedData = useMemo(() => {
    return rekapData
      .filter((guru) => {
        // Filter Search (Nama Guru, NIP, atau Mapel yang diajar)
        if (searchTerm.trim() !== "") {
          const q = searchTerm.toLowerCase();
          const matchNama = guru.nama_guru.toLowerCase().includes(q);
          const matchNip = guru.nip.toLowerCase().includes(q);
          const matchMapel = guru.jadwals.some((j) => j.nama_mapel.toLowerCase().includes(q));
          const matchKelas = guru.jadwals.some((j) => j.nama_kelas.toLowerCase().includes(q));
          if (!matchNama && !matchNip && !matchMapel && !matchKelas) {
            return false;
          }
        }

        // Filter Lembaga Spesifik
        if (selectedLembagaFilter !== "Semua") {
          const targetLembagaId = Number(selectedLembagaFilter);
          const jamInLembaga = guru.jam_per_lembaga[targetLembagaId] || 0;
          if (jamInLembaga === 0) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "jam_desc") {
          return b.total_jp - a.total_jp || a.nama_guru.localeCompare(b.nama_guru);
        }
        if (sortBy === "jam_asc") {
          return a.total_jp - b.total_jp || a.nama_guru.localeCompare(b.nama_guru);
        }
        if (sortBy === "nama_asc") {
          return a.nama_guru.localeCompare(b.nama_guru);
        }
        return 0;
      });
  }, [rekapData, searchTerm, selectedLembagaFilter, sortBy]);

  // 6. Ringkasan Statistik Global
  const summaryStats = useMemo(() => {
    const totalGuru = rekapData.length;
    const totalSemuaJP = rekapData.reduce((acc, curr) => acc + curr.total_jp, 0);
    const avgJP = totalGuru > 0 ? (totalSemuaJP / totalGuru).toFixed(1) : "0";

    let maxGuru = rekapData.length > 0 ? rekapData[0] : null;
    rekapData.forEach((g) => {
      if (!maxGuru || g.total_jp > maxGuru.total_jp) {
        maxGuru = g;
      }
    });

    return {
      totalGuru,
      totalSemuaJP,
      avgJP,
      maxGuru,
    };
  }, [rekapData]);

  // 7. Ekspor Excel
  const handleExportExcel = () => {
    if (filteredAndSortedData.length === 0) return;

    // Sheet 1: Matriks Rekapitulasi Jam Guru
    const sheet1Data = filteredAndSortedData.map((guru, idx) => {
      const rowObj: Record<string, any> = {
        "No": idx + 1,
        "NIP": guru.nip !== "—" ? guru.nip : "-",
        "Nama Guru": guru.nama_guru,
      };

      // Tambahkan kolom masing-masing lembaga
      lembagas.forEach((lem) => {
        const keyName = `${lem.singkatan || lem.nama_lembaga} (JP)`;
        rowObj[keyName] = guru.jam_per_lembaga[lem.lembaga_id] || 0;
      });

      rowObj["Total Beban Mengajar (JP)"] = guru.total_jp;
      rowObj["Jumlah Kelas Diampu"] = guru.total_kelas;
      rowObj["Jumlah Mapel"] = guru.total_mapel;

      return rowObj;
    });

    // Sheet 2: Rincian Jadwal Mengajar Guru
    const sheet2Data: any[] = [];
    let rincianIdx = 1;
    filteredAndSortedData.forEach((guru) => {
      guru.jadwals.forEach((j) => {
        sheet2Data.push({
          "No": rincianIdx++,
          "Nama Guru": guru.nama_guru,
          "NIP": guru.nip !== "—" ? guru.nip : "-",
          "Lembaga": j.singkatan_lembaga,
          "Kelas": j.nama_kelas,
          "Mata Pelajaran": j.nama_mapel,
          "Hari": j.hari,
          "Jam Pelajaran (JP)": j.jp,
          "Waktu Jam Ke-": `${j.urutan_jam_mulai} s/d ${j.urutan_jam_selesai}`,
          "Waktu Jam": `${j.jam_mulai_display} - ${j.jam_selesai_display}`,
          "Ruangan": j.ruangan || "-",
        });
      });
    });

    const workbook = utils.book_new();

    const ws1 = utils.json_to_sheet(sheet1Data);
    utils.book_append_sheet(workbook, ws1, "Rekap Beban Jam Guru");

    if (sheet2Data.length > 0) {
      const ws2 = utils.json_to_sheet(sheet2Data);
      utils.book_append_sheet(workbook, ws2, "Rincian Jadwal Guru");
    }

    writeFile(workbook, `Rekap_Jam_Mengajar_Guru_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleOpenDetail = (guru: GuruJamRekap) => {
    setSelectedGuruDetail(guru);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedGuruDetail(null);
  };

  return {
    lembagas,
    isLoading: isLoadingLembaga || isLoadingPegawai || isLoadingJadwal,
    searchTerm,
    setSearchTerm,
    selectedLembagaFilter,
    setSelectedLembagaFilter,
    sortBy,
    setSortBy,
    rekapData: filteredAndSortedData,
    summaryStats,
    selectedGuruDetail,
    isDetailModalOpen,
    handleOpenDetail,
    handleCloseDetail,
    handleExportExcel,
    refetch,
  };
}
