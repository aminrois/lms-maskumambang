import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface ActivityPlanDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: any;
  formData: any;
  setFormData: (data: any) => void;
  isLembagaDisabled: boolean;
  lembagas: any[];
  filteredTahuns: any[];
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function ActivityPlanDialog({
  isOpen,
  onOpenChange,
  selectedPlan,
  formData,
  setFormData,
  isLembagaDisabled,
  lembagas,
  filteredTahuns,
  isPending,
  onSubmit
}: ActivityPlanDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125 p-6 rounded-[24px] border-none shadow-xl bg-white max-h-[95vh] overflow-y-auto">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-800">
              {selectedPlan ? "Edit Activity Plan" : "Tambah Activity Plan"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nama_kegiatan" className="text-slate-600 font-medium text-sm">
                Nama Kegiatan <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nama_kegiatan"
                placeholder="cth: Ujian Akhir Semester"
                required
                value={formData.nama_kegiatan}
                onChange={(e) => setFormData({ ...formData, nama_kegiatan: e.target.value })}
                className="rounded-xl h-11 text-slate-850 border-slate-200 focus-visible:ring-1 focus-visible:ring-[#1E3A8A]"
              />
            </div>

            {/* Kategori Selector */}
            <div className="flex flex-col gap-2">
              <Label className="text-slate-600 font-medium text-sm">
                Kategori <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {(["Akademik", "Acara", "Libur", "Lainnya"] as const).map((cat) => {
                  const isSelected = formData.kategori === cat;
                  const btnClass =
                    cat === "Acara"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : cat === "Libur"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : cat === "Akademik"
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white";

                  const bgLight =
                    cat === "Acara"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : cat === "Libur"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : cat === "Akademik"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200";

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, kategori: cat })}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected ? `${btnClass} border-transparent shadow-sm` : `${bgLight} hover:bg-opacity-80`
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tanggal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="tanggal_mulai" className="text-slate-600 font-medium text-sm">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tanggal_mulai"
                  type="date"
                  required
                  value={formData.tanggal_mulai}
                  onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                  className="rounded-xl h-11 text-slate-800 border-slate-200 block focus-visible:ring-1 focus-visible:ring-[#1E3A8A]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tanggal_berakhir" className="text-slate-600 font-medium text-sm">
                  Tanggal Selesai <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tanggal_berakhir"
                  type="date"
                  required
                  value={formData.tanggal_berakhir}
                  onChange={(e) => setFormData({ ...formData, tanggal_berakhir: e.target.value })}
                  className="rounded-xl h-11 text-slate-800 border-slate-200 block focus-visible:ring-1 focus-visible:ring-[#1E3A8A]"
                />
              </div>
            </div>

            {/* Lembaga */}
            <div className="flex flex-col gap-2">
              <Label className="text-slate-600 font-medium text-sm">
                Lembaga <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.lembaga_id}
                onValueChange={(val) => setFormData({ ...formData, lembaga_id: val })}
                disabled={isLembagaDisabled}
              >
                <SelectTrigger className="rounded-xl h-11 text-slate-800 border-slate-200 font-medium focus-visible:ring-1 focus-visible:ring-[#1E3A8A]">
                  <SelectValue placeholder="Pilih Lembaga" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {lembagas.map((l) => (
                    <SelectItem key={l.lembaga_id} value={String(l.lembaga_id)}>
                      {l.nama_lembaga} {l.singkatan ? `(${l.singkatan})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tahun Ajaran */}
            <div className="flex flex-col gap-2">
              <Label className="text-slate-600 font-medium text-sm">
                Tahun Ajaran <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.tahun_id}
                onValueChange={(val) => setFormData({ ...formData, tahun_id: val })}
                disabled={!formData.lembaga_id}
              >
                <SelectTrigger className="rounded-xl h-11 text-slate-805 border-slate-200 font-medium focus-visible:ring-1 focus-visible:ring-[#1E3A8A]">
                  <SelectValue placeholder={formData.lembaga_id ? "Pilih Tahun Ajaran" : "Pilih Lembaga Terlebih Dahulu"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {filteredTahuns.map((t) => (
                    <SelectItem key={t.tahun_id} value={String(t.tahun_id)}>
                      {t.nama_tahun}, {t.semester} {t.is_active ? "(Aktif)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deskripsi */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="deskripsi" className="text-slate-600 font-medium text-sm">
                Deskripsi
              </Label>
              <Textarea
                id="deskripsi"
                placeholder="Keterangan atau detail rencana kegiatan..."
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                className="rounded-xl min-h-20 text-slate-800 border-slate-200 focus-visible:ring-1 focus-visible:ring-[#1E3A8A]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row w-full gap-3 mt-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full flex-1 rounded-xl h-12 text-slate-600 font-medium border-slate-200"
              >
                Batal
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full flex-1 rounded-xl h-12 bg-[#1E3A8A] hover:bg-[#152A66] text-white font-medium"
            >
              {isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Simpan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
