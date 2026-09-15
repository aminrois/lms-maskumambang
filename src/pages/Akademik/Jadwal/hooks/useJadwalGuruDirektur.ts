import { useEffect, useState, useMemo } from "react";
import { getAllJadwalPelajarans } from "@/lib/api/services/akademikService";
import { restClient } from "@/lib/api/axios";

export type JadwalSession = {
  jadwal_id: number;
  hari: string;
  jam_mulai_display: string;
  jam_selesai_display: string;
  nama_kelas: string;
  mapel_nama: string;
  ruangan?: string | null;
  tipe?: string | null;
  urutan_jam: number;
  kelas_id?: number | null;
};

export type TeacherJadwalGroup = {
  id: string; // `${pegawai_id}`
  pegawai_id: number;
  nama_guru: string;
  lembaga_ids: number[];
  nama_lembaga: string;
  singkatan_lembaga: string;
  kelas_names: string[];
  kelas_display: string;
  has_kelas: boolean;
  jadwals: JadwalSession[];
  primary_kelas_id?: number | null;
};

export function useJadwalGuruDirektur() {
  const [teacherGroups, setTeacherGroups] = useState<TeacherJadwalGroup[]>([]);
  const [lembagaList, setLembagaList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [selectedLembagaId, setSelectedLembagaId] = useState<number | "">("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Selected teacher for Detail Page view
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherJadwalGroup | null>(null);

  // 1. Fetch Lembaga options for filter
  useEffect(() => {
    const fetchLembagas = async () => {
      try {
        const response = await restClient.get('/lembaga', {
          params: { select: 'lembaga_id,nama_lembaga,singkatan', order: 'lembaga_id.asc' }
        });
        setLembagaList(response.data || []);
      } catch (error) {
        console.error("Gagal mengambil daftar lembaga:", error);
      }
    };
    fetchLembagas();
  }, []);

  // 2. Fetch User Roles, Pegawai Lembaga & Jadwal data (Filter strictly for users with Guru role)
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [userRolesRes, pegawaiLembagaRes, jadwalRows] = await Promise.all([
        restClient.get('/user_role', {
          params: {
            select: 'user_id,role(nama_role)'
          }
        }),
        restClient.get('/pegawai_lembaga', {
          params: {
            select: 'pegawai_id,lembaga_id,pegawai(pegawai_id,nama,user_id),lembaga(lembaga_id,nama_lembaga,singkatan)',
            order: 'pegawai_id.asc'
          }
        }),
        getAllJadwalPelajarans({
          select:
            "jadwal_id,hari,ruangan,pegawai_id,kelas(kelas_id,nama_kelas,lembaga_id,lembaga(lembaga_id,nama_lembaga,singkatan)),mapel:mata_pelajaran(nama_mapel),pegawai(pegawai_id,nama,user_id),jam_mulai:jam_akademik!jam_mulai_id(jam_mulai,urutan_jam),jam_selesai:jam_akademik!jam_selesai_id(jam_selesai)",
          order: "hari.asc,jam_mulai_id.asc",
        })
      ]);

      const userRoles = userRolesRes.data || [];
      const plList = pegawaiLembagaRes.data || [];
      const jadwals = jadwalRows || [];

      // Collect user_ids that have the "Guru" role
      const guruUserIds = new Set<string>();
      userRoles.forEach((ur: any) => {
        const roleName = ur.role?.nama_role?.toLowerCase() || "";
        if (roleName === 'guru' && ur.user_id) {
          guruUserIds.add(ur.user_id);
        }
      });

      // Collect pegawai_ids that either have the Guru role or have schedule entries
      const guruPegawaiIds = new Set<number>();
      
      plList.forEach((pl: any) => {
        if (!pl.pegawai_id || !pl.pegawai?.nama) return;
        const pid = pl.pegawai_id;
        const userId = pl.pegawai?.user_id;

        if (userId && guruUserIds.has(userId)) {
          guruPegawaiIds.add(pid);
        }
      });

      jadwals.forEach((row: any) => {
        const pegawaiId = row.pegawai_id || row.pegawai?.pegawai_id;
        if (pegawaiId) {
          guruPegawaiIds.add(pegawaiId);
        }
      });

      // Group strictly per teacher (pegawai_id) ONLY for those with Guru role or schedule
      const groupMap = new Map<number, {
        pegawai_id: number;
        nama_guru: string;
        lembagaSet: Set<string>;
        lembagaIds: Set<number>;
        kelasSet: Set<string>;
        kelasMap: Map<string, number>;
        jadwalList: JadwalSession[];
      }>();

      // Seed from pegawai_lembaga for teachers with Guru role
      plList.forEach((pl: any) => {
        if (!pl.pegawai_id || !pl.pegawai?.nama) return;
        const pid = pl.pegawai_id;

        if (!guruPegawaiIds.has(pid)) return;

        if (!groupMap.has(pid)) {
          groupMap.set(pid, {
            pegawai_id: pid,
            nama_guru: pl.pegawai.nama,
            lembagaSet: new Set<string>(),
            lembagaIds: new Set<number>(),
            kelasSet: new Set<string>(),
            kelasMap: new Map<string, number>(),
            jadwalList: []
          });
        }

        const g = groupMap.get(pid)!;
        const lem = pl.lembaga;
        if (lem) {
          const lemName = lem.singkatan || lem.nama_lembaga;
          if (lemName) g.lembagaSet.add(lemName);
          if (pl.lembaga_id) g.lembagaIds.add(pl.lembaga_id);
        }
      });

      // Populate schedule items into teacher groups
      jadwals.forEach((row: any) => {
        const pegawaiId = row.pegawai_id || row.pegawai?.pegawai_id;
        if (!pegawaiId) return;

        if (!groupMap.has(pegawaiId)) {
          groupMap.set(pegawaiId, {
            pegawai_id: pegawaiId,
            nama_guru: row.pegawai?.nama || "Guru #" + pegawaiId,
            lembagaSet: new Set<string>(),
            lembagaIds: new Set<number>(),
            kelasSet: new Set<string>(),
            kelasMap: new Map<string, number>(),
            jadwalList: []
          });
        }

        const g = groupMap.get(pegawaiId)!;
        const kelas = row.kelas || {};
        const lembaga = kelas.lembaga || {};

        if (lembaga) {
          const lemName = lembaga.singkatan || lembaga.nama_lembaga;
          if (lemName) g.lembagaSet.add(lemName);
          if (kelas.lembaga_id) g.lembagaIds.add(kelas.lembaga_id);
        }

        if (kelas.nama_kelas) {
          g.kelasSet.add(kelas.nama_kelas);
          if (kelas.kelas_id) {
            g.kelasMap.set(kelas.nama_kelas, kelas.kelas_id);
          }
        }

        let ruangan = row.ruangan || null;
        let tipe = row.jam_mulai?.tipe || "";
        if (ruangan && ruangan.startsWith("OVERRIDE_TIPE:")) {
          tipe = ruangan.replace("OVERRIDE_TIPE:", "");
          ruangan = null;
        }

        const mapel = row.mapel || {};
        const jamMulai = row.jam_mulai?.jam_mulai?.substring(0, 5) || "—";
        const jamSelesai = row.jam_selesai?.jam_selesai?.substring(0, 5) || "—";

        g.jadwalList.push({
          jadwal_id: row.jadwal_id,
          hari: row.hari || "—",
          jam_mulai_display: jamMulai,
          jam_selesai_display: jamSelesai,
          nama_kelas: kelas.nama_kelas || "—",
          mapel_nama: mapel.nama_mapel || "—",
          ruangan,
          tipe,
          urutan_jam: row.jam_mulai?.urutan_jam || 0,
          kelas_id: kelas.kelas_id || null
        });
      });

      // Transform to array
      const result: TeacherJadwalGroup[] = Array.from(groupMap.values()).map((item) => {
        const sortedLembagas = Array.from(item.lembagaSet).sort((a, b) => a.localeCompare(b));
        const singkatanLembaga = sortedLembagas.length > 0 ? sortedLembagas.join(", ") : "—";

        const sortedClasses = Array.from(item.kelasSet).sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true })
        );
        const hasKelas = sortedClasses.length > 0;
        const kelasDisplay = hasKelas ? sortedClasses.join(", ") : "Tidak ada kelas";
        const primaryKelasId = hasKelas ? item.kelasMap.get(sortedClasses[0]) : null;

        return {
          id: String(item.pegawai_id),
          pegawai_id: item.pegawai_id,
          nama_guru: item.nama_guru,
          lembaga_ids: Array.from(item.lembagaIds),
          nama_lembaga: singkatanLembaga,
          singkatan_lembaga: singkatanLembaga,
          kelas_names: sortedClasses,
          kelas_display: kelasDisplay,
          has_kelas: hasKelas,
          jadwals: item.jadwalList,
          primary_kelas_id: primaryKelasId
        };
      });

      // Sort result by nama_guru asc
      result.sort((a, b) => a.nama_guru.localeCompare(b.nama_guru));
      setTeacherGroups(result);

      // Refresh selectedTeacher reference if active
      if (selectedTeacher) {
        const updated = result.find(r => r.pegawai_id === selectedTeacher.pegawai_id);
        if (updated) setSelectedTeacher(updated);
      }
    } catch (error) {
      console.error("Gagal memuat jadwal guru direktur:", error);
      setTeacherGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    return teacherGroups.filter((item) => {
      // Lembaga Filter
      if (selectedLembagaId !== "") {
        const targetId = Number(selectedLembagaId);
        if (!item.lembaga_ids.includes(targetId)) {
          return false;
        }
      }
      // Search Term
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const matchGuru = item.nama_guru.toLowerCase().includes(query);
        const matchLembaga = item.nama_lembaga.toLowerCase().includes(query) || item.singkatan_lembaga.toLowerCase().includes(query);
        const matchKelas = item.kelas_display.toLowerCase().includes(query);
        if (!matchGuru && !matchLembaga && !matchKelas) {
          return false;
        }
      }
      return true;
    });
  }, [teacherGroups, selectedLembagaId, searchTerm]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLembagaId, searchTerm]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedGroups = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return filteredGroups.slice(start, start + itemsPerPage);
  }, [filteredGroups, safeCurrentPage, itemsPerPage]);

  return {
    isLoading,
    lembagaList,
    selectedLembagaId,
    setSelectedLembagaId,
    searchTerm,
    setSearchTerm,
    filteredGroups,
    paginatedGroups,
    currentPage: safeCurrentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    selectedTeacher,
    setSelectedTeacher,
    refetch: fetchData
  };
}
