import React, { useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { PegawaiUI } from "./usePegawaiData";
import { restClient } from "../../../../lib/api/axios";
import { sanitizePostgrestSearch } from "@/lib/utils";

export interface PegawaiExportFilter {
  searchQuery: string;
  filterStatus: string;
  filterRole: string;
  filterLembagaId: number | null;
  sortOrder: string;
  isGlobalRole: boolean;
  userLembagaId: number | null;
}

export function usePegawaiExportImport() {
  const navigate = useNavigate();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isTemplateInfoOpen, setIsTemplateInfoOpen] = useState(false);

  // ──────────────── Export Handler ────────────────
  const handleExport = async (filteredDataOrParams: PegawaiUI[] | PegawaiExportFilter) => {
    // If PegawaiExportFilter (has searchQuery key), do full fetch
    if ('searchQuery' in filteredDataOrParams) {
      const { searchQuery, filterStatus, filterRole, filterLembagaId, sortOrder, isGlobalRole, userLembagaId } = filteredDataOrParams;
      try {
        setIsExporting(true);
        let selectQuery = '*, pegawai_lembaga(lembaga_id, lembaga(singkatan))';
        const params: any = { order: `nama.${sortOrder}` };
        if (!isGlobalRole && userLembagaId) {
          selectQuery = '*, pegawai_lembaga!inner(lembaga_id, lembaga(singkatan))';
          params['pegawai_lembaga.lembaga_id'] = `eq.${userLembagaId}`;
        } else if (filterLembagaId) {
          selectQuery = '*, pegawai_lembaga!inner(lembaga_id, lembaga(singkatan))';
          params['pegawai_lembaga.lembaga_id'] = `eq.${filterLembagaId}`;
        }
        params.select = selectQuery;
        if (filterRole !== "Semua Role") {
          const roleResponse = await restClient.get('/user_role', {
            params: { select: 'user_id,role!inner(nama_role)', 'role.nama_role': `eq.${filterRole}` }
          });
          const userIds = (roleResponse.data || []).map((ur: any) => ur.user_id).filter(Boolean);
          if (userIds.length === 0) { toast.error("Tidak ada data untuk diekspor"); return; }
          params.user_id = `in.(${userIds.join(',')})`;
        }
        if (filterStatus !== "Semua Status") {
          params.status = `eq.${filterStatus}`;
        }
        if (searchQuery.trim()) {
          const cleanQuery = sanitizePostgrestSearch(searchQuery);
          if (cleanQuery) params.or = `(nama.ilike.*${cleanQuery}*,nig.ilike.*${cleanQuery}*,nip.ilike.*${cleanQuery}*)`;
        }
        const response = await restClient.get('/pegawai', { params });
        const allData: any[] = response.data || [];
        if (allData.length === 0) { toast.error("Tidak ada data untuk diekspor"); return; }
        const exportData = allData.map((p) => ({
          nig: p.nig || "", nip: p.nip || "", nik: p.nik || "",
          nama: p.nama || "", jenis_kelamin: p.jenis_kelamin || "L",
          tempat_lahir: p.tempat_lahir || "", tanggal_lahir: p.tanggal_lahir || "",
          alamat: p.alamat || "", no_hp: p.no_hp || "", status: p.status || "Aktif",
          jabatan: p.jabatan || "", tugas_tambahan: p.tugas_tambahan || "",
          jumlah_anak_laki: p.jumlah_anak_laki ?? "", jumlah_anak_perempuan: p.jumlah_anak_perempuan ?? "",
          nama_ayah: p.nama_ayah || "", nama_ibu: p.nama_ibu || "", golongan_darah: p.golongan_darah || "",
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Pegawai");
        XLSX.writeFile(wb, "Data_Pegawai.xlsx");
        toast.success(`Berhasil mengekspor ${exportData.length} data pegawai.`);
      } catch {
        toast.error("Gagal mengekspor data pegawai.");
      } finally {
        setIsExporting(false);
      }
      return;
    }
    // Fallback: use passed filteredData array
    const filteredData = filteredDataOrParams as PegawaiUI[];
    if (filteredData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const exportData = filteredData.map((p) => ({
      nig: p.raw.nig || "",
      nip: p.raw.nip || "",
      nik: p.raw.nik || "",
      nama: p.raw.nama || "",
      jenis_kelamin: p.raw.jenis_kelamin || "L",
      tempat_lahir: p.raw.tempat_lahir || "",
      tanggal_lahir: p.raw.tanggal_lahir || "",
      alamat: p.raw.alamat || "",
      no_hp: p.raw.no_hp || "",
      status: p.raw.status || "Aktif",
      jabatan: p.raw.jabatan || "",
      tugas_tambahan: p.raw.tugas_tambahan || "",
      jumlah_anak_laki: p.raw.jumlah_anak_laki !== null && p.raw.jumlah_anak_laki !== undefined ? p.raw.jumlah_anak_laki : "",
      jumlah_anak_perempuan: p.raw.jumlah_anak_perempuan !== null && p.raw.jumlah_anak_perempuan !== undefined ? p.raw.jumlah_anak_perempuan : "",
      nama_ayah: p.raw.nama_ayah || "",
      nama_ibu: p.raw.nama_ibu || "",
      golongan_darah: p.raw.golongan_darah || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Pegawai");
    XLSX.writeFile(wb, "Data_Pegawai.xlsx");
    toast.success(`Berhasil mengekspor ${exportData.length} data pegawai.`);
  };


  // ──────────────── Download Template ────────────────
  const handleDownloadTemplate = () => {
    const templateData = [{
      nig: "P001",
      nip: "",
      nik: "",
      nama: "Ahmad Fauzi",
      jenis_kelamin: "L",
      tempat_lahir: "Gresik",
      tanggal_lahir: "1990-08-17",
      alamat: "",
      no_hp: "",
      status: "Aktif",
      jabatan: "Guru",
      tugas_tambahan: "",
      jumlah_anak_laki: 1,
      jumlah_anak_perempuan: 1,
      nama_ayah: "Suryono",
      nama_ibu: "Siti Aminah",
      golongan_darah: "O+",
      lembaga: "Opsional - Isi nama atau singkatan lembaga (contoh: SD IT atau SD ISLAM TERPADU). Kosongkan jika belum diketahui.",
    }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Pegawai");
    XLSX.writeFile(wb, "Template_Import_Pegawai.xlsx");
  };

  // ──────────────── Import Handler ────────────────
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>, fileInputRef: React.RefObject<HTMLInputElement | null>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target?.result as ArrayBuffer;
        const wb = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        if (data.length === 0) {
          toast.error("File Excel kosong.");
          setIsImporting(false);
          return;
        }

        const findValue = (row: Record<string, any>, possibleKeys: string[]): any => {
          if (!row || typeof row !== "object") return undefined;
          for (const k of possibleKeys) {
            if (row[k] !== undefined && row[k] !== null && row[k] !== "") return row[k];
          }
          const norm = (s: string) => s.toLowerCase().replace(/[\s_\-\.\/]+/g, "");
          const targetNorms = possibleKeys.map(norm);
          for (const rKey of Object.keys(row)) {
            if (targetNorms.includes(norm(rKey))) {
              if (row[rKey] !== undefined && row[rKey] !== null && row[rKey] !== "") return row[rKey];
            }
          }
          for (const k of possibleKeys) {
            if (k in row) return row[k];
          }
          for (const rKey of Object.keys(row)) {
            if (targetNorms.includes(norm(rKey))) return row[rKey];
          }
          return undefined;
        };

        const parseTanggalLahir = (val: any): string => {
          if (val === undefined || val === null || val === "") return "";
          if (val instanceof Date || Object.prototype.toString.call(val) === "[object Date]") {
            if (isNaN(val.getTime())) return "";
            const y = val.getUTCFullYear();
            const m = String(val.getUTCMonth() + 1).padStart(2, "0");
            const d = String(val.getUTCDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
          }
          if (typeof val === "number") {
            if (isNaN(val)) return "";
            const date = new Date(Math.round((val - 25569) * 86400 * 1000));
            if (isNaN(date.getTime())) return "";
            const y = date.getUTCFullYear();
            const m = String(date.getUTCMonth() + 1).padStart(2, "0");
            const d = String(date.getUTCDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
          }
          let str = String(val).trim();
          if (!str || str === "-" || str === "—") return "";

          if (/^\d{5}(\.\d+)?$/.test(str)) {
            const numVal = Number(str);
            if (numVal > 10000 && numVal < 100000) {
              const date = new Date(Math.round((numVal - 25569) * 86400 * 1000));
              if (!isNaN(date.getTime())) {
                const y = date.getUTCFullYear();
                const m = String(date.getUTCMonth() + 1).padStart(2, "0");
                const d = String(date.getUTCDate()).padStart(2, "0");
                return `${y}-${m}-${d}`;
              }
            }
          }

          if (str.includes("T")) {
            str = str.split("T")[0];
          }

          const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
          if (ymdMatch) {
            const [, y, m, d] = ymdMatch;
            return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
          }

          const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
          if (dmyMatch) {
            const [, d, m, y] = dmyMatch;
            return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
          }

          const parsed = Date.parse(str);
          if (!isNaN(parsed)) {
            const date = new Date(parsed);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, "0");
            const d = String(date.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
          }

          return str;
        };

        const payloads = data.map((row: any) => {
          const rawJk = findValue(row, ["jenis_kelamin", "jenis kelamin", "jk", "l/p"]);
          let jk = String(rawJk || "").trim().toUpperCase();
          if (jk === "LAKI-LAKI" || jk === "LAKI" || jk === "L") jk = "L";
          else if (jk === "PEREMPUAN" || jk === "P" || jk === "WANITA") jk = "P";
          else jk = String(rawJk || "");

          const rawNig = findValue(row, ["nig"]);
          const rawNip = findValue(row, ["nip"]);
          const rawNik = findValue(row, ["nik"]);
          const rawNama = findValue(row, ["nama", "nama_pegawai", "nama pegawai"]);
          const rawTempatLahir = findValue(row, ["tempat_lahir", "tempat lahir", "tpt_lahir", "tempat"]);
          const rawTanggalLahir = findValue(row, ["tanggal_lahir", "tanggal lahir", "tgl_lahir", "tgl lahir", "tanggal"]);
          const rawAlamat = findValue(row, ["alamat"]);
          const rawNoHp = findValue(row, ["no_hp", "no hp", "nohp", "hp", "telepon"]);
          const rawStatus = findValue(row, ["status"]);
          const rawJabatan = findValue(row, ["jabatan"]);
          const rawTugasTambahan = findValue(row, ["tugas_tambahan", "tugas tambahan"]);
          const rawJmlAnakLaki = findValue(row, ["jumlah_anak_laki", "jumlah anak laki", "anak_laki"]);
          const rawJmlAnakPerempuan = findValue(row, ["jumlah_anak_perempuan", "jumlah anak perempuan", "anak_perempuan"]);
          const rawNamaAyah = findValue(row, ["nama_ayah", "nama ayah"]);
          const rawNamaIbu = findValue(row, ["nama_ibu", "nama ibu"]);
          const rawGolDarah = findValue(row, ["golongan_darah", "golongan darah", "gol_darah"]);
          const rawLembaga = findValue(row, ["lembaga", "nama_lembaga", "singkatan"]);

          return {
            nig: rawNig !== undefined && rawNig !== null ? String(rawNig).trim() : "",
            nip: rawNip !== undefined && rawNip !== null ? String(rawNip).trim() : "",
            nik: rawNik !== undefined && rawNik !== null ? String(rawNik).trim() : "",
            nama: rawNama !== undefined && rawNama !== null ? String(rawNama).trim() : "",
            jenis_kelamin: jk as "L" | "P",
            tempat_lahir: rawTempatLahir !== undefined && rawTempatLahir !== null ? String(rawTempatLahir).trim() : "",
            tanggal_lahir: parseTanggalLahir(rawTanggalLahir),
            alamat: rawAlamat !== undefined && rawAlamat !== null ? String(rawAlamat).trim() : "",
            no_hp: rawNoHp !== undefined && rawNoHp !== null ? String(rawNoHp).trim() : "",
            status: (String(rawStatus).trim() === "Tidak Aktif" ? "Tidak Aktif" : "Aktif") as "Aktif" | "Tidak Aktif",
            jabatan: rawJabatan !== undefined && rawJabatan !== null ? String(rawJabatan).trim() : "",
            tugas_tambahan: rawTugasTambahan !== undefined && rawTugasTambahan !== null ? String(rawTugasTambahan).trim() : "",
            jumlah_anak_laki: rawJmlAnakLaki !== undefined && rawJmlAnakLaki !== null && rawJmlAnakLaki !== "" && !isNaN(Number(rawJmlAnakLaki)) ? Number(rawJmlAnakLaki) : null,
            jumlah_anak_perempuan: rawJmlAnakPerempuan !== undefined && rawJmlAnakPerempuan !== null && rawJmlAnakPerempuan !== "" && !isNaN(Number(rawJmlAnakPerempuan)) ? Number(rawJmlAnakPerempuan) : null,
            nama_ayah: rawNamaAyah !== undefined && rawNamaAyah !== null ? String(rawNamaAyah).trim() : "",
            nama_ibu: rawNamaIbu !== undefined && rawNamaIbu !== null ? String(rawNamaIbu).trim() : "",
            golongan_darah: rawGolDarah !== undefined && rawGolDarah !== null ? String(rawGolDarah).trim() : "",
            lembaga: rawLembaga !== undefined && rawLembaga !== null ? String(rawLembaga).trim() : "",
          };
        }).filter((p: any) => p.nig || p.nama);

        if (payloads.length === 0) {
          toast.error("File Excel kosong atau tidak berisi data.");
          setIsImporting(false);
          return;
        }

        navigate("/master-data/pegawai/import", { state: { importData: payloads } });
      } catch (error: any) {
        toast.error("Gagal mengimpor data. Pastikan format file Excel sudah sesuai template.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return {
    isImporting,
    isExporting,
    isTemplateInfoOpen,
    setIsTemplateInfoOpen,
    handleExport,
    handleDownloadTemplate,
    handleImport
  };
}
