import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { SiswaUI } from "./useSiswaData";
import { useState } from "react";
import React from "react";
import { restClient } from "../../../../lib/api/axios";
import { sanitizePostgrestSearch } from "@/lib/utils";

export interface SiswaExportFilter {
  searchQuery: string;
  filterLembagaId: number | null;
  filterKelasId: number | null;
  sortOrder: string;
  authRole: string | null;
  authLembagaId: number | null;
  waliKelasId: number | null;
}

export function useSiswaExportImport(filteredData: SiswaUI[], setIsImporting: (v: boolean) => void, fileInputRef: React.RefObject<HTMLInputElement | null>) {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (filterParams?: SiswaExportFilter) => {
    // If filter params provided, fetch all filtered data from server
    if (filterParams) {
      try {
        setIsExporting(true);
        const { searchQuery, filterLembagaId, filterKelasId, sortOrder, authRole, authLembagaId, waliKelasId } = filterParams;
        const isGlobalRole = authRole === 'Super Admin' || authRole === 'Direktur';
        const selectQuery = `*,kelas:kelas_id(nama_kelas,lembaga_id,lembaga(nama_lembaga,singkatan)),wali_murid:wali_murid_id(nama_ayah,status_ayah,nama_ibu,status_ibu,nama_wali)`;
        const params: any = {
          select: selectQuery,
          order: `nama.${sortOrder}`
        };
        if (authRole === 'Wali Kelas' && waliKelasId) {
          params.kelas_id = `eq.${waliKelasId}`;
        } else if (!isGlobalRole && authLembagaId) {
          params.select = `*,kelas:kelas_id!inner(nama_kelas,lembaga_id,lembaga(nama_lembaga,singkatan)),wali_murid:wali_murid_id(nama_ayah,status_ayah,nama_ibu,status_ibu,nama_wali)`;
          params['kelas.lembaga_id'] = `eq.${authLembagaId}`;
        }
        if (filterKelasId) {
          params.kelas_id = `eq.${filterKelasId}`;
        } else if (filterLembagaId) {
          params.select = `*,kelas:kelas_id!inner(nama_kelas,lembaga_id,lembaga(nama_lembaga,singkatan)),wali_murid:wali_murid_id(nama_ayah,status_ayah,nama_ibu,status_ibu,nama_wali)`;
          params['kelas.lembaga_id'] = `eq.${filterLembagaId}`;
        }
        if (searchQuery.trim()) {
          const cleanQuery = sanitizePostgrestSearch(searchQuery);
          if (cleanQuery) {
            params.or = `(nama.ilike.*${cleanQuery}*,nis.ilike.*${cleanQuery}*,nisn.ilike.*${cleanQuery}*)`;
          }
        }
        const response = await restClient.get('/siswa', { params });
        const allData: any[] = response.data || [];
        if (allData.length === 0) {
          toast.error("Tidak ada data untuk diekspor");
          return;
        }
        const exportData = allData.map((s) => ({
          nis: s.nis || "",
          nisn: s.nisn || "",
          nik: s.nik || "",
          no_kk: s.no_kk || "",
          no_akta_kelahiran: s.no_akta_kelahiran || "",
          pin: s.pin || "",
          nama: s.nama || "",
          panggilan: s.panggilan || "",
          jenis_kelamin: s.jenis_kelamin || "L",
          tempat_lahir: s.tempat_lahir || "",
          tanggal_lahir: s.tanggal_lahir || "",
          agama: s.agama || "Islam",
          kewarganegaraan: s.kewarganegaraan || "WNI",
          tahun_masuk: s.tahun_masuk || new Date().getFullYear(),
          asal_sekolah: s.asal_sekolah || "",
          alamat_sekolah_asal: s.alamat_sekolah_asal || "",
          no_un_sebelumnya: s.no_un_sebelumnya || "",
          alamat: s.alamat || "",
          rt: s.rt || "",
          rw: s.rw || "",
          desa_kelurahan: s.desa_kelurahan || "",
          kecamatan: s.kecamatan || "",
          kabupaten_kota: s.kabupaten_kota || "",
          provinsi: s.provinsi || "",
          kode_pos: s.kode_pos || "",
          status: s.status || "Aktif",
          keterangan_asrama: s.keterangan_asrama || "Tidak",
          kelas: s.kelas?.nama_kelas || "",
          wali_murid: s.wali_murid?.nama_wali || s.wali_murid?.nama_ayah || s.wali_murid?.nama_ibu || "",
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        // Force tanggal_lahir column to be treated as text by setting raw cell type to string
        const tglLahirColIdx = Object.keys(exportData[0] || {}).indexOf("tanggal_lahir");
        if (tglLahirColIdx >= 0) {
          const colLetter = XLSX.utils.encode_col(tglLahirColIdx);
          exportData.forEach((_, rowIdx) => {
            const cellAddr = `${colLetter}${rowIdx + 2}`; // +2: 1 for header, 1 for 1-based index
            if (ws[cellAddr]) {
              ws[cellAddr].t = "s"; // force string type
              ws[cellAddr].z = "@"; // text number format
            }
          });
        }
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
        XLSX.writeFile(wb, "Data_Siswa.xlsx");
        toast.success(`Berhasil mengekspor ${exportData.length} data siswa.`);
      } catch {
        toast.error("Gagal mengekspor data siswa.");
      } finally {
        setIsExporting(false);
      }
      return;
    }
    // Fallback: use currently loaded data (current page only)
    if (filteredData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const exportData = filteredData.map((s) => ({
      nis: s.raw.nis || "",
      nisn: s.raw.nisn || "",
      nik: s.raw.nik || "",
      no_kk: s.raw.no_kk || "",
      no_akta_kelahiran: s.raw.no_akta_kelahiran || "",
      pin: s.raw.pin || "",
      nama: s.raw.nama || "",
      panggilan: s.raw.panggilan || "",
      jenis_kelamin: s.raw.jenis_kelamin || "L",
      tempat_lahir: s.raw.tempat_lahir || "",
      tanggal_lahir: s.raw.tanggal_lahir || "",
      agama: s.raw.agama || "Islam",
      kewarganegaraan: s.raw.kewarganegaraan || "WNI",
      tahun_masuk: s.raw.tahun_masuk || new Date().getFullYear(),
      asal_sekolah: s.raw.asal_sekolah || "",
      alamat_sekolah_asal: s.raw.alamat_sekolah_asal || "",
      no_un_sebelumnya: s.raw.no_un_sebelumnya || "",
      alamat: s.raw.alamat || "",
      rt: s.raw.rt || "",
      rw: s.raw.rw || "",
      desa_kelurahan: s.raw.desa_kelurahan || "",
      kecamatan: s.raw.kecamatan || "",
      kabupaten_kota: s.raw.kabupaten_kota || "",
      provinsi: s.raw.provinsi || "",
      kode_pos: s.raw.kode_pos || "",
      status: s.raw.status || "Aktif",
      keterangan_asrama: s.raw.keterangan_asrama || "Tidak",
      // Gunakan nama kelas (bukan kelas_id) agar kompatibel dengan template impor
      kelas: s.raw.kelas?.nama_kelas || "",
      // Gunakan nama wali utama (bukan wali_murid_id) agar kompatibel dengan template impor
      wali_murid: s.raw.wali_murid?.nama_wali ||
                  s.raw.wali_murid?.nama_ayah ||
                  s.raw.wali_murid?.nama_ibu ||
                  "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    // Force tanggal_lahir column to be treated as text
    const tglLahirColIdx2 = Object.keys(exportData[0] || {}).indexOf("tanggal_lahir");
    if (tglLahirColIdx2 >= 0) {
      const colLetter2 = XLSX.utils.encode_col(tglLahirColIdx2);
      exportData.forEach((_, rowIdx) => {
        const cellAddr = `${colLetter2}${rowIdx + 2}`;
        if (ws[cellAddr]) {
          ws[cellAddr].t = "s";
          ws[cellAddr].z = "@";
        }
      });
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
    XLSX.writeFile(wb, "Data_Siswa.xlsx");
    toast.success(`Berhasil mengekspor ${exportData.length} data siswa.`);
  };

  const handleDownloadTemplate = () => {
    const templateData = [{
      nis: "",
      nisn: "",
      nik: "",
      no_kk: "",
      no_akta_kelahiran: "",
      pin: "",
      nama: "",
      panggilan: "",
      jenis_kelamin: "L/P",
      tempat_lahir: "",
      tanggal_lahir: "YYYY-MM-DD",
      agama: "Islam",
      kewarganegaraan: "WNI",
      tahun_masuk: new Date().getFullYear(),
      asal_sekolah: "",
      alamat_sekolah_asal: "",
      no_un_sebelumnya: "",
      alamat: "",
      rt: "",
      rw: "",
      desa_kelurahan: "",
      kecamatan: "",
      kabupaten_kota: "",
      provinsi: "",
      kode_pos: "",
      status: "Aktif",
      keterangan_asrama: "Tidak",
      kelas: "Opsional (Isi nama kelas yang valid, atau kosongkan / diisi '-' jika belum ada kelas)",
      wali_murid: "Opsional (Isi Nama Wali - Ayah/Ibu/Wali)"
    }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Siswa");
    XLSX.writeFile(wb, "Template_Import_Siswa.xlsx");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const data = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });

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

        const payloads: any[] = data.map((row: any) => {
          const rawJk = findValue(row, ["jenis_kelamin", "jenis kelamin", "jk", "l/p"]);
          let jk = String(rawJk || "").trim().toUpperCase();
          if (jk === "LAKI-LAKI" || jk === "LAKI" || jk === "L") {
            jk = "L";
          } else if (jk === "PEREMPUAN" || jk === "P" || jk === "WANITA") {
            jk = "P";
          } else {
            jk = String(rawJk || "");
          }

          const rawNis = findValue(row, ["nis"]);
          const rawNisn = findValue(row, ["nisn"]);
          const rawNik = findValue(row, ["nik"]);
          const rawNoKk = findValue(row, ["no_kk", "no kk", "nokk", "kk"]);
          const rawAkta = findValue(row, ["no_akta_kelahiran", "no akta kelahiran", "no_akta", "no akta", "akta"]);
          const rawPin = findValue(row, ["pin"]);
          const rawNama = findValue(row, ["nama", "nama_siswa", "nama siswa"]);
          const rawPanggilan = findValue(row, ["panggilan", "nama_panggilan", "nama panggilan"]);
          const rawTempatLahir = findValue(row, ["tempat_lahir", "tempat lahir", "tpt_lahir", "tempat"]);
          const rawTanggalLahir = findValue(row, ["tanggal_lahir", "tanggal lahir", "tgl_lahir", "tgl lahir", "tanggal"]);
          const rawAgama = findValue(row, ["agama"]);
          const rawKewarganegaraan = findValue(row, ["kewarganegaraan", "kewargaan"]);
          const rawTahunMasuk = findValue(row, ["tahun_masuk", "tahun masuk", "thn_masuk"]);
          const rawAsalSekolah = findValue(row, ["asal_sekolah", "asal sekolah", "sekolah_asal"]);
          const rawAlamatSekolahAsal = findValue(row, ["alamat_sekolah_asal", "alamat sekolah asal"]);
          const rawNoUn = findValue(row, ["no_un_sebelumnya", "no un sebelumnya", "no_un"]);
          const rawAlamat = findValue(row, ["alamat"]);
          const rawRt = findValue(row, ["rt"]);
          const rawRw = findValue(row, ["rw"]);
          const rawDesa = findValue(row, ["desa_kelurahan", "desa/kelurahan", "desa kelurahan", "desa", "kelurahan"]);
          const rawKecamatan = findValue(row, ["kecamatan"]);
          const rawKabupaten = findValue(row, ["kabupaten_kota", "kabupaten/kota", "kabupaten kota", "kabupaten", "kota"]);
          const rawProvinsi = findValue(row, ["provinsi"]);
          const rawKodePos = findValue(row, ["kode_pos", "kode pos"]);
          const rawStatus = findValue(row, ["status"]);
          const rawAsrama = findValue(row, ["keterangan_asrama", "keterangan asrama", "asrama"]);
          const rawKelas = findValue(row, ["kelas", "nama_kelas", "nama kelas"]);
          const rawWali = findValue(row, ["wali_murid", "wali murid", "nama_wali", "nama wali", "wali"]);

          return {
            nis: rawNis !== undefined && rawNis !== null ? String(rawNis).trim() : "",
            nisn: rawNisn !== undefined && rawNisn !== null && String(rawNisn).trim() !== "" ? String(rawNisn).trim() : null,
            nik: rawNik !== undefined && rawNik !== null ? String(rawNik).trim() : "",
            no_kk: rawNoKk !== undefined && rawNoKk !== null ? String(rawNoKk).trim() : "",
            no_akta_kelahiran: rawAkta !== undefined && rawAkta !== null ? String(rawAkta).trim() : "",
            pin: rawPin !== undefined && rawPin !== null ? String(rawPin).trim() : "",
            nama: rawNama !== undefined && rawNama !== null ? String(rawNama).trim() : "",
            panggilan: rawPanggilan !== undefined && rawPanggilan !== null ? String(rawPanggilan).trim() : "",
            jenis_kelamin: jk as any,
            tempat_lahir: rawTempatLahir !== undefined && rawTempatLahir !== null ? String(rawTempatLahir).trim() : "",
            tanggal_lahir: parseTanggalLahir(rawTanggalLahir),
            agama: rawAgama !== undefined && rawAgama !== null && String(rawAgama).trim() !== "" ? String(rawAgama).trim() : "Islam",
            kewarganegaraan: rawKewarganegaraan !== undefined && rawKewarganegaraan !== null && String(rawKewarganegaraan).trim() !== "" ? String(rawKewarganegaraan).trim() : "WNI",
            tahun_masuk: parseInt(String(rawTahunMasuk)) || new Date().getFullYear(),
            asal_sekolah: rawAsalSekolah !== undefined && rawAsalSekolah !== null ? String(rawAsalSekolah).trim() : "",
            alamat_sekolah_asal: rawAlamatSekolahAsal !== undefined && rawAlamatSekolahAsal !== null ? String(rawAlamatSekolahAsal).trim() : "",
            no_un_sebelumnya: rawNoUn !== undefined && rawNoUn !== null ? String(rawNoUn).trim() : "",
            alamat: rawAlamat !== undefined && rawAlamat !== null ? String(rawAlamat).trim() : "",
            rt: rawRt !== undefined && rawRt !== null ? String(rawRt).trim() : "",
            rw: rawRw !== undefined && rawRw !== null ? String(rawRw).trim() : "",
            desa_kelurahan: rawDesa !== undefined && rawDesa !== null ? String(rawDesa).trim() : "",
            kecamatan: rawKecamatan !== undefined && rawKecamatan !== null ? String(rawKecamatan).trim() : "",
            kabupaten_kota: rawKabupaten !== undefined && rawKabupaten !== null ? String(rawKabupaten).trim() : "",
            provinsi: rawProvinsi !== undefined && rawProvinsi !== null ? String(rawProvinsi).trim() : "",
            kode_pos: rawKodePos !== undefined && rawKodePos !== null ? String(rawKodePos).trim() : "",
            status: (String(rawStatus).trim() === "Tidak Aktif" ? "Tidak Aktif" : "Aktif") as "Aktif" | "Tidak Aktif",
            keterangan_asrama: (String(rawAsrama).trim() === "Ya" ? "Ya" : "Tidak") as "Ya" | "Tidak",
            kelas: rawKelas !== undefined && rawKelas !== null ? String(rawKelas).trim() : "",
            wali_murid: rawWali !== undefined && rawWali !== null ? String(rawWali).trim() : "",
          };
        }).filter((p: any) => Object.values(p).some(v => v !== "" && v !== undefined && v !== null));

        if (payloads.length === 0) {
          toast.error("File Excel kosong atau tidak berisi data.");
          setIsImporting(false);
          return;
        }

        // Navigate to preview page instead of posting directly
        navigate("/master-data/siswa/import", { state: { importData: payloads } });
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
    handleExport,
    handleDownloadTemplate,
    handleImport,
    isExporting
  };
}
