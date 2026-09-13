// src/pages/Akademik/MataPelajaran/MataPelajaranDialog.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useMataPelajaranDialog } from "./hooks/useMataPelajaranDialog";

interface MataPelajaranDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapelId: number | null;
  onSuccess: () => void;
}

export const MataPelajaranDialog: React.FC<MataPelajaranDialogProps> = ({
  open,
  onOpenChange,
  mapelId,
  onSuccess
}) => {
  const {
    isEdit,
    register,
    handleSubmit,
    setValue,
    errors,
    watch,
    isSubmitting,
    isLoading,
    lembagas,
    filteredKelas,
    selectedKelas,
    toggleKelas,
    onSubmit,
  } = useMataPelajaranDialog(open, mapelId, onOpenChange, onSuccess);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-6 rounded-[24px] border-none shadow-xl bg-white max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-800">
              {isEdit ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran Baru"}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              {isEdit ? "Perbarui detail informasi mata pelajaran" : "Tambahkan mata pelajaran baru beserta penugasan gurunya."}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="flex flex-col gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600">Lembaga *</label>
                  <Select 
                    value={watch("lembaga_id")} 
                    onValueChange={(val) => {
                      setValue("lembaga_id", val);
                    }}
                    disabled={isEdit}
                  >
                    <SelectTrigger className="rounded-xl h-11 text-slate-800 border-slate-200 font-medium">
                      <SelectValue placeholder="Pilih Lembaga" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {lembagas.map((l: any) => (
                        <SelectItem key={l.lembaga_id} value={l.lembaga_id.toString()}>
                          {l.singkatan || l.nama_lembaga}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="nama_mapel" className="text-sm font-semibold text-slate-600">Nama Mata Pelajaran *</label>
                  <Input
                    id="nama_mapel"
                    placeholder="cth: Matematika Peminatan"
                    className="rounded-xl h-11 text-slate-600 border-slate-200"
                    {...register("nama_mapel", { required: true })}
                  />
                  {errors.nama_mapel && <span className="text-xs text-red-500">Wajib diisi</span>}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Pilih Kelas</h3>
                <p className="text-xs text-slate-400 mb-3">Pilih satu atau beberapa kelas yang akan menggunakan mata pelajaran ini.</p>

                {!watch("lembaga_id") ? (
                  <p className="text-sm text-slate-500">Pilih lembaga terlebih dahulu.</p>
                ) : filteredKelas.length === 0 ? (
                  <p className="text-sm text-slate-500">Tidak ada kelas tersedia untuk lembaga ini.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2">
                    {filteredKelas.map((kelas: any) => {
                      const isSelected = selectedKelas.includes(kelas.kelas_id);
                      return (
                        <div
                          key={kelas.kelas_id}
                          onClick={() => toggleKelas(kelas.kelas_id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                              : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                          }`}>
                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className="text-sm font-medium truncate">{kelas.nama_kelas}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <DialogFooter className="border-t border-slate-100 pt-4 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl h-11 border-slate-200 text-slate-500 font-semibold"
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#243B7A] hover:bg-[#1C2D5C] text-white rounded-xl h-11 px-6 font-semibold shadow-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Simpan Mapel
                </Button>
              </DialogFooter>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
