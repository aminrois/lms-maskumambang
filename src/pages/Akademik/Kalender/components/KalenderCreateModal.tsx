import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { eventTypes } from "../hooks/useKalender";
import type { EventTypeKey } from "../hooks/useKalender";

interface KalenderCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  selectedCategory: EventTypeKey;
  setSelectedCategory: (category: EventTypeKey) => void;
  lembagaList: any[];
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export const KalenderCreateModal: React.FC<KalenderCreateModalProps> = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  selectedCategory,
  setSelectedCategory,
  lembagaList,
  onSubmit,
  isPending,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125 p-6 rounded-[24px] border-none shadow-xl bg-white max-h-[90vh] overflow-y-auto">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-800">
              Tambah Event Kalender
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title" className="text-slate-600 font-medium text-sm">
                Judul Event <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="cth: Libur Semester Ganjil"
                required
                value={formData.nama_kegiatan}
                onChange={(e) => setFormData({ ...formData, nama_kegiatan: e.target.value })}
                className="rounded-xl h-11 text-slate-600 border-slate-200"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-slate-600 font-medium text-sm">
                Kategori <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-wrap gap-2.5">
                {Object.entries(eventTypes).map(([key, value]) => {
                  const isSelected = selectedCategory === key;
                  const selectedClass =
                    key === "Acara"
                      ? "bg-blue-500 text-white"
                      : key === "Libur"
                        ? "bg-red-500 text-white"
                        : key === "Akademik"
                          ? "bg-amber-500 text-white"
                          : key === "Lainnya"
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-500 text-white";

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedCategory(key as EventTypeKey)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${isSelected
                        ? selectedClass
                        : `${value.bgLight} ${value.textLight} hover:opacity-80`
                        }`}
                    >
                      {value.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="startDate" className="text-slate-600 font-medium text-sm">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  required
                  value={formData.tanggal_mulai}
                  onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                  className="rounded-xl h-11 text-slate-600 border-slate-200 block"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="endDate" className="text-slate-600 font-medium text-sm">
                  Tanggal Selesai <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  required
                  value={formData.tanggal_berakhir}
                  onChange={(e) => setFormData({ ...formData, tanggal_berakhir: e.target.value })}
                  className="rounded-xl h-11 text-slate-600 border-slate-200 block"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-slate-600 font-medium text-sm">
                Lembaga{" "}
                <span className="font-normal text-slate-400">
                  (kosong = semua lembaga)
                </span>
              </Label>
              <Select value={formData.lembaga_id} onValueChange={(val) => setFormData({ ...formData, lembaga_id: val })}>
                <SelectTrigger className="rounded-xl h-11 text-slate-800 border-slate-200 font-medium">
                  <SelectValue placeholder="Semua Lembaga" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="null">Semua Lembaga</SelectItem>
                  {lembagaList.map((l: any) => (
                    <SelectItem key={l.lembaga_id} value={l.lembaga_id.toString()}>
                      {l.singkatan || l.nama_lembaga}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row w-full h-23 mt-4 gap-3">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full flex-1 rounded-xl h-12 text-slate-600 font-medium border-slate-200"
              >
                Batal
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending} className="w-full flex-1 rounded-xl h-12 bg-[#243B7A] hover:bg-[#1C2D5C] text-white font-medium">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
