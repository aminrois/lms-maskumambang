import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { DetailForm } from "../../hooks/useLessonPlanForm";

interface LessonPlanDetailListProps {
  details: DetailForm[];
  onDetailChange: (index: number, field: 'tema' | 'deskripsi', value: string) => void;
  onTambahPertemuan: () => void;
  onHapusPertemuan: (index: number) => void;
}

export function LessonPlanDetailList({
  details,
  onDetailChange,
  onTambahPertemuan,
  onHapusPertemuan
}: LessonPlanDetailListProps) {
  return (
    <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5 flex flex-row justify-between items-center">
        <div className="flex-1">
          <CardTitle className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            Detail Pertemuan
          </CardTitle>
          <p className="text-[11px] text-slate-400 mt-1">Sediakan materi dan topik pokok bahasan untuk tiap pertemuan</p>
        </div>
        <Button
          type="button"
          onClick={onTambahPertemuan}
          variant="outline"
          size="sm"
          className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-xs"
        >
          <Plus className="w-4 h-4 mr-1" />
          Tambah Pertemuan
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-6 divide-y divide-slate-100">
        {details.map((detail, index) => (
          <div key={index} className={`grid grid-cols-1 lg:grid-cols-12 gap-5 ${index > 0 ? "pt-6" : ""}`}>
            {/* Nomor Urut — otomatis, read-only */}
            <div className="lg:col-span-2 flex flex-row lg:flex-col gap-2 items-center lg:items-start">
              <Label className="text-slate-600 font-bold text-[11px] uppercase tracking-wider lg:block hidden">
                Pertemuan
              </Label>
              <div className="flex items-center justify-center w-full lg:w-auto lg:justify-start">
                <div className="w-16 h-10 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center font-bold text-base shrink-0 border border-slate-200">
                  {index + 1}
                </div>
              </div>
            </div>

            {/* Tema Pertemuan */}
            <div className="lg:col-span-4 flex flex-col gap-2">
              <Label className="text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                Materi / Pokok Bahasan *
              </Label>
              <Input
                placeholder="cth: Struktur Tumbuhan dan Fungsinya"
                required
                value={detail.tema}
                onChange={(e) => onDetailChange(index, "tema", e.target.value)}
                className="rounded-xl h-10 border-slate-200 text-sm font-medium"
              />
            </div>

            {/* Deskripsi Kegiatan */}
            <div className="lg:col-span-5 flex flex-col gap-2">
              <Label className="text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                Topik Materi / Sub-materi
              </Label>
              <Textarea
                placeholder="cth: Praktikum anatomi akar monokotil..."
                value={detail.deskripsi}
                onChange={(e) => onDetailChange(index, "deskripsi", e.target.value)}
                className="rounded-xl min-h-10 py-2 border-slate-200 text-xs leading-relaxed"
              />
            </div>

            {/* Hapus Baris */}
            <div className="lg:col-span-1 flex items-end justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (details.length === 1) {
                    toast.error("Minimal harus ada 1 pertemuan dalam RPP.");
                  } else if (index !== details.length - 1) {
                    toast.error("Hanya bisa menghapus pertemuan paling akhir.");
                  } else {
                    onHapusPertemuan(index);
                  }
                }}
                className={`h-10 w-10 text-red-500 rounded-xl ${
                  details.length === 1 || index !== details.length - 1
                    ? "opacity-40 cursor-not-allowed hover:bg-transparent"
                    : "hover:text-red-700 hover:bg-red-50"
                }`}
                title="Hapus baris pertemuan terakhir"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        
        {/* Tombol Tambah di Bawah */}
        <div className="pt-2 pb-4 flex justify-center w-full">
          <Button
            type="button"
            onClick={onTambahPertemuan}
            variant="outline"
            className="rounded-xl border-dashed border-2 border-slate-300 text-slate-500 hover:text-blue-700 hover:border-blue-400 hover:bg-blue-50/50 font-bold text-sm w-full py-6 transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Tambah Pertemuan Berikutnya
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
