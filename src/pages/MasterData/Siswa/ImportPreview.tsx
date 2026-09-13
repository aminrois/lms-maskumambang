import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, AlertTriangle, CheckCircle2, Info, ClipboardList, Users } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { restClient } from "../../../lib/api/axios";
import { toast } from "sonner";
import type { SISWA_CREATE } from "../../../types/database";

export default function SiswaImportPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const importData: SISWA_CREATE[] = location.state?.importData || [];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importStats, setImportStats] = useState<{ currentBatch: number; totalBatches: number; success: number; failed: number } | null>(null);

  // Fetch existing siswa for duplicate check
  const { data: dataSiswa = [], isLoading: isLoadingSiswa } = useQuery({
    queryKey: ['master-data', 'siswa-preview-all'],
    queryFn: async () => {
      const PAGE_SIZE = 1000;
      let allSiswa: any[] = [];
      let page = 0;

      while (true) {
        const response = await restClient.get('/siswa', {
          params: { select: 'nis,nisn,nama', limit: PAGE_SIZE, offset: page * PAGE_SIZE }
        });
        const data = response.data || [];
        allSiswa = [...allSiswa, ...data];
        if (data.length < PAGE_SIZE) break;
        page++;
      }
      return allSiswa;
    }
  });

  // Fetch kelas list untuk validasi kelas_id
  const { data: dataKelas = [], isLoading: isLoadingKelas } = useQuery({
    queryKey: ['master-data', 'kelas-preview-options'],
    queryFn: async () => {
      const response = await restClient.get('/kelas', {
        params: { select: 'kelas_id,nama_kelas,lembaga_id,lembaga(singkatan,nama_lembaga)' }
      });
      return response.data || [];
    }
  });

  // Fetch wali murid list untuk validasi wali_murid_id
  const { data: dataWali = [], isLoading: isLoadingWali } = useQuery({
    queryKey: ['master-data', 'wali-preview-options'],
    queryFn: async () => {
      const response = await restClient.get('/wali_murid', {
        params: { select: 'wali_id,nama_ayah,status_ayah,nama_ibu,status_ibu,nama_wali' }
      });
      return response.data || [];
    }
  });

  const isLoading = isLoadingSiswa || isLoadingKelas || isLoadingWali;

  // Helper: ambil nama wali utama dari data wali murid
  const getNamaWali = (wali: any) => {
    if (!wali || !wali.nama_wali) return "-";
    if (wali.nama_wali === wali.nama_ayah) return wali.nama_wali + " (Ayah)";
    if (wali.nama_wali === wali.nama_ibu) return wali.nama_wali + " (Ibu)";
    return wali.nama_wali + " (Wali)";
  };

  const previewRows = useMemo(() => {
    if (isLoading) return [];

    const isValidValue = (val: any): boolean => {
      if (val === undefined || val === null) return false;
      const str = String(val).trim().toLowerCase();
      return str !== "" && str !== "-" && str !== "—" && str !== "null" && str !== "undefined";
    };

    const nisSet = new Set<string>();
    const nisnSet = new Set<string>();
    const namaSet = new Set<string>();

    return importData.map((row: any, index) => {
      let isDuplicateNis = false;
      let isDuplicateNisn = false;
      let isDuplicateNama = false;
      let isKelasInvalid = false;
      let isWaliInvalid = false;
      const errorMessages: string[] = [];

      const isNisEmpty = !isValidValue(row.nis);
      const isNisnEmpty = !isValidValue(row.nisn);
      const isNamaEmpty = !isValidValue(row.nama);
      const isJkEmpty = !isValidValue(row.jenis_kelamin);
      const isTempatLahirEmpty = !isValidValue(row.tempat_lahir);
      const isTanggalLahirEmpty = !isValidValue(row.tanggal_lahir);
      const isAgamaEmpty = !isValidValue(row.agama);
      const isKewarganegaraanEmpty = !isValidValue(row.kewarganegaraan);
      const isAsalSekolahEmpty = !isValidValue(row.asal_sekolah);
      const isTahunMasukEmpty = !isValidValue(row.tahun_masuk);

      // A. Validasi Field Wajib Kosong (sesuai Form Modal Tambah Siswa)
      if (isNisEmpty) errorMessages.push("NIS kosong");
      if (isNisnEmpty) errorMessages.push("NISN kosong");
      if (isNamaEmpty) errorMessages.push("Nama kosong");
      if (isJkEmpty) errorMessages.push("L/P kosong");
      if (isTempatLahirEmpty) errorMessages.push("Tempat Lahir kosong");
      if (isTanggalLahirEmpty) errorMessages.push("Tanggal Lahir kosong");
      if (isAgamaEmpty) errorMessages.push("Agama kosong");
      if (isKewarganegaraanEmpty) errorMessages.push("Kewarganegaraan kosong");
      if (isAsalSekolahEmpty) errorMessages.push("Asal Sekolah kosong");
      if (isTahunMasukEmpty) errorMessages.push("Tahun Masuk kosong");

      // B. Validasi Format & Nilai Valid
      const isJkInvalid = !!(row.jenis_kelamin && row.jenis_kelamin !== "L" && row.jenis_kelamin !== "P");
      if (isJkInvalid) {
        errorMessages.push("L/P tidak valid (harus L atau P)");
      }

      let isTglLahirInvalid = false;
      if (row.tanggal_lahir) {
        const isValidDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(row.tanggal_lahir);
        const parsedDate = Date.parse(row.tanggal_lahir);
        if (!isValidDateFormat || isNaN(parsedDate)) {
          isTglLahirInvalid = true;
          errorMessages.push("Format Tanggal Lahir tidak valid (wajib YYYY-MM-DD)");
        }
      }

      let isTahunMasukInvalid = false;
      if (row.tahun_masuk) {
        const thn = Number(row.tahun_masuk);
        if (isNaN(thn) || thn < 1900 || thn > 2100) {
          isTahunMasukInvalid = true;
          errorMessages.push("Tahun Masuk tidak valid");
        }
      }

      let isStatusInvalid = false;
      if (row.status && row.status !== "Aktif" && row.status !== "Tidak Aktif") {
        isStatusInvalid = true;
        errorMessages.push("Status tidak valid (harus Aktif atau Tidak Aktif)");
      }

      let isAsramaInvalid = false;
      if (row.keterangan_asrama && row.keterangan_asrama !== "Ya" && row.keterangan_asrama !== "Tidak") {
        isAsramaInvalid = true;
        errorMessages.push("Asrama tidak valid (harus Ya atau Tidak)");
      }

      // C. Cek duplikat internal (di dalam file Excel itu sendiri)
      const nisVal = row.nis ? String(row.nis).trim() : "";
      const nisnVal = row.nisn ? String(row.nisn).trim() : "";
      const namaVal = row.nama ? String(row.nama).trim() : "";

      const hasNis = isValidValue(nisVal);
      const hasNisn = isValidValue(nisnVal);
      const hasNama = isValidValue(namaVal);

      const nisLower = nisVal.toLowerCase();
      const nisnLower = nisnVal.toLowerCase();
      const namaLower = namaVal.toLowerCase();

      if (hasNis && nisSet.has(nisLower)) isDuplicateNis = true;
      if (hasNisn && nisnSet.has(nisnLower)) isDuplicateNisn = true;
      if (hasNama && namaSet.has(namaLower)) isDuplicateNama = true;

      if (hasNis) nisSet.add(nisLower);
      if (hasNisn) nisnSet.add(nisnLower);
      if (hasNama) namaSet.add(namaLower);

      // D. Cek duplikat eksternal (terhadap database)
      if (!isDuplicateNis && hasNis && dataSiswa.some((s: any) => isValidValue(s.nis) && String(s.nis).trim().toLowerCase() === nisLower)) isDuplicateNis = true;
      if (!isDuplicateNisn && hasNisn && dataSiswa.some((s: any) => isValidValue(s.nisn) && String(s.nisn).trim().toLowerCase() === nisnLower)) isDuplicateNisn = true;
      if (!isDuplicateNama && hasNama && dataSiswa.some((s: any) => isValidValue(s.nama) && String(s.nama).trim().toLowerCase() === namaLower)) isDuplicateNama = true;

      if (isDuplicateNis) errorMessages.push("NIS kembar");
      if (isDuplicateNisn && hasNisn) errorMessages.push("NISN kembar");
      if (isDuplicateNama) errorMessages.push("Nama kembar");

      // E. Validasi Kelas berdasarkan Nama Kelas
      const kelasInput = row.kelas ? String(row.kelas).trim() : "";
      const isKelasEmptyOrHyphen = !isValidValue(kelasInput);

      const kelasData = !isKelasEmptyOrHyphen
        ? dataKelas.find((k: any) => k.nama_kelas.toLowerCase().trim() === kelasInput.toLowerCase())
        : null;

      let resolvedKelasId: number | undefined = undefined;
      if (!isKelasEmptyOrHyphen) {
        if (!kelasData) {
          isKelasInvalid = true;
        } else {
          resolvedKelasId = kelasData.kelas_id;
        }
      }

      const namaKelas = kelasData
        ? `${kelasData.nama_kelas} (${kelasData.lembaga?.singkatan || kelasData.lembaga?.nama_lembaga || '-'})`
        : isKelasEmptyOrHyphen
          ? "-"
          : `${kelasInput}`;

      // F. Validasi Wali Murid berdasarkan Nama Wali (Ayah/Ibu/Wali)
      const waliInput = row.wali_murid ? String(row.wali_murid).trim() : "";
      const isWaliEmptyOrHyphen = !isValidValue(waliInput);

      const waliData = !isWaliEmptyOrHyphen
        ? dataWali.find((w: any) => {
          const valLower = waliInput.toLowerCase();
          return (
            (w.nama_ayah && w.nama_ayah.toLowerCase().trim() === valLower) ||
            (w.nama_ibu && w.nama_ibu.toLowerCase().trim() === valLower) ||
            (w.nama_wali && w.nama_wali.toLowerCase().trim() === valLower)
          );
        })
        : null;

      let resolvedWaliId: number | null = null;
      if (!isWaliEmptyOrHyphen) {
        if (!waliData) {
          isWaliInvalid = true;
        } else {
          resolvedWaliId = waliData.wali_id;
        }
      }

      const namaWali = waliData
        ? getNamaWali(waliData)
        : !isWaliEmptyOrHyphen
          ? `${waliInput}`
          : "-";

      const warningMessages: string[] = [];
      if (isKelasInvalid) warningMessages.push(`Kelas "${kelasInput}" tidak ditemukan (diabaikan)`);
      if (isWaliInvalid) warningMessages.push(`Wali "${waliInput}" tidak ditemukan (diabaikan)`);

      const hasError = errorMessages.length > 0;
      const hasWarning = warningMessages.length > 0;

      const nisErr = isNisEmpty ? "NIS wajib diisi" : isDuplicateNis ? "NIS kembar (sudah terdaftar)" : null;
      const nisnErr = isNisnEmpty ? "NISN wajib diisi" : isDuplicateNisn ? "NISN kembar (sudah terdaftar)" : null;
      const namaErr = isNamaEmpty ? "Nama wajib diisi" : isDuplicateNama ? "Nama kembar (sudah terdaftar)" : null;
      const jkErr = isJkEmpty ? "Jenis Kelamin wajib diisi (L/P)" : isJkInvalid ? "Jenis Kelamin harus L atau P" : null;
      const tempatLahirErr = isTempatLahirEmpty ? "Tempat Lahir wajib diisi" : null;
      const tanggalLahirErr = isTanggalLahirEmpty ? "Tanggal Lahir wajib diisi" : isTglLahirInvalid ? "Format YYYY-MM-DD" : null;
      const agamaErr = isAgamaEmpty ? "Agama wajib diisi" : null;
      const kewarganegaraanErr = isKewarganegaraanEmpty ? "Kewarganegaraan wajib diisi" : null;
      const asalSekolahErr = isAsalSekolahEmpty ? "Asal Sekolah wajib diisi" : null;
      const tahunMasukErr = isTahunMasukEmpty ? "Tahun Masuk wajib diisi" : isTahunMasukInvalid ? "Tahun Masuk tidak valid" : null;
      const statusErr = isStatusInvalid ? "Status harus Aktif atau Tidak Aktif" : null;
      const asramaErr = isAsramaInvalid ? "Asrama harus Ya atau Tidak" : null;

      return {
        ...row,
        index,
        hasError,
        hasWarning,
        isNisEmpty,
        isNisnEmpty,
        isNamaEmpty,
        isJkEmpty,
        isTempatLahirEmpty,
        isTanggalLahirEmpty,
        isAgamaEmpty,
        isKewarganegaraanEmpty,
        isAsalSekolahEmpty,
        isTahunMasukEmpty,
        isDuplicateNis,
        isDuplicateNisn,
        isDuplicateNama,
        nisErr,
        nisnErr,
        namaErr,
        jkErr,
        tempatLahirErr,
        tanggalLahirErr,
        agamaErr,
        kewarganegaraanErr,
        asalSekolahErr,
        tahunMasukErr,
        statusErr,
        asramaErr,
        isKelasInvalid,
        namaKelas,
        isWaliInvalid,
        namaWali,
        resolvedKelasId,
        resolvedWaliId,
        duplicateReason: errorMessages.join(", "),
        warningReason: warningMessages.join(", "),
      };
    });
  }, [importData, dataSiswa, dataKelas, dataWali, isLoading]);

  const invalidRows = useMemo(() => previewRows.filter((r) => r.hasError), [previewRows]);
  const validRows = useMemo(() => previewRows.filter((r) => !r.hasError), [previewRows]);

  const hasFatalError = previewRows.some(r => r.hasError);
  const hasWarningRows = previewRows.some(r => r.hasWarning);

  useEffect(() => {
    if (!isLoading) {
      if (validRows.length === 0 && previewRows.length > 0) {
        toast.error("Semua data dalam file tidak valid/bermasalah. Tidak ada data yang dapat diimpor.");
      } else if (hasFatalError) {
        toast.warning(
          `Terdeteksi ${invalidRows.length} data bermasalah yang akan di-skip. ${validRows.length} data valid siap diimpor.`
        );
      }
    }
  }, [isLoading, hasFatalError, invalidRows.length, validRows.length, previewRows.length]);

  if (!importData || importData.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 mb-4">Tidak ada data untuk di-preview.</p>
        <Button onClick={() => navigate("/master-data/siswa")}>Kembali</Button>
      </div>
    );
  }

  const renderTableRows = (rows: typeof previewRows) => {
    return rows.map((row) => (
      <tr key={row.index} className={`hover:bg-slate-50 transition-colors ${row.hasError ? "bg-red-50/40" : row.hasWarning ? "bg-amber-50/30" : ""}`}>
        <td className="px-4 py-3 font-medium text-slate-900">{row.index + 1}</td>

        {/* NIS */}
        <td className="px-4 py-3 font-mono" title={row.nisErr || ""}>
          {row.nisErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.isNisEmpty ? "NIS Kosong" : row.nis}
            </span>
          ) : (
            row.nis || "—"
          )}
        </td>

        {/* NISN */}
        <td className="px-4 py-3 font-mono text-xs" title={row.nisnErr || ""}>
          {row.nisnErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.isNisnEmpty ? "NISN Kosong" : row.nisn}
            </span>
          ) : (
            row.nisn && row.nisn !== "-" ? row.nisn : "—"
          )}
        </td>

        {/* NIK */}
        <td className="px-4 py-3 font-mono text-xs">{row.nik || "—"}</td>

        {/* No KK */}
        <td className="px-4 py-3 font-mono text-xs">{row.no_kk || "—"}</td>

        {/* No Akta Kelahiran */}
        <td className="px-4 py-3 text-xs">{row.no_akta_kelahiran || "—"}</td>

        {/* PIN */}
        <td className="px-4 py-3 font-mono text-xs">{row.pin || "—"}</td>

        {/* Nama Siswa */}
        <td className="px-4 py-3 font-medium" title={row.namaErr || ""}>
          {row.namaErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.isNamaEmpty ? "Nama Kosong" : row.nama}
            </span>
          ) : (
            row.nama || "—"
          )}
        </td>

        {/* Nama Panggilan */}
        <td className="px-4 py-3 text-xs text-slate-600">{row.panggilan || "—"}</td>

        {/* Jenis Kelamin */}
        <td className="px-4 py-3" title={row.jkErr || ""}>
          {row.jkErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.jenis_kelamin || "Kosong"}
            </span>
          ) : (
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${row.jenis_kelamin === "L" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"}`}>
              {row.jenis_kelamin}
            </span>
          )}
        </td>

        {/* Tempat Lahir */}
        <td className="px-4 py-3 text-xs text-slate-600" title={row.tempatLahirErr || ""}>
          {row.tempatLahirErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              Tempat Lahir Kosong
            </span>
          ) : (
            row.tempat_lahir || "—"
          )}
        </td>

        {/* Tanggal Lahir */}
        <td className="px-4 py-3 text-xs font-mono" title={row.tanggalLahirErr || ""}>
          {row.tanggalLahirErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.isTanggalLahirEmpty ? "Tanggal Lahir Kosong" : row.tanggal_lahir}
            </span>
          ) : (
            row.tanggal_lahir || "—"
          )}
        </td>

        {/* Agama */}
        <td className="px-4 py-3 text-xs text-slate-600" title={row.agamaErr || ""}>
          {row.agamaErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              Agama Kosong
            </span>
          ) : (
            row.agama || "—"
          )}
        </td>

        {/* Kewarganegaraan */}
        <td className="px-4 py-3 text-xs text-slate-600" title={row.kewarganegaraanErr || ""}>
          {row.kewarganegaraanErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              Kewarganegaraan Kosong
            </span>
          ) : (
            row.kewarganegaraan || "—"
          )}
        </td>

        {/* Kode Pos */}
        <td className="px-4 py-3 text-xs font-mono text-slate-600">{row.kode_pos || "—"}</td>

        {/* Alamat */}
        <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate" title={row.alamat || ""}>{row.alamat || "—"}</td>

        {/* RT */}
        <td className="px-4 py-3 text-xs text-center text-slate-600">{row.rt || "—"}</td>

        {/* RW */}
        <td className="px-4 py-3 text-xs text-center text-slate-600">{row.rw || "—"}</td>

        {/* Desa/Kelurahan */}
        <td className="px-4 py-3 text-xs text-slate-600">{row.desa_kelurahan || "—"}</td>

        {/* Kecamatan */}
        <td className="px-4 py-3 text-xs text-slate-600">{row.kecamatan || "—"}</td>

        {/* Kabupaten/Kota */}
        <td className="px-4 py-3 text-xs text-slate-600">{row.kabupaten_kota || "—"}</td>

        {/* Provinsi */}
        <td className="px-4 py-3 text-xs text-slate-600">{row.provinsi || "—"}</td>

        {/* Kelas */}
        <td className="px-4 py-3 text-xs font-mono">
          {(row as any).isKelasInvalid ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300" title={`Kelas "${(row as any).namaKelas}" tidak ditemukan di database (akan dikosongkan/diabaikan)`}>
              {(row as any).namaKelas} <span className="text-[10px] font-normal text-amber-700">(Diabaikan)</span>
            </span>
          ) : (
            (row as any).namaKelas
          )}
        </td>

        {/* Wali Murid */}
        <td className="px-4 py-3 text-xs">
          {(row as any).isWaliInvalid ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300" title={`Wali murid "${(row as any).namaWali}" tidak ditemukan di database (akan dikosongkan/diabaikan)`}>
              {(row as any).namaWali} <span className="text-[10px] font-normal text-amber-700">(Diabaikan)</span>
            </span>
          ) : (
            (row as any).namaWali
          )}
        </td>

        {/* Status */}
        <td className="px-4 py-3" title={row.statusErr || ""}>
          {row.statusErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.status || "Invalid"}
            </span>
          ) : (
            row.status || "—"
          )}
        </td>

        {/* Asrama */}
        <td className="px-4 py-3 text-xs text-center" title={row.asramaErr || ""}>
          {row.asramaErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.keterangan_asrama || "Invalid"}
            </span>
          ) : (
            row.keterangan_asrama || "—"
          )}
        </td>

        {/* Asal Sekolah */}
        <td className="px-4 py-3 text-xs text-slate-600" title={row.asalSekolahErr || ""}>
          {row.asalSekolahErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              Asal Sekolah Kosong
            </span>
          ) : (
            row.asal_sekolah || "—"
          )}
        </td>

        {/* No UN SBLM */}
        <td className="px-4 py-3 text-xs font-mono text-slate-600">{row.no_un_sebelumnya || "—"}</td>

        {/* Tahun Masuk */}
        <td className="px-4 py-3 text-xs font-mono text-center" title={row.tahunMasukErr || ""}>
          {row.tahunMasukErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.isTahunMasukEmpty ? "Tahun Kosong" : row.tahun_masuk}
            </span>
          ) : (
            row.tahun_masuk || "—"
          )}
        </td>

        {/* Alamat Sekolah Asal */}
        <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate" title={row.alamat_sekolah_asal || ""}>{row.alamat_sekolah_asal || "—"}</td>

        {/* Status Import */}
        <td className="px-4 py-3 text-center">
          {row.hasError ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200" title={row.duplicateReason}>
              {row.duplicateReason}
            </span>
          ) : row.hasWarning ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300" title={row.warningReason}>
              Valid (Warning)
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
              Valid
            </span>
          )}
        </td>
      </tr>
    ));
  };

  const renderTableHeader = () => (
    <thead className="bg-slate-50 text-slate-600 font-medium sticky top-0 z-10 shadow-sm">
      <tr>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">No</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">NIS</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">NISN</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">NIK</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">No KK</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">No Akta Kelahiran</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">PIN</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Nama Siswa</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Panggilan</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">L/P</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Tempat Lahir</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Tanggal Lahir</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Agama</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Kewarganegaraan</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Kode Pos</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Alamat</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">RT</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">RW</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Desa/Kelurahan</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Kecamatan</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Kabupaten/Kota</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Provinsi</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Kelas</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Wali Murid</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Status</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Asrama</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Asal Sekolah</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">No UN SBLM</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Tahun Masuk</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Alamat Sekolah Asal</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-center">Status Import</th>
      </tr>
    </thead>
  );

  const handleSimpan = async () => {
    if (validRows.length === 0) {
      toast.error("Tidak ada data valid untuk diimpor.", {
        description: "Harap perbaiki file Excel Anda sebelum melanjutkan.",
      });
      return;
    }

    if (invalidRows.length > 0) {
      toast.warning("Melanjutkan Import (Data Bermasalah Di-skip)", {
        description: `Sebanyak ${invalidRows.length} data tidak valid akan dilewati dan tidak diunggah. Memproses ${validRows.length} data valid...`,
        duration: 5000,
      });
    }

    // Ubah data nama menjadi ID real sebelum dikirim ke database
    const resolvedPayloads = validRows.map((row: any) => {
      const {
        index,
        hasError,
        hasWarning,
        isKelasInvalid,
        namaKelas,
        isWaliInvalid,
        namaWali,
        resolvedKelasId,
        resolvedWaliId,
        duplicateReason,
        warningReason,
        kelas,
        wali_murid,
        nisErr,
        nisnErr,
        namaErr,
        jkErr,
        tempatLahirErr,
        tanggalLahirErr,
        agamaErr,
        kewarganegaraanErr,
        asalSekolahErr,
        tahunMasukErr,
        statusErr,
        asramaErr,
        isNisEmpty,
        isNisnEmpty,
        isNamaEmpty,
        isJkEmpty,
        isTempatLahirEmpty,
        isTanggalLahirEmpty,
        isAgamaEmpty,
        isKewarganegaraanEmpty,
        isAsalSekolahEmpty,
        isTahunMasukEmpty,
        isDuplicateNis,
        isDuplicateNisn,
        isDuplicateNama,
        ...cleanRow
      } = row;

      return {
        ...cleanRow,
        // Normalisasi nisn kosong ke null agar tidak bentrok dengan UNIQUE constraint database
        nisn: cleanRow.nisn?.toString()?.trim() || null,
        kelas_id: resolvedKelasId || null,
        wali_murid_id: resolvedWaliId || null
      };
    });

    setIsSubmitting(true);
    setProgress(0);

    const BATCH_SIZE = 50;
    const totalBatches = Math.ceil(resolvedPayloads.length / BATCH_SIZE);
    let successCount = 0;
    let failedCount = 0;

    setImportStats({ currentBatch: 0, totalBatches, success: 0, failed: 0 });

    for (let i = 0; i < resolvedPayloads.length; i += BATCH_SIZE) {
      const batch = resolvedPayloads.slice(i, i + BATCH_SIZE);
      const currentBatchNum = Math.floor(i / BATCH_SIZE) + 1;

      setImportStats(prev => prev ? { ...prev, currentBatch: currentBatchNum } : null);

      try {
        await restClient.post("/siswa", batch, {
          headers: { Prefer: "return=representation" },
        });
        successCount += batch.length;
      } catch (error: any) {
        failedCount += batch.length;
        const pgCode = error?.response?.data?.code;
        const pgMessage = error?.response?.data?.message || "";
        console.error(`Batch ${currentBatchNum} failed:`, pgCode, pgMessage);

        if (pgCode === "23503" || pgMessage.includes("fkey")) {
          toast.error(`Batch ${currentBatchNum} gagal: Referensi relasi (kelas/wali) tidak valid.`);
        } else if (pgCode === "23505" || pgMessage.includes("duplicate")) {
          toast.error(`Batch ${currentBatchNum} gagal: Terdapat duplikat NIS/NISN.`);
        } else {
          toast.error(`Batch ${currentBatchNum} gagal: Terjadi kesalahan tidak terduga.`);
        }
      }

      setImportStats(prev => prev ? { ...prev, success: successCount, failed: failedCount } : null);
      setProgress(Math.round(((i + BATCH_SIZE) / resolvedPayloads.length) * 100));
    }

    if (failedCount === 0) {
      if (invalidRows.length > 0) {
        toast.success(`Berhasil mengimpor ${successCount} data siswa (${invalidRows.length} data tidak valid dilewati).`);
      } else {
        toast.success(`Berhasil mengimpor ${successCount} data siswa.`);
      }
    } else {
      toast.warning(`Selesai dengan pesan error. Berhasil: ${successCount}, Gagal: ${failedCount} (${invalidRows.length} data tidak valid dilewati). Cek pesan notifikasi.`, { duration: 8000 });
    }

    queryClient.invalidateQueries({ queryKey: ['master-data', 'siswa-all'] });

    if (successCount > 0) {
      setTimeout(() => {
        navigate("/master-data/siswa");
      }, 2000);
    } else {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center uppercase">
            <ArrowLeft className="w-5 h-5 mr-3 cursor-pointer text-gray-500 hover:text-gray-700" onClick={() => navigate("/master-data/siswa")} />
            Preview Import Siswa
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-8">Periksa kembali data siswa sebelum disimpan ke database</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/master-data/siswa")} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            onClick={handleSimpan}
            disabled={isSubmitting || isLoading || validRows.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {invalidRows.length > 0
                  ? `Tambahkan ${validRows.length} Data Valid (${invalidRows.length} Di-skip)`
                  : `Tambahkan Semua (${validRows.length} Siswa)`}
              </>
            )}
          </Button>
        </div>
      </div>

      {isSubmitting && importStats && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">
              Menyimpan Batch {importStats.currentBatch} dari {importStats.totalBatches}
            </span>
            <span className="text-sm font-bold text-indigo-600">{Math.min(100, progress)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, progress)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-3 text-xs">
            <span className="text-emerald-600 font-medium">Berhasil: {importStats.success}</span>
            <span className="text-rose-600 font-medium">Gagal: {importStats.failed}</span>
          </div>
        </div>
      )}
      {/* Info: Akun akan dibuat otomatis */}
      <div className="bg-white text-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold text-slate-900 mb-1">Akun Login Dibuat Otomatis</p>
          <p>
            Setiap siswa yang diimpor akan mendapatkan akun login dengan{" "}
            <strong>username = NIS</strong> dan <strong>password default = password123</strong>.
            Akun ini dapat digunakan untuk masuk ke sistem MLMS setelah import selesai.
          </p>
        </div>
      </div>

      {hasFatalError && !isSubmitting && (
        <div className="bg-white text-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500 flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-slate-900 text-sm mb-1">Perhatian: Terdapat {invalidRows.length} Data Bermasalah (Akan Di-skip)</p>
            <p className="text-xs mt-1">
              Sistem mendeteksi {invalidRows.length} data bermasalah pada <strong>Tabel 1 (Data Bermasalah)</strong>. Data yang bermasalah akan <strong>otomatis dilewati (di-skip)</strong> dan tidak disimpan ke database. Hanya <strong>{validRows.length} data valid</strong> pada Tabel 2 yang akan diunggah.
            </p>
          </div>
        </div>
      )}

      {hasWarningRows && !isSubmitting && (
        <div className="bg-white text-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500 flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-slate-900 text-sm mb-1">Catatan Warning: Referensi Kelas atau Wali Murid Tidak Ditemukan</p>
            <p className="text-xs mt-1">
              Sistem mendeteksi beberapa data siswa yang memiliki Kelas atau Wali Murid tidak terdaftar di database (ditandai warna kuning). Data siswa tersebut <strong>tetap dapat diimpor</strong>, namun relasi Kelas atau Wali Murid yang tidak valid akan <strong>diabaikan (dikosongkan)</strong>.
            </p>
          </div>
        </div>
      )}

      {!hasFatalError && !isLoading && (
        <div className="bg-white text-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500 flex items-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
          <p className="text-sm font-medium">Data valid siap ditambahkan ke database ({validRows.length} siswa).</p>
        </div>
      )}

      {/* Tabel referensi kelas yang tersedia */}
      {!isLoadingKelas && dataKelas.length > 0 && (
        <details className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden group">
          <summary className="px-5 py-4 text-slate-800 text-sm font-bold cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-500" />
            Referensi Nama Kelas yang Tersedia ({dataKelas.length} kelas)
            <span className="text-xs font-normal text-slate-500 ml-auto group-open:hidden">Klik untuk lihat</span>
            <span className="text-xs font-normal text-slate-500 ml-auto hidden group-open:inline">Klik untuk sembunyikan</span>
          </summary>
          <div className="p-5 border-t border-slate-100 overflow-x-auto">
            <table className="text-xs text-left w-full">
              <thead>
                <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2 pr-6 font-semibold">Nama Kelas (Tulis di Excel)</th>
                  <th className="py-2 font-semibold">Lembaga</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 divide-y divide-slate-100">
                {dataKelas.map((k: any) => (
                  <tr key={k.kelas_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2 pr-6 font-medium text-slate-900">{k.nama_kelas}</td>
                    <td className="py-2">{k.lembaga?.singkatan || k.lembaga?.nama_lembaga || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {/* Tabel referensi wali murid yang tersedia */}
      {!isLoadingWali && dataWali.length > 0 && (
        <details className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden group">
          <summary className="px-5 py-4 text-slate-800 text-sm font-bold cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            Referensi Nama Wali Murid yang Tersedia ({dataWali.length} wali)
            <span className="text-xs font-normal text-slate-500 ml-auto group-open:hidden">Klik untuk lihat</span>
            <span className="text-xs font-normal text-slate-500 ml-auto hidden group-open:inline">Klik untuk sembunyikan</span>
          </summary>
          <div className="p-5 border-t border-slate-100 overflow-x-auto">
            <table className="text-xs text-left w-full">
              <thead>
                <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2 pr-6 font-semibold">Nama Ayah</th>
                  <th className="py-2 pr-6 font-semibold">Nama Ibu</th>
                  <th className="py-2 pr-6 font-semibold">Nama Wali</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 divide-y divide-slate-100">
                {dataWali.map((w: any) => (
                  <tr key={w.wali_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2 pr-6">{w.nama_ayah || "—"}</td>
                    <td className="py-2 pr-6">{w.nama_ibu || "—"}</td>
                    <td className="py-2 pr-6">{w.nama_wali || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {/* ──────────────── TABEL ATAS: DATA BERMASALAH / INVALID ──────────────── */}
      <Card className="border-red-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="font-bold text-red-900 text-sm uppercase tracking-wide">
              1. Data Bermasalah / Invalid ({invalidRows.length} Siswa)
            </h2>
          </div>
          {invalidRows.length > 0 ? (
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
              Akan Di-skip ({invalidRows.length} Siswa)
            </span>
          ) : (
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-300">
              Bersih (0 Bermasalah)
            </span>
          )}
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm text-left border-collapse">
              {renderTableHeader()}
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={31} className="text-center py-12 text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Sedang memvalidasi data...
                    </td>
                  </tr>
                ) : invalidRows.length === 0 ? (
                  <tr>
                    <td colSpan={31} className="text-center py-8 text-emerald-600 bg-emerald-50/30">
                      <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                      <span className="font-semibold text-sm">Tidak ada data bermasalah. Semua baris dalam berkas impor lulus validasi!</span>
                    </td>
                  </tr>
                ) : (
                  renderTableRows(invalidRows)
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ──────────────── TABEL BAWAH: DATA VALID ──────────────── */}
      <Card className="border-emerald-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-50 border-b border-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-emerald-900 text-sm uppercase tracking-wide">
              2. Data Valid ({validRows.length} Siswa)
            </h2>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
            Siap Diimpor
          </span>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm text-left border-collapse">
              {renderTableHeader()}
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={31} className="text-center py-12 text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Sedang memvalidasi data...
                    </td>
                  </tr>
                ) : validRows.length === 0 ? (
                  <tr>
                    <td colSpan={31} className="text-center py-8 text-slate-500 bg-slate-50/50">
                      <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-amber-500" />
                      <span className="font-semibold text-sm">Tidak ada data valid yang dapat diimpor. Silakan perbaiki data bermasalah di atas terlebih dahulu.</span>
                    </td>
                  </tr>
                ) : (
                  renderTableRows(validRows)
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
