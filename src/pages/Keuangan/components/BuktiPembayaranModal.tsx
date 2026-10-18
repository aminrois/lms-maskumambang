import { useRef } from "react";
import { Printer, X } from "lucide-react";

interface BuktiItem {
  keterangan: string;
  nominal: number;
  nominal_total?: number;
  sisa_tagihan?: number;
  is_cicilan?: boolean;
}

export interface BuktiPembayaranData {
  nomor_transaksi?: string;
  tanggal_bayar?: string;
  created_at?: string;
  siswa?: {
    nama?: string;
    nis?: string;
    kelas?: {
      nama_kelas?: string;
    };
  };
  tahun_ajaran?: string;
  items?: BuktiItem[];
  total_bayar?: number;
  diskon?: number;
  biaya_admin?: number;
  metode_pembayaran?: string;
  status?: string;
  petugas?: string;
  catatan?: string;
}

interface BuktiPembayaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrintAfter?: () => void;
  data: BuktiPembayaranData | null;
}

// Helper Rupiah
const formatRupiah = (val?: number): string => {
  if (!val && val !== 0) return "Rp 0";
  return `Rp${val.toLocaleString("id-ID")}`;
};

// Helper Terbilang Bahasa Indonesia
const angkaKeTerbilang = (nilai: number): string => {
  const bilangan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];
  if (nilai < 12) return bilangan[nilai];
  if (nilai < 20) return angkaKeTerbilang(nilai - 10) + " Belas";
  if (nilai < 100) return angkaKeTerbilang(Math.floor(nilai / 10)) + " Puluh " + angkaKeTerbilang(nilai % 10);
  if (nilai < 200) return "Seratus " + angkaKeTerbilang(nilai - 100);
  if (nilai < 1000) return angkaKeTerbilang(Math.floor(nilai / 100)) + " Ratus " + angkaKeTerbilang(nilai % 100);
  if (nilai < 2000) return "Seribu " + angkaKeTerbilang(nilai - 1000);
  if (nilai < 1000000) return angkaKeTerbilang(Math.floor(nilai / 1000)) + " Ribu " + angkaKeTerbilang(nilai % 1000);
  if (nilai < 1000000000) return angkaKeTerbilang(Math.floor(nilai / 1000000)) + " Juta " + angkaKeTerbilang(nilai % 1000000);
  if (nilai < 1000000000000) return angkaKeTerbilang(Math.floor(nilai / 1000000000)) + " Milyar " + angkaKeTerbilang(nilai % 1000000000);
  return "";
};

const terbilangRupiah = (nominal?: number): string => {
  if (!nominal || nominal <= 0) return "Nol rupiah";
  const str = angkaKeTerbilang(Math.floor(nominal)).trim();
  const res = (str ? str.replace(/\s+/g, " ") : "") + " rupiah";
  // Make sentence case
  return res.charAt(0).toUpperCase() + res.slice(1).toLowerCase();
};

// Helper Format Tanggal WIB
const formatTanggalWIB = (dateStr?: string): string => {
  const now = new Date();
  if (!dateStr) {
    const tgl = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const jam = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ".");
    return `${tgl}, ${jam} WIB`;
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const tgl = d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ".");
    return `${tgl}, ${jam} WIB`;
  } catch {
    return dateStr;
  }
};

