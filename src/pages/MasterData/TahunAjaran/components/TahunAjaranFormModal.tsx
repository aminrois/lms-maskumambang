import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { FieldError } from "../../../../components/ui/FieldError";
import { Loader2, Calendar } from "lucide-react";
import type { GlobalTahunAjaranUI } from "../hooks/useTahunAjaranData";
import { toast } from "sonner";

const DateInput = ({ value, onChange, placeholder = "dd/mm/yyyy", className, ...props }: any) => {
  const [type, setType] = useState<'text' | 'date'>('text');

  const displayValue = type === 'text' && value
    ? value.split('-').reverse().join('/')
    : value;

  return (
    <div className="relative">
      <input
        type={type}
        value={displayValue}
        onChange={onChange}
        onFocus={() => setType('date')}
        onBlur={() => setType('text')}
        placeholder={placeholder}
        className={className || "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"}
        {...props}
      />
      {type === 'text' && (
        <Calendar
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4"
        />
      )}
    </div>
  );
};

interface TahunAjaranFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: GlobalTahunAjaranUI | null;
  formData: any;
  setFormData: (data: any) => void;
  isTahunDuplikat: boolean;
  isRentangTanggalDuplikat: boolean;
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function TahunAjaranFormModal({
  isOpen,
  onClose,
  selectedData,
  formData,
  setFormData,
  isTahunDuplikat,
  isRentangTanggalDuplikat,
  isPending,
  onSubmit
}: TahunAjaranFormModalProps) {
  const isDisabled = !formData.nama_tahun || !formData.semester || !formData.tanggal_mulai || !formData.tanggal_akhir || isTahunDuplikat || isRentangTanggalDuplikat;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{selectedData ? "Edit Tahun Ajaran" : "Tambah Tahun Ajaran Baru"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tahun Ajaran <span className="text-red-500">*</span></label>
            <input required type="text" value={formData.nama_tahun} onChange={e => setFormData({ ...formData, nama_tahun: e.target.value })} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isTahunDuplikat ? 'border-red-400' : ''}`} placeholder="Contoh: 2023/2024" />
            {isTahunDuplikat && <FieldError message="Tahun ajaran dengan semester ini sudah terdaftar" />}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Semester <span className="text-red-500">*</span></label>
            <select required value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value as 'Ganjil' | 'Genap' })} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${isTahunDuplikat ? 'border-red-400' : ''}`}>
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Mulai <span className="text-red-500">*</span></label>
              <DateInput required value={formData.tanggal_mulai} onChange={(e: any) => setFormData({ ...formData, tanggal_mulai: e.target.value })} className={isRentangTanggalDuplikat ? 'border-red-400' : ''} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Akhir <span className="text-red-500">*</span></label>
              <DateInput required value={formData.tanggal_akhir} onChange={(e: any) => setFormData({ ...formData, tanggal_akhir: e.target.value })} className={isRentangTanggalDuplikat ? 'border-red-400' : ''} />
            </div>
          </div>
          {isRentangTanggalDuplikat && <FieldError message="Rentang tanggal ini sudah digunakan di tahun ajaran lain" />}



          <DialogFooter className="mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">Batal</button>
            <button 
              type="submit" 
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault();
                  if (isTahunDuplikat) {
                    toast.warning("Tahun ajaran dengan semester ini sudah terdaftar");
                  } else if (isRentangTanggalDuplikat) {
                    toast.warning("Rentang tanggal ini sudah digunakan di tahun ajaran lain");
                  } else {
                    toast.warning("Data yang terisi masih belum lengkap");
                  }
                }
              }}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors flex items-center gap-2 ${isDisabled || isPending ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {selectedData ? "Simpan Perubahan" : "Simpan"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
