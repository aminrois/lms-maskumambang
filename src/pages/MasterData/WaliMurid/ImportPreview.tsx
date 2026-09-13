import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, AlertTriangle, Loader2, Save, Info, Copy } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { restClient } from "@/lib/api/axios";
import { createUserAuth } from "@/lib/api/services/userService";

export default function WaliMuridImportPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const importData = location.state?.importData || [];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importStats, setImportStats] = useState<{ current: number; total: number; success: number; failed: number } | null>(null);

  // Ambil data Wali Murid eksisting untuk pengecekan duplikasi NIK
  const { data: dataWali = [], isLoading } = useQuery({
    queryKey: ["master-data", "wali-murid-all-preview"],
    queryFn: async () => {
      const res = await restClient.get("/wali_murid", {
        params: { select: "wali_id,nik_wali,nama_wali" },
      });
      return res.data || [];
    },
  });

  const previewRows = useMemo(() => {
    if (isLoading) return [];

    const isValidValue = (val: any): boolean => {
      if (val === undefined || val === null) return false;
      const str = String(val).trim().toLowerCase();
      return str !== "" && str !== "-" && str !== "—" && str !== "null" && str !== "undefined";
    };

    const nikWaliSet = new Set<string>();

    return importData.map((row: any, index: number) => {
      const errorMessages: string[] = [];

      const isNamaWaliEmpty = !isValidValue(row.nama_wali);
      const isNikWaliEmpty = !isValidValue(row.nik_wali);
      const isNoHpWaliEmpty = !isValidValue(row.no_hp_wali);
      const isAlamatEmpty = !isValidValue(row.alamat);

      if (isNamaWaliEmpty) errorMessages.push("Nama Wali kosong");
      if (isNikWaliEmpty) errorMessages.push("NIK Wali kosong");
      if (isNoHpWaliEmpty) errorMessages.push("No HP Wali kosong");
      if (isAlamatEmpty) errorMessages.push("Alamat kosong");

      const isStatusInvalid = !!(
        row.status &&
        row.status !== "Hidup" &&
        row.status !== "Wafat"
      );
      if (isStatusInvalid) {
        errorMessages.push("Status harus Hidup atau Wafat");
      }

      // C. Cek duplikat NIK Wali
      const nikWaliVal = row.nik_wali ? String(row.nik_wali).trim() : "";
      const hasNikWali = isValidValue(nikWaliVal);
      const nikWaliLower = nikWaliVal.toLowerCase();

      let isDuplicateInternal = false;
      let isDuplicateDb = false;

      if (hasNikWali && nikWaliSet.has(nikWaliLower)) {
        isDuplicateInternal = true;
      }
      if (hasNikWali) {
        nikWaliSet.add(nikWaliLower);
      }

      // D. Cek duplikat eksternal (terhadap DB)
      if (
        !isDuplicateInternal &&
        hasNikWali &&
        dataWali.some(
          (w: any) =>
            isValidValue(w.nik_wali) &&
            String(w.nik_wali).trim().toLowerCase() === nikWaliLower
        )
      ) {
        isDuplicateDb = true;
      }

      const isDuplicateNikWali = isDuplicateInternal || isDuplicateDb;

      if (isDuplicateInternal) {
        errorMessages.push("Duplikat di file (1 data sudah masuk tabel valid, baris ini di-skip)");
      } else if (isDuplicateDb) {
        errorMessages.push("NIK Wali sudah terdaftar di database (di-skip)");
      }

      const hasError = errorMessages.length > 0;

      const namaWaliErr = isNamaWaliEmpty ? "Nama Wali wajib diisi" : null;
      const nikWaliErr = isNikWaliEmpty
        ? "NIK Wali wajib diisi"
        : isDuplicateInternal
        ? "Duplikat di berkas (1 data sudah masuk Tabel Valid, baris ini di-skip)"
        : isDuplicateDb
        ? "NIK Wali sudah terdaftar di database (di-skip)"
        : null;
      const noHpWaliErr = isNoHpWaliEmpty ? "No HP Wali wajib diisi" : null;
      const alamatErr = isAlamatEmpty ? "Alamat wajib diisi" : null;
      const statusErr = isStatusInvalid ? "Status harus Hidup atau Wafat" : null;

      return {
        ...row,
        index,
        hasError,
        isNamaWaliEmpty,
        isNikWaliEmpty,
        isNoHpWaliEmpty,
        isAlamatEmpty,
        isDuplicateNikWali,
        isDuplicateInternal,
        isDuplicateDb,
        namaWaliErr,
        nikWaliErr,
        noHpWaliErr,
        alamatErr,
        statusErr,
        duplicateReason: errorMessages.join(", "),
      };
    });
  }, [importData, dataWali, isLoading]);

  const duplicateRows = useMemo(() => previewRows.filter((r: any) => r.isDuplicateNikWali), [previewRows]);
  const otherInvalidRows = useMemo(() => previewRows.filter((r: any) => r.hasError && !r.isDuplicateNikWali), [previewRows]);
  const invalidRows = useMemo(() => previewRows.filter((r: any) => r.hasError), [previewRows]);
  const validRows = useMemo(() => previewRows.filter((r: any) => !r.hasError), [previewRows]);

  const hasFatalError = previewRows.some((r: any) => r.hasError);

  useEffect(() => {
    if (!isLoading) {
      if (validRows.length === 0 && previewRows.length > 0) {
        toast.error("Semua data dalam file tidak valid/bermasalah. Tidak ada data yang dapat diimpor.");
      } else if (hasFatalError) {
        toast.warning(
          `Terdeteksi ${invalidRows.length} data bermasalah (${duplicateRows.length} duplikat, ${otherInvalidRows.length} tidak lengkap) yang akan di-skip. ${validRows.length} data valid siap diimpor.`
        );
      }
    }
  }, [isLoading, hasFatalError, invalidRows.length, duplicateRows.length, otherInvalidRows.length, validRows.length, previewRows.length]);

  if (!importData || importData.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 mb-4">Tidak ada data untuk di-preview.</p>
        <Button onClick={() => navigate("/master-data/wali-murid")}>Kembali</Button>
      </div>
    );
  }

  const renderTableRows = (rows: typeof previewRows) => {
    const isValidValue = (val: any): boolean => {
      if (val === undefined || val === null) return false;
      const str = String(val).trim().toLowerCase();
      return str !== "" && str !== "-" && str !== "—" && str !== "null" && str !== "undefined";
    };

    return rows.map((row: any) => (
      <tr
        key={row.index}
        className={`hover:bg-slate-50 transition-colors ${
          row.hasError ? "bg-red-50/40" : ""
        }`}
      >
        <td className="px-4 py-3 font-medium text-slate-900">{row.index + 1}</td>

        {/* Nama Wali */}
        <td className="px-4 py-3 font-medium text-slate-900" title={row.namaWaliErr || ""}>
          {row.namaWaliErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.isNamaWaliEmpty ? "Nama Wali Kosong" : row.nama_wali}
            </span>
          ) : (
            row.nama_wali || "—"
          )}
        </td>

        {/* NIK Wali */}
        <td className="px-4 py-3 font-mono text-xs" title={row.nikWaliErr || ""}>
          {row.nikWaliErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.isNikWaliEmpty ? "NIK Wali Kosong" : row.nik_wali}
            </span>
          ) : (
            row.nik_wali || "—"
          )}
        </td>

        {/* No HP Wali */}
        <td className="px-4 py-3 font-mono text-xs" title={row.noHpWaliErr || ""}>
          {row.noHpWaliErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.isNoHpWaliEmpty ? "No HP Kosong" : row.no_hp_wali}
            </span>
          ) : (
            row.no_hp_wali || "—"
          )}
        </td>

        {/* Alamat */}
        <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate" title={row.alamatErr || row.alamat || ""}>
          {row.alamatErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              Alamat Kosong
            </span>
          ) : (
            row.alamat || "—"
          )}
        </td>

        {/* Status */}
        <td className="px-4 py-3 text-xs" title={row.statusErr || ""}>
          {row.statusErr ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">
              {row.status}
            </span>
          ) : (
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                row.status === "Wafat"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {row.status || "Hidup"}
            </span>
          )}
        </td>

        {/* Nama Ayah */}
        <td className="px-4 py-3 text-xs text-slate-600">
          {isValidValue(row.nama_ayah) ? row.nama_ayah : "—"}
        </td>

        {/* NIK Ayah */}
        <td className="px-4 py-3 text-xs font-mono text-slate-600">
          {isValidValue(row.nik_ayah) ? row.nik_ayah : "—"}
        </td>

        {/* No HP Ayah */}
        <td className="px-4 py-3 text-xs font-mono text-slate-600">
          {isValidValue(row.no_hp_ayah) ? row.no_hp_ayah : "—"}
        </td>

        {/* Status Ayah */}
        <td className="px-4 py-3 text-xs text-slate-600">
          {isValidValue(row.status_ayah) ? row.status_ayah : "Hidup"}
        </td>

        {/* Pekerjaan Ayah */}
        <td className="px-4 py-3 text-xs text-slate-600">
          {isValidValue(row.pekerjaan_ayah) ? row.pekerjaan_ayah : "—"}
        </td>

        {/* Penghasilan Ayah */}
        <td className="px-4 py-3 text-xs text-slate-600">
          {isValidValue(row.penghasilan_ayah) ? row.penghasilan_ayah : "—"}
        </td>

        {/* Pendidikan Ayah */}
        <td className="px-4 py-3 text-xs text-slate-600">
          {isValidValue(row.pendidikan_ayah) ? row.pendidikan_ayah : "—"}
        </td>

        {/* Nama Ibu */}
        <td className="px-4 py-3 text-xs text-slate-600">
          {isValidValue(row.nama_ibu) ? row.nama_ibu : "—"}
        </td>

        {/* NIK Ibu */}
        <td className="px-4 py-3 text-xs font-mono text-slate-600">
          {isValidValue(row.nik_ibu) ? row.nik_ibu : "—"}
        </td>

        {/* No HP Ibu */}
        <td className="px-4 py-3 text-xs font-mono text-slate-600">
          {isValidValue(row.no_hp_ibu) ? row.no_hp_ibu : "—"}
        </td>

        {/* Status Ibu */}
        <td className="px-4 py-3 text-xs text-slate-600">
          {isValidValue(row.status_ibu) ? row.status_ibu : "Hidup"}
        </td>

        {/* Pekerjaan Ibu */}
        <td className="px-4 py-3 text-xs text-slate-600">
          {isValidValue(row.pekerjaan_ibu) ? row.pekerjaan_ibu : "—"}
        </td>

        {/* Penghasilan Ibu */}
        <td className="px-4 py-3 text-xs text-slate-600">
          {isValidValue(row.penghasilan_ibu) ? row.penghasilan_ibu : "—"}
        </td>

        {/* Pendidikan Ibu */}
        <td className="px-4 py-3 text-xs text-slate-600">
          {isValidValue(row.pendidikan_ibu) ? row.pendidikan_ibu : "—"}
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
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Nama Wali</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">NIK Wali</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">No HP Wali</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Alamat</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Status</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Nama Ayah</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">NIK Ayah</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">No HP Ayah</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Status Ayah</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Pekerjaan Ayah</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Penghasilan Ayah</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Pendidikan Ayah</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Nama Ibu</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">NIK Ibu</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">No HP Ibu</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Status Ibu</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Pekerjaan Ibu</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Penghasilan Ibu</th>
        <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Pendidikan Ibu</th>
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
        description: `Sebanyak ${invalidRows.length} data tidak valid (${duplicateRows.length} duplikat, ${otherInvalidRows.length} tidak lengkap) akan dilewati dan tidak diunggah. Memproses ${validRows.length} data valid...`,
        duration: 5000,
      });
    }

    const isValidValue = (val: any): boolean => {
      if (val === undefined || val === null) return false;
      const str = String(val).trim().toLowerCase();
      return str !== "" && str !== "-" && str !== "—" && str !== "null" && str !== "undefined";
    };

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
      setImportStats((prev) => (prev ? { ...prev, current } : null));

      const nikWali = String(row.nik_wali).trim();
      const email = `${nikWali}@mlms.local`;
      let userId: string | undefined;

      try {
        // 1. Buat user auth
        try {
          const createdUser = await createUserAuth({
            email,
            password: "password123",
            username: nikWali,
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
                params: { username: `eq.${nikWali}`, select: "user_id" },
              });
              userId = resUser.data?.[0]?.user_id || undefined;
            } catch (e) {
              console.warn(`Gagal mengambil existing user_id untuk ${nikWali}:`, e);
            }
          } else {
            throw authErr;
          }
        }

        // 2. Buat data wali murid
        const payload: any = {
          nama_wali: String(row.nama_wali).trim(),
          nik_wali: nikWali,
          no_hp_wali: String(row.no_hp_wali).trim(),
          alamat: String(row.alamat).trim(),
          status: row.status || "Hidup",
          nama_ayah: isValidValue(row.nama_ayah) ? String(row.nama_ayah).trim() : null,
          nik_ayah: isValidValue(row.nik_ayah) ? String(row.nik_ayah).trim() : null,
          no_hp_ayah: isValidValue(row.no_hp_ayah) ? String(row.no_hp_ayah).trim() : null,
          status_ayah: row.status_ayah || "Hidup",
          pekerjaan_ayah: isValidValue(row.pekerjaan_ayah) ? String(row.pekerjaan_ayah).trim() : null,
          penghasilan_ayah: isValidValue(row.penghasilan_ayah) ? String(row.penghasilan_ayah).trim() : null,
          pendidikan_ayah: isValidValue(row.pendidikan_ayah) ? String(row.pendidikan_ayah).trim() : null,
          nama_ibu: isValidValue(row.nama_ibu) ? String(row.nama_ibu).trim() : null,
          nik_ibu: isValidValue(row.nik_ibu) ? String(row.nik_ibu).trim() : null,
          no_hp_ibu: isValidValue(row.no_hp_ibu) ? String(row.no_hp_ibu).trim() : null,
          status_ibu: row.status_ibu || "Hidup",
          pekerjaan_ibu: isValidValue(row.pekerjaan_ibu) ? String(row.pekerjaan_ibu).trim() : null,
          penghasilan_ibu: isValidValue(row.penghasilan_ibu) ? String(row.penghasilan_ibu).trim() : null,
          pendidikan_ibu: isValidValue(row.pendidikan_ibu) ? String(row.pendidikan_ibu).trim() : null,
        };

        if (userId) {
          payload.user_id = userId;
        }

        await restClient.post("/wali_murid", payload, {
          headers: { Prefer: "return=representation" },
        });

        berhasil++;
      } catch (err: any) {
        gagal++;
        const resData = err?.response?.data;
        const msg = resData?.message || resData?.error || resData?.msg || err?.message || "Error tidak diketahui";
        gagalDetail.push(
          `Baris ${row.index + 1} (${row.nik_wali}): ${msg}`
        );
      }

      setImportStats((prev) => (prev ? { ...prev, success: berhasil, failed: gagal } : null));
      setProgress(Math.round((current / total) * 100));
    }

    setIsSubmitting(false);

    if (gagal === 0) {
      if (invalidRows.length > 0) {
        toast.success(`Berhasil mengimpor ${berhasil} data wali murid (${invalidRows.length} data tidak valid dilewati).`);
      } else {
        toast.success(`Berhasil mengimpor ${berhasil} data wali murid beserta akun login-nya.`);
      }
      queryClient.invalidateQueries({ queryKey: ["master-data", "wali-murid"] });
      navigate("/master-data/wali-murid");
    } else if (berhasil > 0) {
      toast.warning(
        `${berhasil} wali murid berhasil diimpor, ${gagal} gagal (${invalidRows.length} data tidak valid dilewati). Cek console untuk detail.`
      );
      console.warn("Detail gagal import:", gagalDetail);
      queryClient.invalidateQueries({ queryKey: ["master-data", "wali-murid"] });
      navigate("/master-data/wali-murid");
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
              onClick={() => navigate("/master-data/wali-murid")}
            />
            Preview Import Wali Murid
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-8">
            Periksa kembali data wali murid sebelum disimpan ke database
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/master-data/wali-murid")}
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
                  : `Tambahkan Semua (${validRows.length} Wali Murid)`}
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
            Setiap wali murid yang diimpor akan mendapatkan akun login dengan{" "}
            <strong>NIK Wali</strong> dan <strong>password default = password123</strong>.
            Akun ini dapat digunakan untuk masuk ke portal wali murid setelah import selesai.
          </p>
        </div>
      </div>

      {/* Warning Box jika ada error */}
      {hasFatalError && !isSubmitting && (
        <div className="bg-white text-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500 flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">
              Perhatian: Terdapat {invalidRows.length} Data Bermasalah (Akan Di-skip)
            </p>
            <p className="text-xs mt-1">
              Sistem mendeteksi {duplicateRows.length > 0 ? `${duplicateRows.length} data duplikat/kembar` : ""}
              {duplicateRows.length > 0 && otherInvalidRows.length > 0 ? " dan " : ""}
              {otherInvalidRows.length > 0 ? `${otherInvalidRows.length} data tidak lengkap/format tidak sesuai` : ""}.
              Seluruh data bermasalah tersebut akan <strong>otomatis dilewati (di-skip)</strong> dan tidak diunggah. Hanya <strong>{validRows.length} data valid</strong> yang akan disimpan ke database.
            </p>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {!hasFatalError && !isLoading && (
        <div className="bg-white text-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500 flex items-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
          <p className="text-sm font-medium">
            Semua data valid dan siap ditambahkan ke database ({validRows.length} wali murid).
          </p>
        </div>
      )}

      {/* ──────────────── TABEL 1: DATA DUPLIKAT / GANDA ──────────────── */}
      <Card className="border-amber-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-amber-50 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="font-bold text-amber-900 text-sm uppercase tracking-wide">
                1. Data Duplikat / Ganda ({duplicateRows.length} Wali Murid)
              </h2>
              <p className="text-xs text-amber-700">Data ganda di file hanya diunggah 1 kali (kemunculan pertama), baris duplikat sisanya otomatis dilewati (di-skip).</p>
            </div>
          </div>
          {duplicateRows.length > 0 ? (
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-300 animate-pulse">
              Akan Di-skip ({duplicateRows.length} Duplikat)
            </span>
          ) : (
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-300">
              Bersih (0 Duplikat)
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
                    <td colSpan={21} className="text-center py-12 text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Sedang memvalidasi data...
                    </td>
                  </tr>
                ) : duplicateRows.length === 0 ? (
                  <tr>
                    <td colSpan={21} className="text-center py-6 text-emerald-600 bg-emerald-50/30">
                      <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                      <span className="font-semibold text-xs">Tidak ada data duplikat/ganda. Semua NIK Wali unik!</span>
                    </td>
                  </tr>
                ) : (
                  renderTableRows(duplicateRows)
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ──────────────── TABEL 2: DATA TIDAK LENGKAP / INVALID FORMAT ──────────────── */}
      <Card className="border-red-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h2 className="font-bold text-red-900 text-sm uppercase tracking-wide">
                2. Data Tidak Lengkap / Format Salah ({otherInvalidRows.length} Wali Murid)
              </h2>
              <p className="text-xs text-red-700">Data dengan kolom wajib kosong (Nama, NIK, No HP, Alamat) atau status salah</p>
            </div>
          </div>
          {otherInvalidRows.length > 0 ? (
            <span className="text-xs font-bold px-2.5 py-1 bg-red-100 text-red-700 rounded-full border border-red-300">
              Akan Di-skip ({otherInvalidRows.length} Data)
            </span>
          ) : (
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-300">
              Bersih (0 Tidak Lengkap)
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
                    <td colSpan={21} className="text-center py-12 text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Sedang memvalidasi data...
                    </td>
                  </tr>
                ) : otherInvalidRows.length === 0 ? (
                  <tr>
                    <td colSpan={21} className="text-center py-6 text-emerald-600 bg-emerald-50/30">
                      <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                      <span className="font-semibold text-xs">
                        Tidak ada data dengan kolom kosong atau format salah!
                      </span>
                    </td>
                  </tr>
                ) : (
                  renderTableRows(otherInvalidRows)
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ──────────────── TABEL 3: DATA VALID ──────────────── */}
      <Card className="border-emerald-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-50 border-b border-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="font-bold text-emerald-900 text-sm uppercase tracking-wide">
                3. Data Valid ({validRows.length} Wali Murid)
              </h2>
              <p className="text-xs text-emerald-700">Data yang memenuhi seluruh validasi dan siap diunggah ke sistem</p>
            </div>
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
                    <td colSpan={21} className="text-center py-12 text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Sedang memvalidasi data...
                    </td>
                  </tr>
                ) : validRows.length === 0 ? (
                  <tr>
                    <td colSpan={21} className="text-center py-8 text-slate-500 bg-slate-50/50">
                      <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-amber-500" />
                      <span className="font-semibold text-sm">
                        Tidak ada data valid yang dapat diimpor. Silakan periksa data bermasalah di atas.
                      </span>
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
