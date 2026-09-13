import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { FileSpreadsheet, Download } from "lucide-react";

interface PegawaiTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
}

export default function PegawaiTemplateModal({
  isOpen,
  onClose,
  onDownloadTemplate
}: PegawaiTemplateModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-700" />
            Panduan Pengisian Template Import Pegawai
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Penting sebelum mengimpor:</h4>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1 ml-1">
              <li>Pastikan header kolom di Excel tidak diubah (baris pertama).</li>
              <li>Kolom dengan tanda bintang (*) wajib diisi.</li>
              <li>Format tanggal disarankan menggunakan tipe Date/Text (YYYY-MM-DD).</li>
              <li>Sistem akan otomatis membuatkan akun login (NIG: <strong>NIG Pegawai</strong>, password: <strong>password123</strong>)</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Penjelasan Kolom:</h4>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 w-32">Nama Kolom</th>
                    <th className="px-3 py-2 w-24 text-center">Wajib?</th>
                    <th className="px-3 py-2">Keterangan & Contoh Pengisian</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">nig</td>
                    <td className="px-3 py-2 text-center text-red-600 font-bold">Ya</td>
                    <td className="px-3 py-2 text-gray-600">Nomor Induk Guru (Unik). Contoh: <code className="bg-gray-100 px-1 rounded">P001</code></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">nip</td>
                    <td className="px-3 py-2 text-center text-gray-400">Tidak</td>
                    <td className="px-3 py-2 text-gray-600">Nomor Induk Pegawai (Jika PNS). Contoh: <code className="bg-gray-100 px-1 rounded">1980...</code></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">nik</td>
                    <td className="px-3 py-2 text-center text-gray-400">Tidak</td>
                    <td className="px-3 py-2 text-gray-600">Nomor KTP. Contoh: <code className="bg-gray-100 px-1 rounded">352...</code></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">nama</td>
                    <td className="px-3 py-2 text-center text-red-600 font-bold">Ya</td>
                    <td className="px-3 py-2 text-gray-600">Nama lengkap pegawai. Contoh: <code className="bg-gray-100 px-1 rounded">Ahmad Fauzi</code></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">jenis_kelamin</td>
                    <td className="px-3 py-2 text-center text-red-600 font-bold">Ya</td>
                    <td className="px-3 py-2 text-gray-600">Isi dengan <code className="bg-gray-100 px-1 rounded">L</code> atau <code className="bg-gray-100 px-1 rounded">P</code>.</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">tempat_lahir</td>
                    <td className="px-3 py-2 text-center text-gray-400">Tidak</td>
                    <td className="px-3 py-2 text-gray-600">Tempat lahir pegawai. Contoh: <code className="bg-gray-100 px-1 rounded">Gresik</code></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">tanggal_lahir</td>
                    <td className="px-3 py-2 text-center text-gray-400">Tidak</td>
                    <td className="px-3 py-2 text-gray-600">Format YYYY-MM-DD. Contoh: <code className="bg-gray-100 px-1 rounded">1990-08-17</code></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">alamat</td>
                    <td className="px-3 py-2 text-center text-gray-400">Tidak</td>
                    <td className="px-3 py-2 text-gray-600">Alamat lengkap tempat tinggal.</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">no_hp</td>
                    <td className="px-3 py-2 text-center text-gray-400">Tidak</td>
                    <td className="px-3 py-2 text-gray-600">Nomor HP / WhatsApp. Contoh: <code className="bg-gray-100 px-1 rounded">08123456789</code></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">status</td>
                    <td className="px-3 py-2 text-center text-gray-400">Tidak</td>
                    <td className="px-3 py-2 text-gray-600">Isi dengan <code className="bg-gray-100 px-1 rounded">Aktif</code> atau <code className="bg-gray-100 px-1 rounded">Tidak Aktif</code>. Default: Aktif.</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">jabatan</td>
                    <td className="px-3 py-2 text-center text-red-600 font-bold">Ya</td>
                    <td className="px-3 py-2 text-gray-600">Contoh: <code className="bg-gray-100 px-1 rounded">Guru</code>, <code className="bg-gray-100 px-1 rounded">Staf TU</code>.</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">tugas_tambahan</td>
                    <td className="px-3 py-2 text-center text-gray-400">Tidak</td>
                    <td className="px-3 py-2 text-gray-600">Tugas tambahan (jika ada). Contoh: <code className="bg-gray-100 px-1 rounded">Waka Sarpras</code></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">golongan_darah</td>
                    <td className="px-3 py-2 text-center text-gray-400">Tidak</td>
                    <td className="px-3 py-2 text-gray-600">Isi dengan Rhesus. Contoh: <code className="bg-gray-100 px-1 rounded">A+</code>, <code className="bg-gray-100 px-1 rounded">B+</code>, <code className="bg-gray-100 px-1 rounded">O-</code></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">jumlah_anak_laki</td>
                    <td className="px-3 py-2 text-center text-gray-400">Tidak</td>
                    <td className="px-3 py-2 text-gray-600">Jumlah anak laki-laki (Angka). Contoh: <code className="bg-gray-100 px-1 rounded">1</code></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">jumlah_anak_perempuan</td>
                    <td className="px-3 py-2 text-center text-gray-400">Tidak</td>
                    <td className="px-3 py-2 text-gray-600">Jumlah anak perempuan (Angka). Contoh: <code className="bg-gray-100 px-1 rounded">2</code></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">nama_ayah</td>
                    <td className="px-3 py-2 text-center text-gray-400">Tidak</td>
                    <td className="px-3 py-2 text-gray-600">Nama lengkap ayah kandung. Contoh: <code className="bg-gray-100 px-1 rounded">Suryono</code></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">nama_ibu</td>
                    <td className="px-3 py-2 text-center text-gray-400">Tidak</td>
                    <td className="px-3 py-2 text-gray-600">Nama lengkap ibu kandung. Contoh: <code className="bg-gray-100 px-1 rounded">Siti Aminah</code></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">lembaga</td>
                    <td className="px-3 py-2 text-center text-gray-400">Tidak</td>
                    <td className="px-3 py-2 text-gray-600">Nama/singkatan lembaga. Contoh: <code className="bg-gray-100 px-1 rounded">SD IT</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 pt-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={onDownloadTemplate}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Unduh Template Excel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