export default function BuktiPembayaranModal({
  isOpen,
  onClose,
  onPrintAfter,
  data,
}: BuktiPembayaranModalProps) {
  const receiptContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const total = data.total_bayar || 0;
  const items = data.items || [];
  const subtotal = items.reduce((acc, it) => acc + (it.nominal || 0), 0) || total;
  const diskon = data.diskon || 0;
  const nomorTrx = data.nomor_transaksi || "TRX-LOKET";

  const handlePrint = () => {
    window.print();
    if (onPrintAfter) {
      onPrintAfter();
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 no-print">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">Pratinjau Bukti Pembayaran</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#162E6E] hover:bg-[#122456] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PRINTABLE AREA (Matches uploaded reference image exactly)       */}
        {/* ============================================================== */}
        <div
          ref={receiptContainerRef}
          className="print-receipt-sheet bg-white p-7 md:p-9 text-slate-800 max-w-md mx-auto print:max-w-none print:p-6"
        >
          {/* Header: Logo, Title, Nomor */}
          <div className="text-center">
            <img
              src="/logo-pesantren.png"
              alt="Pondok Pesantren Maskumambang"
              className="h-16 w-auto max-w-[280px] sm:max-w-[320px] mx-auto mb-3 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-normal uppercase">
              BUKTI PEMBAYARAN
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Nomor: {nomorTrx}
            </p>
          </div>

          {/* Identitas Santri & Transaksi (Two-column Key-Value) */}
          <div className="mt-6 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Tanggal transaksi</span>
              <span className="font-semibold text-slate-900">
                {formatTanggalWIB(data.tanggal_bayar || data.created_at)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Nama santri/siswa</span>
              <span className="font-semibold text-slate-900">
                {data.siswa?.nama || "-"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">NIS/NISN</span>
              <span className="font-semibold text-slate-900 font-mono">
                {data.siswa?.nis || "-"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Kelas</span>
              <span className="font-semibold text-slate-900">
                {data.siswa?.kelas?.nama_kelas || "-"}
              </span>
            </div>
          </div>

          {/* Rincian Pembayaran */}
          <div className="mt-6">
            <h3 className="text-xs font-bold text-slate-900 mb-2">Rincian Pembayaran</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-400 font-normal">
                  <th className="py-1.5 text-left font-normal w-8">No.</th>
                  <th className="py-1.5 text-left font-normal">Keterangan</th>
                  <th className="py-1.5 text-right font-normal">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td className="py-2 text-slate-500">1</td>
                    <td className="py-2 text-slate-800 font-medium">Pembayaran Pendidikan</td>
                    <td className="py-2 text-right font-semibold text-slate-900">{formatRupiah(total)}</td>
                  </tr>
                ) : (
                  items.map((it, idx) => {
                    const isCicilan = it.is_cicilan || (it.sisa_tagihan !== undefined && it.sisa_tagihan > 0);
                    const totalTagihan = it.nominal_total;
                    const sisa = it.sisa_tagihan;

                    return (
                      <tr key={idx}>
                        <td className="py-2.5 text-slate-500 align-top">{idx + 1}</td>
                        <td className="py-2.5 text-slate-800 align-top">
                          <div className="font-medium text-slate-900">{it.keterangan}</div>
                          {isCicilan && (
                            <div className="text-[10px] text-slate-500 mt-0.5 space-x-1">
                              {totalTagihan !== undefined && totalTagihan > 0 && (
                                <span>Total: {formatRupiah(totalTagihan)} • </span>
                              )}
                              <span className="font-semibold text-slate-800">
                                Sisa: {formatRupiah(sisa || 0)} (Dicicil)
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-slate-900 align-top whitespace-nowrap">
                          {formatRupiah(it.nominal)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Subtotal & Diskon */}
            <div className="pt-3 space-y-1.5 text-xs border-t border-slate-100 mt-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-bold text-slate-900">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Diskon</span>
                <span className="text-slate-700">{formatRupiah(diskon)}</span>
              </div>
            </div>
          </div>

          {/* TOTAL PEMBAYARAN (Warna Hitam) */}
          <div className="border-t border-slate-200 mt-4 pt-3 flex justify-between items-center">
            <span className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              TOTAL PEMBAYARAN
            </span>
            <span className="text-base font-black text-slate-900">
              {formatRupiah(total)}
            </span>
          </div>

          {/* Terbilang Box */}
          <div className="my-3.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-[10px] text-slate-400 font-normal">Terbilang</div>
            <div className="text-xs font-semibold italic text-slate-800 mt-0.5">
              {terbilangRupiah(total)}
            </div>
          </div>

          {/* Informasi Transaksi */}
          <div className="mt-5">
            <h3 className="text-xs font-bold text-slate-900 mb-2">Informasi Transaksi</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Metode pembayaran</span>
                <span className="font-semibold text-slate-800">
                  {data.metode_pembayaran || "Tunai (Loket Kasir)"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status pembayaran</span>
                <span className="font-bold text-slate-900 uppercase">
                  {data.status || "LUNAS"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Petugas penerima</span>
                <span className="font-semibold text-slate-800">
                  {data.petugas || "Admin Keuangan"}
                </span>
              </div>
            </div>
          </div>

          {/* Tanda Tangan Petugas & Penerima */}
          <div className="pt-8 pb-2 grid grid-cols-2 text-center text-xs text-slate-800">
            <div className="space-y-12">
              <div className="text-slate-600">Penyetor / Wali Santri</div>
              <div className="font-semibold underline text-slate-900">( ..................................... )</div>
            </div>
            <div className="space-y-12">
              <div className="text-slate-600">Petugas Loket Kasir</div>
              <div className="font-semibold underline text-slate-900">( {data.petugas || "Admin Keuangan"} )</div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="border-t border-slate-100 mt-5 pt-4 text-center">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Terima kasih telah memenuhi kewajiban administrasi pendidikan. Simpan bukti pembayaran ini sebagai arsip.
            </p>
            <div className="mt-3 flex flex-col items-center justify-center text-[10px] text-slate-400">
              <span className="text-xs leading-none">↓</span>
              <span className="mt-0.5">Bukti pembayaran elektronik</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 bg-[#162E6E] hover:bg-[#122456] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Struk Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
