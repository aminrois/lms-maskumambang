
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { FileSpreadsheet, Download } from "lucide-react";

interface SiswaTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export default function SiswaTemplateModal({
  isOpen,
  onClose,
  onDownload
}: SiswaTemplateModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            Panduan Pengisian Template Impor Siswa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <p className="text-sm text-gray-500">
            Harap perhatikan ketentuan pengisian data kolom di bawah ini agar proses impor berjalan lancar tanpa error database:
          </p>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                <tr>
                  <th className="px-4 py-2.5">Nama Kolom</th>
                  <th className="px-4 py-2.5 text-center">Sifat</th>
                  <th className="px-4 py-2.5">Aturan / Petunjuk Pengisian</th>
                  <th className="px-4 py-2.5">Contoh</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-600">
                <tr>
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">nis</td>
                  <td className="px-4 py-2.5 text-center"><span className="text-red-600 font-bold">Wajib</span></td>
                  <td className="px-4 py-2.5">Nomor Induk Siswa. Harus unik (tidak boleh sama dengan siswa lain).</td>
                  <td className="px-4 py-2.5 font-mono text-gray-500">2407001</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">nama</td>
                  <td className="px-4 py-2.5 text-center"><span className="text-red-600 font-bold">Wajib</span></td>
                  <td className="px-4 py-2.5">Nama lengkap siswa sesuai akta kelahiran.</td>
                  <td className="px-4 py-2.5 text-gray-500">Ahmad Fauzi</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">jenis_kelamin</td>
                  <td className="px-4 py-2.5 text-center"><span className="text-red-600 font-bold">Wajib</span></td>
                  <td className="px-4 py-2.5">Jenis kelamin siswa. Diisi <code className="bg-gray-100 px-1 rounded font-mono">L</code> atau <code className="bg-gray-100 px-1 rounded font-mono">P</code>.</td>
                  <td className="px-4 py-2.5 font-mono text-gray-500">L / P</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">tempat_lahir</td>
                  <td className="px-4 py-2.5 text-center"><span className="text-red-600 font-bold">Wajib</span></td>
                  <td className="px-4 py-2.5">Kabupaten atau Kota kelahiran siswa.</td>
                  <td className="px-4 py-2.5 text-gray-500">Gresik</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">tanggal_lahir</td>
                  <td className="px-4 py-2.5 text-center"><span className="text-red-600 font-bold">Wajib</span></td>
                  <td className="px-4 py-2.5">Format tanggal lahir wajib menggunakan format <code className="bg-gray-100 px-1 rounded font-mono">YYYY-MM-DD</code>.</td>
                  <td className="px-4 py-2.5 font-mono text-gray-500">2010-08-17</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">kelas</td>
                  <td className="px-4 py-2.5 text-center"><span className="text-gray-400">Opsional</span></td>
                  <td className="px-4 py-2.5">Diisi nama kelas yang valid (bisa dilihat di referensi panel halaman preview), atau kosongkan / diisi tanda hubung (<code className="bg-gray-100 px-1 rounded font-mono">-</code>) jika belum ada kelas.</td>
                  <td className="px-4 py-2.5 font-mono text-gray-500">10</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">asal_sekolah</td>
                  <td className="px-4 py-2.5 text-center"><span className="text-red-600 font-bold">Wajib</span></td>
                  <td className="px-4 py-2.5">Nama sekolah asal sebelum masuk lembaga.</td>
                  <td className="px-4 py-2.5 text-gray-500">SDN 1 Manyar</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">tahun_masuk</td>
                  <td className="px-4 py-2.5 text-center"><span className="text-red-600 font-bold">Wajib</span></td>
                  <td className="px-4 py-2.5">Tahun pendaftaran masuk. Berupa 4 digit angka.</td>
                  <td className="px-4 py-2.5 font-mono text-gray-500">2026</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">keterangan_asrama</td>
                  <td className="px-4 py-2.5 text-center"><span className="text-red-600 font-bold">Wajib</span></td>
                  <td className="px-4 py-2.5">Status mukim di asrama pesantren. Diisi <code className="bg-gray-100 px-1 rounded font-mono">Ya</code> atau <code className="bg-gray-100 px-1 rounded font-mono">Tidak</code>.</td>
                  <td className="px-4 py-2.5 font-mono text-gray-500">Tidak</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">status</td>
                  <td className="px-4 py-2.5 text-center"><span className="text-red-600 font-bold">Wajib</span></td>
                  <td className="px-4 py-2.5">Status siswa di lembaga. Diisi <code className="bg-gray-100 px-1 rounded font-mono">Aktif</code> atau <code className="bg-gray-100 px-1 rounded font-mono">Tidak Aktif</code>.</td>
                  <td className="px-4 py-2.5 font-mono text-gray-500">Aktif</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">nisn</td>
                  <td className="px-4 py-2.5 text-center"><span className="text-gray-400">Opsional</span></td>
                  <td className="px-4 py-2.5">Nomor Induk Siswa Nasional (10 digit). Boleh dikosongkan atau diisi tanda hubung (<code className="bg-gray-100 px-1 rounded font-mono">-</code>).</td>
                  <td className="px-4 py-2.5 font-mono text-gray-500">0102030405</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">wali_murid</td>
                  <td className="px-4 py-2.5 text-center"><span className="text-gray-400">Opsional</span></td>
                  <td className="px-4 py-2.5">Diisi <strong>Nama Wali</strong> (Ayah, Ibu, atau Wali) yang terdaftar di sistem. Referensi nama tersedia di halaman preview impor. Kosongkan atau isi tanda hubung (<code className="bg-gray-100 px-1 rounded font-mono">-</code>) jika belum ada.</td>
                  <td className="px-4 py-2.5 text-gray-500">Ahmad Fauzi</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">nik / no_kk / no_akta_kelahiran</td>
                  <td className="px-4 py-2.5 text-center"><span className="text-gray-400">Opsional</span></td>
                  <td className="px-4 py-2.5">Nomor NIK (16 digit), Kartu Keluarga, dan No Akta Kelahiran.</td>
                  <td className="px-4 py-2.5 font-mono text-gray-500">3525...</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">rt / rw / desa_kelurahan / kecamatan / kabupaten_kota / provinsi</td>
                  <td className="px-4 py-2.5 text-center"><span className="text-gray-400">Opsional</span></td>
                  <td className="px-4 py-2.5">Detail wilayah dan alamat tempat tinggal siswa.</td>
                  <td className="px-4 py-2.5 text-gray-500">RT 01 RW 02 Manyar, Gresik, Jawa Timur</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">alamat_sekolah_asal</td>
                  <td className="px-4 py-2.5 text-center"><span className="text-gray-400">Opsional</span></td>
                  <td className="px-4 py-2.5">Alamat lengkap sekolah asal siswa.</td>
                  <td className="px-4 py-2.5 text-gray-500">Jl. Raya Manyar No. 12</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">pin / panggilan / alamat / kode_pos / no_un_sebelumnya</td>
                  <td className="px-4 py-2.5 text-center"><span className="text-gray-400">Opsional</span></td>
                  <td className="px-4 py-2.5">Informasi pendukung opsional. Boleh dikosongkan atau diisi tanda hubung (<code className="bg-gray-100 px-1 rounded font-mono">-</code>).</td>
                  <td className="px-4 py-2.5 text-gray-500">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="mt-4 pt-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onDownload();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Unduh Template (.xlsx)
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
