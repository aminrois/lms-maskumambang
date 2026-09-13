import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import type { SiswaUI } from "../hooks/useSiswaData";

interface SiswaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSiswa: SiswaUI | null;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (siswa: SiswaUI) => void;
  onDelete: (siswa: SiswaUI) => void;
}

export default function SiswaDetailModal({
  isOpen,
  onClose,
  selectedSiswa,
  canUpdate,
  canDelete,
  onEdit,
  onDelete
}: SiswaDetailModalProps) {
  if (!selectedSiswa) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Siswa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2 text-sm">
          <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">Nama Lengkap</span>
              <span className="font-semibold text-gray-800">{selectedSiswa.nama}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">Nama Panggilan</span>
              <span className="font-medium text-gray-800">{selectedSiswa.raw.panggilan || "—"}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">NIS</span>
              <span className="font-medium text-gray-800">{selectedSiswa.nis}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">NISN</span>
              <span className="font-medium text-gray-800">{selectedSiswa.nisn}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">NIK</span>
              <span className="font-medium text-gray-800">{selectedSiswa.raw.nik || "—"}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">KK</span>
              <span className="font-medium text-gray-800">{selectedSiswa.raw.no_kk || "—"}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">No Akta</span>
              <span className="font-medium text-gray-800">{selectedSiswa.raw.no_akta_kelahiran || "—"}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">Jenis Kelamin</span>
              <span className="font-medium text-gray-800">{selectedSiswa.raw.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">Tempat Lahir</span>
              <span className="font-medium text-gray-800">{selectedSiswa.raw.tempat_lahir || "—"}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">Tanggal Lahir</span>
              <span className="font-medium text-gray-800">
                {selectedSiswa.raw.tanggal_lahir ? new Date(selectedSiswa.raw.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">Agama</span>
              <span className="font-medium text-gray-800">{selectedSiswa.raw.agama || "—"}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">Kewarganegaraan</span>
              <span className="font-medium text-gray-800">{selectedSiswa.raw.kewarganegaraan || "—"}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">Tahun Masuk</span>
              <span className="font-medium text-gray-800">{selectedSiswa.raw.tahun_masuk || "—"}</span>
            </div>
            <div className="flex justify-between items-start border-b pb-2 gap-4">
              <span className="text-gray-500 font-medium shrink-0">Asal Sekolah</span>
              <span className="font-medium text-gray-800 text-right wrap-break-word">{selectedSiswa.raw.asal_sekolah || "—"}</span>
            </div>
            <div className="flex justify-between items-start border-b pb-2 gap-4">
              <span className="text-gray-500 font-medium shrink-0">Alamat Sekolah Asal</span>
              <span className="font-medium text-gray-800 text-right wrap-break-word">{selectedSiswa.raw.alamat_sekolah_asal || "—"}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">No UN Sebelumnya</span>
              <span className="font-medium text-gray-800">{selectedSiswa.raw.no_un_sebelumnya || "—"}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">RT</span>
              <span className="font-medium text-gray-800">{selectedSiswa.raw.rt || "—"}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">RW</span>
              <span className="font-medium text-gray-800">{selectedSiswa.raw.rw || "—"}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">Desa / Kelurahan</span>
              <span className="font-medium text-gray-800">{selectedSiswa.raw.desa_kelurahan || "—"}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">Kecamatan</span>
              <span className="font-medium text-gray-800">{selectedSiswa.raw.kecamatan || "—"}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">Kab / Kota</span>
              <span className="font-medium text-gray-800">{selectedSiswa.raw.kabupaten_kota || "—"}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">Provinsi</span>
              <span className="font-medium text-gray-800">{selectedSiswa.raw.provinsi || "—"}</span>
            </div>
            <div className="flex justify-between items-start border-b pb-2 gap-4">
              <span className="text-gray-500 font-medium shrink-0">Alamat</span>
              <span className="font-medium text-gray-800 text-right wrap-break-word">{selectedSiswa.raw.alamat || "—"}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">Kode Pos</span>
              <span className="font-medium text-gray-800">{selectedSiswa.raw.kode_pos || "—"}</span>
            </div>
            <div className="flex justify-between items-start border-b pb-2 gap-4">
              <span className="text-gray-500 font-medium shrink-0">Keterangan Asrama</span>
              <span className="font-medium text-gray-800 text-right wrap-break-word">{selectedSiswa.raw.keterangan_asrama || "—"}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">Kelas</span>
              <span className="font-medium text-gray-800">{selectedSiswa.kelas}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">Lembaga</span>
              <span className="font-medium text-gray-800">{selectedSiswa.lembaga}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500 font-medium">Wali Murid</span>
              {selectedSiswa.waliMurid === "—" || selectedSiswa.waliMurid === "-" ? (
                <span className="italic text-gray-400">Belum ada wali murid</span>
              ) : (
                <span className="font-medium text-gray-800">{selectedSiswa.waliMurid}</span>
              )}
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-gray-500 font-medium">Status</span>
              <span className={`font-semibold ${selectedSiswa.status === "Aktif" ? "text-green-600" : selectedSiswa.status === "Alumni" ? "text-blue-600" : "text-red-600"}`}>
                {selectedSiswa.status}
              </span>
            </div>
          </div>

          <DialogFooter className="mt-6 sm:justify-between gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 w-full sm:w-auto text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Tutup</button>
            {(canUpdate || canDelete) && (
              <div className="flex gap-2 w-full sm:w-auto">
                {canUpdate && (
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(selectedSiswa);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => {
                      onClose();
                      onDelete(selectedSiswa);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus
                  </button>
                )}
              </div>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
