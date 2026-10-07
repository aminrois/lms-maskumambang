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
  kelas_list: string[];
  is_paralel: boolean;
  jumlah_kelas_paralel: number;
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
  jam_per_lembaga: Record<number, number>; // lembaga_id -> total JP (dihitung 1x untuk paralel)
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

  // 4. Proses Rekapitulasi Data dengan Deduplikasi Kelas Paralel
  const rekapData: GuruJamRekap[] = useMemo(() => {
    if (!lembagas.length && !rawJadwals.length) return [];

    // Helper tipe internal per guru
    type GuruAccumulator = {
      pegawai_id: number;
      nama_guru: string;
      nip: string;
      bagian: string | null;
      all_classes: Set<string>;
      all_mapels: Set<string>;
      // Map slot per jam unik: key = `${hari}_${urutan_jam}_${mapel_id}_${lembaga_id}`
      slots: Map<string, {
        hari: string;
        urutan_jam: number;
        jam_mulai_display: string;
        jam_selesai_display: string;
        mapel_id: number;
        nama_mapel: string;
        lembaga_id: number;
        nama_lembaga: string;
        singkatan_lembaga: string;
        kelas_list: string[];
        kelas_ids: number[];
        ruangan: string | null;
        jadwal_ids: number[];
      }>;
    };

    const guruMap = new Map<number, GuruAccumulator>();

    // Seed data dari daftar pegawai yang ada
    pegawais.forEach((p: any) => {
      if (!p.pegawai_id) return;
      guruMap.set(p.pegawai_id, {
        pegawai_id: p.pegawai_id,
        nama_guru: p.nama || `Guru #${p.pegawai_id}`,
        nip: p.nip || "—",
        bagian: p.bagian || null,
        all_classes: new Set<string>(),
        all_mapels: new Set<string>(),
        slots: new Map(),
      });
    });

    // Proses setiap baris jadwal
    rawJadwals.forEach((row: any) => {
      const pegawaiId = row.pegawai_id || row.pegawai?.pegawai_id;
      if (!pegawaiId) return;

      const kelas = row.kelas || {};
      const lembaga = kelas.lembaga || {};
      const lembagaId = Number(kelas.lembaga_id || lembaga.lembaga_id || 0);
      const namaLembaga = lembaga.nama_lembaga || "Lembaga";
      const singkatanLembaga = lembaga.singkatan || namaLembaga;

      const mapel = row.mapel || {};
      const mapelId = Number(row.mapel_id || mapel.mapel_id || 0);
      const namaMapel = mapel.nama_mapel || "Mata Pelajaran";
      const namaKelas = kelas.nama_kelas || "Kelas";
      const kelasId = Number(row.kelas_id || kelas.kelas_id || 0);

      const hari = row.hari || "—";
      const uMulai = Number(row.jam_mulai?.urutan_jam) || 1;
      const uSelesai = Number(row.jam_selesai?.urutan_jam) || uMulai;

      const jamMulaiDisplay = row.jam_mulai?.jam_mulai ? String(row.jam_mulai.jam_mulai).substring(0, 5) : "—";
      const jamSelesaiDisplay = row.jam_selesai?.jam_selesai ? String(row.jam_selesai.jam_selesai).substring(0, 5) : "—";

      if (!guruMap.has(pegawaiId)) {
        guruMap.set(pegawaiId, {
          pegawai_id: pegawaiId,
          nama_guru: row.pegawai?.nama || `Guru #${pegawaiId}`,
          nip: row.pegawai?.nip || "—",
          bagian: row.pegawai?.bagian || null,
          all_classes: new Set<string>(),
          all_mapels: new Set<string>(),
          slots: new Map(),
        });
      }

      const guruAcc = guruMap.get(pegawaiId)!;
      guruAcc.all_classes.add(namaKelas);
      guruAcc.all_mapels.add(namaMapel);

      // KUNCI UTAMA DEDUPLIKASI KELAS PARALEL:
      // Setiap jam pelajaran di dalam rentang uMulai s/d uSelesai diidentifikasi berdasarkan
      // `hari + urutan_jam + mapel_id + lembaga_id`.
      // Jika guru mengajar mapel yang sama pada jam & hari yang sama untuk lebih dari 1 kelas (paralel),
      // jam tersebut HANYA DIHITUNG 1 KALI (1 JP) ke total beban mengajar!
      for (let u = uMulai; u <= uSelesai; u++) {
        const slotKey = `${hari}_${u}_${mapelId}_${lembagaId}`;
        if (!guruAcc.slots.has(slotKey)) {
          guruAcc.slots.set(slotKey, {
            hari,
            urutan_jam: u,
            jam_mulai_display: jamMulaiDisplay,
            jam_selesai_display: jamSelesaiDisplay,
            mapel_id: mapelId,
            nama_mapel: namaMapel,
            lembaga_id: lembagaId,
            nama_lembaga: namaLembaga,
            singkatan_lembaga: singkatanLembaga,
            kelas_list: [namaKelas],
            kelas_ids: [kelasId],
            ruangan: row.ruangan || null,
            jadwal_ids: [row.jadwal_id],
          });
        } else {
          // Kelas paralel terdeteksi pada waktu yang sama: gabungkan nama kelasnya tanpa menambah JP ganda
          const existingSlot = guruAcc.slots.get(slotKey)!;
          if (!existingSlot.kelas_list.includes(namaKelas)) {
            existingSlot.kelas_list.push(namaKelas);
          }
          if (!existingSlot.kelas_ids.includes(kelasId)) {
            existingSlot.kelas_ids.push(kelasId);
          }
          existingSlot.jadwal_ids.push(row.jadwal_id);
          if (!existingSlot.ruangan && row.ruangan) {
            existingSlot.ruangan = row.ruangan;
          }
        }
      }
    });

    const DAY_ORDER: Record<string, number> = {
      Ahad: 1,
      Senin: 2,
      Selasa: 3,
      Rabu: 4,
      Kamis: 5,
      Jumat: 6,
      Sabtu: 7,
    };

    // Susun hasil rekapitulasi per guru
    const result: GuruJamRekap[] = [];

    guruMap.forEach((guruAcc) => {
      const totalSlotCount = guruAcc.slots.size;
      if (totalSlotCount === 0 && guruAcc.all_classes.size === 0) return;

      const jamPerLembaga: Record<number, number> = {};
      let totalJp = 0;

      // Akumulasikan beban JP per lembaga (tiap slot jam riil = 1 JP)
      guruAcc.slots.forEach((slot) => {
        if (slot.lembaga_id) {
          jamPerLembaga[slot.lembaga_id] = (jamPerLembaga[slot.lembaga_id] || 0) + 1;
        }
        totalJp += 1;
      });

      // Gabungkan jam-jam berurutan (consecutive hours) menjadi sesi blok mengajar yang rapi untuk modal & tabel rincian
      const sortedSlots = Array.from(guruAcc.slots.values()).sort((a, b) => {
        const dayDiff = (DAY_ORDER[a.hari] || 99) - (DAY_ORDER[b.hari] || 99);
        if (dayDiff !== 0) return dayDiff;
        return a.urutan_jam - b.urutan_jam;
      });

      const groupedJadwals: JadwalDetailItem[] = [];

      for (const slot of sortedSlots) {
        const sortedKelasNames = [...slot.kelas_list].sort();
        const kelasLabel = sortedKelasNames.join(", ");
        const isParalel = slot.kelas_list.length > 1;

        // Cek apakah slot ini berurutan langsung dengan item sebelumnya (hari sama, mapel sama, lembaga sama, kelas sama, dan jam n+1)
        const lastGroup = groupedJadwals.length > 0 ? groupedJadwals[groupedJadwals.length - 1] : null;

        if (
          lastGroup &&
          lastGroup.hari === slot.hari &&
          lastGroup.mapel_id === slot.mapel_id &&
          lastGroup.lembaga_id === slot.lembaga_id &&
          lastGroup.nama_kelas === kelasLabel &&
          lastGroup.urutan_jam_selesai === slot.urutan_jam - 1
        ) {
          // Perpanjang blok jam
          lastGroup.urutan_jam_selesai = slot.urutan_jam;
          lastGroup.jam_selesai_display = slot.jam_selesai_display;
          lastGroup.jp += 1;
        } else {
          // Buat item sesi blok baru
          groupedJadwals.push({
            jadwal_id: slot.jadwal_ids[0],
            lembaga_id: slot.lembaga_id,
            nama_lembaga: slot.nama_lembaga,
            singkatan_lembaga: slot.singkatan_lembaga,
            kelas_id: slot.kelas_ids[0],
            nama_kelas: kelasLabel,
            kelas_list: sortedKelasNames,
            is_paralel: isParalel,
            jumlah_kelas_paralel: slot.kelas_list.length,
            mapel_id: slot.mapel_id,
            nama_mapel: slot.nama_mapel,
            hari: slot.hari,
            urutan_jam_mulai: slot.urutan_jam,
            urutan_jam_selesai: slot.urutan_jam,
            jam_mulai_display: slot.jam_mulai_display,
            jam_selesai_display: slot.jam_selesai_display,
            jp: 1,
            ruangan: slot.ruangan,
          });
        }
      }

      result.push({
        pegawai_id: guruAcc.pegawai_id,
        nama_guru: guruAcc.nama_guru,
        nip: guruAcc.nip,
        bagian: guruAcc.bagian,
        jam_per_lembaga: jamPerLembaga,
        total_jp: totalJp,
        total_kelas: guruAcc.all_classes.size,
        total_mapel: guruAcc.all_mapels.size,
        jadwals: groupedJadwals,
      });
    });

    return result;
  }, [lembagas, pegawais, rawJadwals]);

  // 5. Filter & Sorting
  const filteredAndSortedData = useMemo(() => {
    return rekapData
      .filter((guru) => {
        // Filter Search (Nama Guru, NIP, atau Mapel/Kelas yang diajar)
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
          "Kelas": j.nama_kelas + (j.is_paralel ? ` (Gabungan ${j.jumlah_kelas_paralel} Kelas)` : ""),
          "Mata Pelajaran": j.nama_mapel,
          "Hari": j.hari,
          "Jam Pelajaran (JP)": j.jp,
          "Waktu Jam Ke-": j.urutan_jam_mulai === j.urutan_jam_selesai ? `Jam Ke-${j.urutan_jam_mulai}` : `Jam Ke-${j.urutan_jam_mulai} s/d ${j.urutan_jam_selesai}`,
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
