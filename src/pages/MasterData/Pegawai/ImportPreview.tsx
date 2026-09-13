import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { restClient } from "../../../lib/api/axios";
import { toast } from "sonner";
import type { PEGAWAI_CREATE } from "../../../types/database";
import { createUserAuth } from "../../../lib/api/services/userService";

type ImportRowRaw = PEGAWAI_CREATE & { [key: string]: any };

export default function PegawaiImportPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const importData: ImportRowRaw[] = location.state?.importData || [];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importStats, setImportStats] = useState<{ current: number; total: number; success: number; failed: number } | null>(null);

  // Fetch existing pegawai for duplicate check
  const { data: dataPegawai = [], isLoading: isLoadingPegawai } = useQuery({
    queryKey: ["master-data", "pegawai-preview-all"],
    queryFn: async () => {
      const PAGE_SIZE = 1000;
      let allPegawai: any[] = [];
      let page = 0;
      
      while (true) {
        const response = await restClient.get("/pegawai", {
          params: { select: "nig,nip,nik,nama", limit: PAGE_SIZE, offset: page * PAGE_SIZE },
        });
        const data = response.data || [];
        allPegawai = [...allPegawai, ...data];
        if (data.length < PAGE_SIZE) break;
        page++;
      }
      return allPegawai;
    },
  });

  // Fetch daftar lembaga untuk validasi & resolusi kolom lembaga
  const { data: dataLembaga = [], isLoading: isLoadingLembaga } = useQuery({
    queryKey: ["master-data", "lembaga-preview-options"],
    queryFn: async () => {
      const response = await restClient.get("/lembaga", {
        params: { select: "lembaga_id,nama_lembaga,singkatan" },
      });
      return response.data || [];
    },
  });

  const isLoading = isLoadingPegawai || isLoadingLembaga;

  const previewRows = useMemo(() => {
    if (isLoading) return [];

    const isValidValue = (val: any): boolean => {
      if (val === undefined || val === null) return false;
      const str = String(val).trim().toLowerCase();
      return str !== "" && str !== "-" && str !== "—" && str !== "null" && str !== "undefined";
    };

    const nigSet = new Set<string>();
    const namaSet = new Set<string>();
    const nipSet = new Set<string>();
    const nikSet = new Set<string>();

    return importData.map((row: any, index) => {
      let isDuplicateNig = false;
      let isDuplicateNama = false;
      let isDuplicateNip = false;
      let isDuplicateNik = false;
      const errorMessages: string[] = [];

      // A. Validasi Field Wajib Kosong
      const isNigEmpty = !isValidValue(row.nig);
      const isNamaEmpty = !isValidValue(row.nama);
      const isJkEmpty = !isValidValue(row.jenis_kelamin);
      const isJabatanEmpty = !isValidValue(row.jabatan);

      if (isNigEmpty) errorMessages.push("NIG kosong");
      if (isNamaEmpty) errorMessages.push("Nama kosong");
      if (isJkEmpty) errorMessages.push("Jenis Kelamin kosong");
      if (isJabatanEmpty) errorMessages.push("Jabatan kosong");

      // B. Validasi Format & Nilai Valid
      const isJkInvalid = !!(row.jenis_kelamin && row.jenis_kelamin !== "L" && row.jenis_kelamin !== "P");
      if (isJkInvalid) {
        errorMessages.push("Jenis Kelamin tidak valid (harus L atau P)");
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

      const isStatusInvalid = !!(
        row.status &&
        row.status !== "Aktif" &&
        row.status !== "Tidak Aktif"
      );
      if (isStatusInvalid) {
        errorMessages.push("Status tidak valid (harus Aktif atau Tidak Aktif)");
      }

      const isJmlAnakLakiInvalid = !!(
        row.jumlah_anak_laki !== undefined &&
        row.jumlah_anak_laki !== null &&
        row.jumlah_anak_laki !== "" &&
        isNaN(Number(row.jumlah_anak_laki))
      );
      if (isJmlAnakLakiInvalid) {
        errorMessages.push("Jumlah anak (L) tidak valid");
      }

      const isJmlAnakPerempuanInvalid = !!(
        row.jumlah_anak_perempuan !== undefined &&
        row.jumlah_anak_perempuan !== null &&
        row.jumlah_anak_perempuan !== "" &&
        isNaN(Number(row.jumlah_anak_perempuan))
      );
      if (isJmlAnakPerempuanInvalid) {
        errorMessages.push("Jumlah anak (P) tidak valid");
      }

      // C. Cek duplikat internal (di dalam file Excel itu sendiri)
      const nigVal = row.nig ? String(row.nig).trim() : "";
      const namaVal = row.nama ? String(row.nama).trim() : "";
      const nipVal = row.nip ? String(row.nip).trim() : "";
      const nikVal = row.nik ? String(row.nik).trim() : "";

      const hasNig = isValidValue(nigVal);
      const hasNama = isValidValue(namaVal);
      const hasNip = isValidValue(nipVal);
      const hasNik = isValidValue(nikVal);

      const nigLower = nigVal.toLowerCase();
      const namaLower = namaVal.toLowerCase();
      const nipLower = nipVal.toLowerCase();
      const nikLower = nikVal.toLowerCase();

      if (hasNig && nigSet.has(nigLower)) isDuplicateNig = true;
      if (hasNama && namaSet.has(namaLower)) isDuplicateNama = true;
      if (hasNip && nipSet.has(nipLower)) isDuplicateNip = true;
      if (hasNik && nikSet.has(nikLower)) isDuplicateNik = true;

      if (hasNig) nigSet.add(nigLower);
      if (hasNama) namaSet.add(namaLower);
      if (hasNip) nipSet.add(nipLower);
      if (hasNik) nikSet.add(nikLower);

      // D. Cek duplikat eksternal (terhadap database)
      if (
        !isDuplicateNig &&
        hasNig &&
        dataPegawai.some((p: any) => isValidValue(p.nig) && String(p.nig).trim().toLowerCase() === nigLower)
      )
        isDuplicateNig = true;
      if (
        !isDuplicateNama &&
        hasNama &&
        dataPegawai.some((p: any) => isValidValue(p.nama) && String(p.nama).trim().toLowerCase() === namaLower)
      )
        isDuplicateNama = true;
      if (
        !isDuplicateNip &&
        hasNip &&
        dataPegawai.some((p: any) => isValidValue(p.nip) && String(p.nip).trim().toLowerCase() === nipLower)
      )
        isDuplicateNip = true;
      if (
        !isDuplicateNik &&
        hasNik &&
        dataPegawai.some((p: any) => isValidValue(p.nik) && String(p.nik).trim().toLowerCase() === nikLower)
      )
        isDuplicateNik = true;

      if (isDuplicateNig) errorMessages.push("NIG kembar");
      if (isDuplicateNama) errorMessages.push("Nama kembar");
      if (isDuplicateNip && hasNip) errorMessages.push("NIP kembar");
      if (isDuplicateNik && hasNik) errorMessages.push("NIK kembar");

      // E. Resolusi kolom lembaga (non-blocking: warning jika tidak ditemukan)
      const lembagaInput = row.lembaga ? String(row.lembaga).trim() : "";
      const isLembagaFilled = isValidValue(lembagaInput);
      let resolvedLembagaId: number | null = null;
      let isLembagaInvalid = false;

      if (isLembagaFilled) {
        const lembagaMatch = dataLembaga.find((l: any) => {
          const inputLower = lembagaInput.toLowerCase();
          return (
            l.nama_lembaga?.toLowerCase() === inputLower ||
            (l.singkatan && l.singkatan.toLowerCase() === inputLower)
          );
        });
        if (lembagaMatch) {
          resolvedLembagaId = lembagaMatch.lembaga_id;
        } else {
          isLembagaInvalid = true; // Warning non-blocking: impor tetap lanjut
        }
      }

      const hasError = errorMessages.length > 0;

      // Pesan Error per Field untuk Penanda visual sel
      const nigErr = isNigEmpty ? "NIG wajib diisi" : isDuplicateNig ? "NIG kembar (sudah terdaftar)" : null;
      const nipErr = hasNip && isDuplicateNip ? "NIP kembar (sudah terdaftar)" : null;
      const nikErr = hasNik && isDuplicateNik ? "NIK kembar (sudah terdaftar)" : null;
      const namaErr = isNamaEmpty ? "Nama wajib diisi" : isDuplicateNama ? "Nama kembar (sudah terdaftar)" : null;
      const jkErr = isJkEmpty ? "Jenis Kelamin wajib diisi (L/P)" : isJkInvalid ? "Jenis Kelamin harus L atau P" : null;
      const tglLahirErr = isTglLahirInvalid ? "Format Tanggal Lahir harus YYYY-MM-DD" : null;
      const statusErr = isStatusInvalid ? "Status harus Aktif atau Tidak Aktif" : null;
      const jabatanErr = isJabatanEmpty ? "Jabatan wajib diisi" : null;
      const jmlAnakLakiErr = isJmlAnakLakiInvalid ? "Harus berupa angka" : null;
      const jmlAnakPerempuanErr = isJmlAnakPerempuanInvalid ? "Harus berupa angka" : null;

      return {
        ...row,
        index,
        hasError,
        isNigEmpty,
        isNamaEmpty,
        isJkEmpty,
        isJabatanEmpty,
        isDuplicateNig,
        isDuplicateNama,
        isDuplicateNip,
        isDuplicateNik,
        nigErr,
        nipErr,
        nikErr,
        namaErr,
        jkErr,
        tglLahirErr,
        statusErr,
        jabatanErr,
        jmlAnakLakiErr,
        jmlAnakPerempuanErr,
        duplicateReason: errorMessages.join(", "),
        // Data lembaga
        lembagaInput,
        isLembagaFilled,
        isLembagaInvalid,
        resolvedLembagaId,
        namaLembagaDisplay: resolvedLembagaId
          ? dataLembaga.find((l: any) => l.lembaga_id === resolvedLembagaId)?.nama_lembaga || lembagaInput
          : isLembagaFilled
            ? lembagaInput
            : "-",
      };
    });
  }, [importData, dataPegawai, dataLembaga, isLoading]);

  const invalidRows = useMemo(() => previewRows.filter((r) => r.hasError), [previewRows]);
  const validRows = useMemo(() => previewRows.filter((r) => !r.hasError), [previewRows]);

  const hasFatalError = previewRows.some((r) => r.hasError);

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
        <Button onClick={() => navigate("/master-data/pegawai")}>Kembali</Button>
      </div>
    );
  }

  const renderTableRows = (rows: typeof previewRows) => {
    return rows.map((row) => (
      <tr
        key={row.index}
        className={`hover:bg-slate-50 transition-colors ${
          row.hasError ? "bg-red-50/40" : ""
        }`}
      >
        <td className="px-4 py-3 font-medium text-slate-900">{row.index + 1}</td>
        
        {/* NIG */}
        <td className="px-4 py-3 font-mono" title={row.nigErr || ""}>
          {row.nigErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.isNigEmpty ? "NIG Kosong" : row.nig}
            </span>
          ) : (
            row.nig || "—"
          )}
        </td>

        {/* NIP */}
        <td className="px-4 py-3 font-mono text-xs" title={row.nipErr || ""}>
          {row.nipErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.nip}
            </span>
          ) : (
            row.nip || "—"
          )}
        </td>

        {/* NIK */}
        <td className="px-4 py-3 font-mono text-xs" title={row.nikErr || ""}>
          {row.nikErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.nik}
            </span>
          ) : (
            row.nik || "—"
          )}
        </td>

        {/* Nama */}
        <td className="px-4 py-3 font-medium" title={row.namaErr || ""}>
          {row.namaErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.isNamaEmpty ? "Nama Kosong" : row.nama}
            </span>
          ) : (
            row.nama || "—"
          )}
        </td>

        {/* Jenis Kelamin */}
        <td className="px-4 py-3" title={row.jkErr || ""}>
          {row.jkErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.jenis_kelamin || "Kosong"}
            </span>
          ) : (
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                row.jenis_kelamin === "L"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-pink-50 text-pink-700"
              }`}
            >
              {row.jenis_kelamin}
            </span>
          )}
        </td>

        {/* Tempat Lahir */}
        <td className="px-4 py-3 text-xs text-slate-600">{row.tempat_lahir || "—"}</td>

        {/* Tanggal Lahir */}
        <td className="px-4 py-3 text-xs font-mono" title={row.tglLahirErr || ""}>
          {row.tglLahirErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.tanggal_lahir || "Invalid"}
            </span>
          ) : (
            row.tanggal_lahir || "—"
          )}
        </td>

        {/* Alamat */}
        <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate" title={row.alamat || ""}>
          {row.alamat || "—"}
        </td>

        {/* No HP */}
        <td className="px-4 py-3 text-xs text-slate-600 font-mono">{row.no_hp || "—"}</td>

        {/* Status */}
        <td className="px-4 py-3" title={row.statusErr || ""}>
          {row.statusErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.status || "Invalid"}
            </span>
          ) : (
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                row.status === "Aktif"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {row.status || "Aktif"}
            </span>
          )}
        </td>

        {/* Jabatan */}
        <td className="px-4 py-3 text-slate-600" title={row.jabatanErr || ""}>
          {row.jabatanErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              Jabatan Kosong
            </span>
          ) : (
            row.jabatan || "—"
          )}
        </td>

        {/* Tugas Tambahan */}
        <td className="px-4 py-3 text-xs text-slate-600">{row.tugas_tambahan || "—"}</td>

        {/* Jml Anak Laki */}
        <td className="px-4 py-3 text-xs text-center text-slate-600" title={row.jmlAnakLakiErr || ""}>
          {row.jmlAnakLakiErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.jumlah_anak_laki}
            </span>
          ) : (
            row.jumlah_anak_laki ?? "—"
          )}
        </td>

        {/* Jml Anak Perempuan */}
        <td className="px-4 py-3 text-xs text-center text-slate-600" title={row.jmlAnakPerempuanErr || ""}>
          {row.jmlAnakPerempuanErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.jumlah_anak_perempuan}
            </span>
          ) : (
            row.jumlah_anak_perempuan ?? "—"
          )}
        </td>

        {/* Nama Ayah */}
        <td className="px-4 py-3 text-xs text-slate-600">{row.nama_ayah || "—"}</td>

        {/* Nama Ibu */}
        <td className="px-4 py-3 text-xs text-slate-600">{row.nama_ibu || "—"}</td>

        {/* Gol. Darah */}
        <td className="px-4 py-3 text-xs text-center font-bold text-slate-700">{row.golongan_darah || "—"}</td>

        {/* Kolom Lembaga — non-blocking: warning jika tidak ditemukan */}
        <td className="px-4 py-3">
          {(row as any).isLembagaInvalid ? (
            <span
              title={`"${(row as any).lembagaInput}" tidak ditemukan di sistem`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
            >
              {(row as any).lembagaInput}
            </span>
          ) : (row as any).resolvedLembagaId ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              {(row as any).namaLembagaDisplay}
            </span>
          ) : (
            <span className="text-slate-400 text-xs">—</span>
          )}
        </td>

        {/* Status Import */}
        <td className="px-4 py-3 text-center">
          {row.hasError ? (
            <span
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200"
              title={row.duplicateReason}
            >
              {row.duplicateReason}
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
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">NIG</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">NIP</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">NIK</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Nama</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">L/P</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Tempat Lahir</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Tanggal Lahir</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Alamat</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">No HP</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Status</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Jabatan</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Tugas Tambahan</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-center">Jml Anak (L)</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-center">Jml Anak (P)</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Nama Ayah</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Nama Ibu</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-center">Gol. Darah</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Lembaga</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-center">
          Status Import
        </th>
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

    setIsSubmitting(true);
    setProgress(0);
    let berhasil = 0;
    let gagal = 0;
    let current = 0;
    const total = validRows.length;
    const gagalDetail: string[] = [];

    setImportStats({ current: 0, total, success: 0, failed: 0 });

    for (const row of validRows) {
      current++;
      setImportStats(prev => prev ? { ...prev, current } : null);

      const {
        index: _idx,
        hasError: _he,
        isNigEmpty: _ne,
        isNamaEmpty: _nme,
        isJkEmpty: _je,
        isJabatanEmpty: _jbe,
        isDuplicateNig: _dNig,
        isDuplicateNama: _dNama,
        isDuplicateNip: _dNip,
        isDuplicateNik: _dNik,
        nigErr: _ne2,
        nipErr: _npe,
        nikErr: _nke,
        namaErr: _nafe,
        jkErr: _jke,
        tglLahirErr: _tle,
        statusErr: _se,
        jabatanErr: _jbe2,
        jmlAnakLakiErr: _jale,
        jmlAnakPerempuanErr: _jape,
        duplicateReason: _dr,
        lembagaInput: _li,
        isLembagaFilled: _lf,
        isLembagaInvalid: _lii,
        resolvedLembagaId,
        namaLembagaDisplay: _nld,
        ...cleanRow
      } = row as any;

      try {
        // 1. Buat user auth dengan NIG sebagai username
        const nig = String(cleanRow.nig).trim();
        const email = `${nig}@mlms.local`;
        let userId: string | undefined;

        try {
          const createdUser = await createUserAuth({
            email,
            password: "password123",
            username: nig,
          });
          userId = createdUser?.user?.id || createdUser?.id || createdUser?.user_id;
        } catch (authErr: any) {
          const responseMsg = JSON.stringify(authErr?.response?.data || {}).toLowerCase();
          const errMsg = (authErr?.message || "").toLowerCase();
          const isDuplicate = 
            authErr?.response?.status === 400 || 
            authErr?.response?.status === 409 || 
            responseMsg.includes("already") || 
            responseMsg.includes("duplicate") || 
            responseMsg.includes("exists") ||
            errMsg.includes("already exists") || 
            errMsg.includes("duplicate");

          if (isDuplicate) {
            try {
              const resUser = await restClient.get("/user", {
                params: { username: `eq.${nig}`, select: "user_id" },
              });
              userId = resUser.data?.[0]?.user_id || undefined;
            } catch (e) {
              console.warn(`Gagal mengambil existing user_id untuk ${nig}:`, e);
            }
          } else {
            throw authErr;
          }
        }

        const isValidValue = (val: any): boolean => {
          if (val === undefined || val === null) return false;
          const str = String(val).trim().toLowerCase();
          return str !== "" && str !== "-" && str !== "—" && str !== "null" && str !== "undefined";
        };

        // 2. Buat data pegawai
        const payload: any = {
          nig: cleanRow.nig,
          nip: isValidValue(cleanRow.nip) ? String(cleanRow.nip).trim() : null,
          nik: isValidValue(cleanRow.nik) ? String(cleanRow.nik).trim() : null,
          nama: cleanRow.nama,
          jenis_kelamin: cleanRow.jenis_kelamin,
          tempat_lahir: cleanRow.tempat_lahir || null,
          tanggal_lahir: cleanRow.tanggal_lahir || null,
          alamat: cleanRow.alamat || null,
          no_hp: cleanRow.no_hp || null,
          status: cleanRow.status || "Aktif",
          jabatan: cleanRow.jabatan,
          tugas_tambahan: cleanRow.tugas_tambahan || null,
          jumlah_anak_laki: cleanRow.jumlah_anak_laki !== undefined ? cleanRow.jumlah_anak_laki : null,
          jumlah_anak_perempuan: cleanRow.jumlah_anak_perempuan !== undefined ? cleanRow.jumlah_anak_perempuan : null,
          nama_ayah: cleanRow.nama_ayah || null,
          nama_ibu: cleanRow.nama_ibu || null,
          golongan_darah: cleanRow.golongan_darah || null,
        };

        if (userId) {
          payload.user_id = userId;
        }

        await restClient.post("/pegawai", payload, {
          headers: { Prefer: "return=representation" },
        });

        // Jika resolvedLembagaId tersedia, daftarkan pegawai ke pegawai_lembaga
        if (row.resolvedLembagaId) {
          try {
            // Ambil pegawai_id yang baru dibuat
            const newPegawai = await restClient.get("/pegawai", {
              params: { select: "pegawai_id", nig: `eq.${cleanRow.nig}`, limit: 1 },
            });
            const newPegawaiId = newPegawai.data?.[0]?.pegawai_id;
            if (newPegawaiId) {
              await restClient.post(
                "/pegawai_lembaga",
                { pegawai_id: newPegawaiId, lembaga_id: row.resolvedLembagaId },
                { headers: { Prefer: "resolution=ignore-duplicates" } }
              );
            }
          } catch (lembagaErr) {
            // Non-critical: catat warning tapi jangan gagalkan import
            console.warn(`Gagal daftarkan lembaga untuk ${cleanRow.nig}:`, lembagaErr);
          }
        }

        berhasil++;
      } catch (err: any) {
        gagal++;
        const resData = err?.response?.data;
        const msg = resData?.message || resData?.error || resData?.msg || err?.message || "Error tidak diketahui";
        gagalDetail.push(
          `Baris ${row.index + 1} (${row.nig}): ${msg}`
        );
      }
      
      setImportStats(prev => prev ? { ...prev, success: berhasil, failed: gagal } : null);
      setProgress(Math.round((current / total) * 100));
    }

    setIsSubmitting(false);

    if (gagal === 0) {
      if (invalidRows.length > 0) {
        toast.success(`Berhasil mengimpor ${berhasil} data pegawai (${invalidRows.length} data tidak valid dilewati).`);
      } else {
        toast.success(`Berhasil mengimpor ${berhasil} data pegawai beserta akun login-nya.`);
      }
      queryClient.invalidateQueries({ queryKey: ["master-data", "pegawai-all"] });
      navigate("/master-data/pegawai");
    } else if (berhasil > 0) {
      toast.warning(
        `${berhasil} pegawai berhasil diimpor, ${gagal} gagal (${invalidRows.length} data tidak valid dilewati). Cek console untuk detail.`
      );
      console.warn("Detail gagal import:", gagalDetail);
      queryClient.invalidateQueries({ queryKey: ["master-data", "pegawai-all"] });
      navigate("/master-data/pegawai");
    } else {
      toast.error(`Semua data gagal diimpor. Periksa kembali file Excel Anda.`);
      console.error("Detail gagal import:", gagalDetail);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center uppercase">
            <ArrowLeft
              className="w-5 h-5 mr-3 cursor-pointer text-gray-500 hover:text-gray-700"
              onClick={() => navigate("/master-data/pegawai")}
            />
            Preview Import Pegawai
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-8">
            Periksa kembali data pegawai sebelum disimpan ke database
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/master-data/pegawai")}
            disabled={isSubmitting}
          >
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
                  : `Tambahkan Semua (${validRows.length} Pegawai)`}
              </>
            )}
          </Button>
        </div>
      </div>

      {isSubmitting && importStats && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">
              Memproses data {importStats.current} dari {importStats.total}
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
            Setiap pegawai yang diimpor akan mendapatkan akun login dengan{" "}
            <strong>NIG</strong> dan <strong>password default = password123</strong>.
            Akun ini dapat digunakan untuk masuk ke sistem MLMS setelah import selesai.
          </p>
        </div>
      </div>

      {/* Warning Box jika ada error */}
      {hasFatalError && !isSubmitting && (
        <div className="bg-white text-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500 flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Perhatian: Terdapat {invalidRows.length} Data Bermasalah (Akan Di-skip)</p>
            <p className="text-xs mt-1">
              Sistem mendeteksi kesalahan pada data di <strong>Tabel 1 (Data Bermasalah)</strong>. Data yang bermasalah akan <strong>otomatis dilewati (di-skip)</strong> dan tidak disimpan ke database. Hanya <strong>{validRows.length} data valid</strong> pada Tabel 2 yang akan diunggah.
            </p>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {!hasFatalError && !isLoading && (
        <div className="bg-white text-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500 flex items-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
          <p className="text-sm font-medium">
            Semua data valid dan siap ditambahkan ke database ({validRows.length} pegawai).
          </p>
        </div>
      )}

      {/* ──────────────── TABEL ATAS: DATA BERMASALAH / INVALID ──────────────── */}
      <Card className="border-red-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="font-bold text-red-900 text-sm uppercase tracking-wide">
              1. Data Bermasalah / Invalid ({invalidRows.length} Pegawai)
            </h2>
          </div>
          {invalidRows.length > 0 ? (
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
              Akan Di-skip ({invalidRows.length} Pegawai)
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
                    <td colSpan={20} className="text-center py-12 text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Sedang memvalidasi data...
                    </td>
                  </tr>
                ) : invalidRows.length === 0 ? (
                  <tr>
                    <td colSpan={20} className="text-center py-8 text-emerald-600 bg-emerald-50/30">
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
              2. Data Valid ({validRows.length} Pegawai)
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
                    <td colSpan={20} className="text-center py-12 text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Sedang memvalidasi data...
                    </td>
                  </tr>
                ) : validRows.length === 0 ? (
                  <tr>
                    <td colSpan={20} className="text-center py-8 text-slate-500 bg-slate-50/50">
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
