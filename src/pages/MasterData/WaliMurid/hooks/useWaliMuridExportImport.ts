import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { WALI_MURID } from "../../../../types/database";
import { useState } from "react";
import React from "react";
import { restClient } from "../../../../lib/api/axios";

export function useWaliMuridExportImport(
  _dataWali: WALI_MURID[],
  setIsImporting: (v: boolean) => void,
  fileInputRef: React.RefObject<HTMLInputElement | null>
) {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await restClient.get("/wali_murid", {
        params: { select: "*", order: "nama_wali.asc" },
      });
      const allData: WALI_MURID[] = response.data || [];

      if (allData.length === 0) {
        toast.error("Tidak ada data wali murid untuk diekspor");
        return;
      }

      const exportData = allData.map((w) => ({
        nama_wali: w.nama_wali || "",
        nik_wali: w.nik_wali || "",
        no_hp_wali: w.no_hp_wali || "",
        alamat: w.alamat || "",
        status: w.status || "Hidup",
        nama_ayah: w.nama_ayah || "",
        nik_ayah: w.nik_ayah || "",
        no_hp_ayah: w.no_hp_ayah || "",
        status_ayah: w.status_ayah || "Hidup",
        pekerjaan_ayah: w.pekerjaan_ayah || "",
        penghasilan_ayah: w.penghasilan_ayah || "",
        pendidikan_ayah: w.pendidikan_ayah || "",
        nama_ibu: w.nama_ibu || "",
        nik_ibu: w.nik_ibu || "",
        no_hp_ibu: w.no_hp_ibu || "",
        status_ibu: w.status_ibu || "Hidup",
        pekerjaan_ibu: w.pekerjaan_ibu || "",
        penghasilan_ibu: w.penghasilan_ibu || "",
        pendidikan_ibu: w.pendidikan_ibu || "",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Wali Murid");
      XLSX.writeFile(wb, "Data_Wali_Murid.xlsx");
      toast.success(`Berhasil mengekspor ${exportData.length} data wali murid.`);
    } catch {
      toast.error("Gagal mengekspor data wali murid.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Baris 1: contoh data valid (bisa langsung diisi/diganti)
    const contohData = {
      nama_wali: "Budi Santoso",
      nik_wali: "3525010101900001",
      no_hp_wali: "081234567890",
      alamat: "Jl. Raya Pesantren No. 12, RT 01/RW 02",
      status: "Hidup",
      nama_ayah: "Budi Santoso",
      nik_ayah: "3525010101650001",
      no_hp_ayah: "081234567890",
      status_ayah: "Hidup",
      pekerjaan_ayah: "Wiraswasta",
      penghasilan_ayah: "Rp 3.000.000 - Rp 5.000.000",
      pendidikan_ayah: "S1",
      nama_ibu: "Siti Aminah",
      nik_ibu: "3525015012700001",
      no_hp_ibu: "081234567891",
      status_ibu: "Hidup",
      pekerjaan_ibu: "Ibu Rumah Tangga",
      penghasilan_ibu: "Kurang dari Rp 1.000.000",
      pendidikan_ibu: "SMA",
    };

    // Baris 2: keterangan panduan pengisian (tidak diimpor, hanya petunjuk)
    const keterangan = {
      nama_wali: "WAJIB - Nama wali / penanggungjawab",
      nik_wali: "WAJIB - NIK unik 16 digit (tidak boleh sama)",
      no_hp_wali: "WAJIB - Nomor HP aktif",
      alamat: "WAJIB - Alamat lengkap",
      status: "WAJIB - Isi: Hidup / Wafat",
      nama_ayah: "Opsional - Nama Ayah kandung",
      nik_ayah: "Opsional - NIK Ayah",
      no_hp_ayah: "Opsional - No HP Ayah",
      status_ayah: "Opsional - Hidup / Wafat",
      pekerjaan_ayah: "Opsional - Pekerjaan Ayah",
      penghasilan_ayah: "Opsional - Penghasilan bulanan Ayah",
      pendidikan_ayah: "Opsional - SD / SMP / SMA / D3 / S1 / S2 / S3",
      nama_ibu: "Opsional - Nama Ibu kandung",
      nik_ibu: "Opsional - NIK Ibu",
      no_hp_ibu: "Opsional - No HP Ibu",
      status_ibu: "Opsional - Hidup / Wafat",
      pekerjaan_ibu: "Opsional - Pekerjaan Ibu",
      penghasilan_ibu: "Opsional - Penghasilan bulanan Ibu",
      pendidikan_ibu: "Opsional - SD / SMP / SMA / D3 / S1 / S2 / S3",
    };

    const ws = XLSX.utils.json_to_sheet([contohData, keterangan]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Wali Murid");
    XLSX.writeFile(wb, "Template_Import_Wali_Murid.xlsx");
    toast.success("Template berhasil diunduh. Hapus baris keterangan (baris 3) sebelum mengimpor.");
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
        // raw: false agar angka panjang (NIK 16 digit) tidak jadi scientific notation
        const data = XLSX.utils.sheet_to_json<any>(ws, { raw: false, defval: "" });

        if (data.length === 0) {
          toast.error("File Excel kosong.");
          setIsImporting(false);
          return;
        }

        // Normalisasi: pastikan semua field yang diharapkan ada & NIK terbaca sebagai string
        const normalized = data.map((row: any) => ({
          nama_wali: String(row.nama_wali ?? "").trim(),
          nik_wali: String(row.nik_wali ?? "").trim(),
          no_hp_wali: String(row.no_hp_wali ?? "").trim(),
          alamat: String(row.alamat ?? "").trim(),
          status: String(row.status ?? "").trim() || "Hidup",
          nama_ayah: String(row.nama_ayah ?? "").trim(),
          nik_ayah: String(row.nik_ayah ?? "").trim(),
          no_hp_ayah: String(row.no_hp_ayah ?? "").trim(),
          status_ayah: String(row.status_ayah ?? "").trim() || "Hidup",
          pekerjaan_ayah: String(row.pekerjaan_ayah ?? "").trim(),
          penghasilan_ayah: String(row.penghasilan_ayah ?? "").trim(),
          pendidikan_ayah: String(row.pendidikan_ayah ?? "").trim(),
          nama_ibu: String(row.nama_ibu ?? "").trim(),
          nik_ibu: String(row.nik_ibu ?? "").trim(),
          no_hp_ibu: String(row.no_hp_ibu ?? "").trim(),
          status_ibu: String(row.status_ibu ?? "").trim() || "Hidup",
          pekerjaan_ibu: String(row.pekerjaan_ibu ?? "").trim(),
          penghasilan_ibu: String(row.penghasilan_ibu ?? "").trim(),
          pendidikan_ibu: String(row.pendidikan_ibu ?? "").trim(),
        }));

        // Filter baris yang benar-benar kosong semua
        const filtered = normalized.filter((row: any) =>
          Object.values(row).some((v) => v !== "" && v !== "Hidup")
        );

        if (filtered.length === 0) {
          toast.error("File Excel kosong atau tidak berisi data.");
          setIsImporting(false);
          return;
        }

        navigate("/master-data/wali-murid/import", {
          state: { importData: filtered },
        });
      } catch (err) {
        console.error("Gagal membaca file Excel:", err);
        toast.error("Gagal membaca file Excel. Pastikan format file sesuai.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return {
    isExporting,
    handleExport,
    handleDownloadTemplate,
    handleImport,
  };
}
