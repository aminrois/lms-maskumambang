import { useLessonPlanForm } from "./hooks/useLessonPlanForm";
import { FormHeader } from "./components/form/FormHeader";
import { LessonPlanMetaFields } from "./components/form/LessonPlanMetaFields";
import { LessonPlanDetailList } from "./components/form/LessonPlanDetailList";
import { FormCancelDialog } from "./components/form/FormCancelDialog";
import { Loader2, Save, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function FormLessonPlan() {
  const {
    id,
    role,
    isLoading,
    isSubmitting,
    showCancelDialog,
    showVerifikasiResetDialog,
    absensiTerimpakCount,
    pegawais,
    mapels,
    formData,
    setFormData,
    details,
    tambahPertemuan,
    hapusPertemuan,
    handleDetailChange,
    handleDownloadTemplate,
    handleImport,
    handleSubmit,
    handleCancelClick,
    handleCancelProceed,
    handleCancelReset,
    handleVerifikasiResetConfirm,
    handleVerifikasiResetCancel,
    isImporting,
    fileInputRef
  } = useLessonPlanForm();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-2" />
        <span className="font-medium text-sm">Memuat data RPP...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-500 relative">
      <FormHeader
        id={id}
        isImporting={isImporting}
        fileInputRef={fileInputRef}
        onCancelClick={handleCancelClick}
        onDownloadTemplate={handleDownloadTemplate}
        onImport={handleImport}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <LessonPlanMetaFields
          role={role}
          formData={formData}
          setFormData={setFormData}
          pegawais={pegawais}
          mapels={mapels}
        />

        <LessonPlanDetailList
          details={details}
          onDetailChange={handleDetailChange}
          onTambahPertemuan={tambahPertemuan}
          onHapusPertemuan={hapusPertemuan}
        />

        {/* Sticky Bottom Bar */}
        <div className="sticky bottom-0 -mb-6 px-6 py-4 z-40 bg-white border border-b-0 border-slate-200 rounded-t-2xl flex items-center justify-end gap-3 mt-12 shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.1)]">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelClick}
            disabled={isSubmitting}
            className="rounded-xl h-11 px-6 font-semibold text-slate-700 border-slate-200 hover:bg-slate-50"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-8 font-semibold shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Simpan RPP
          </Button>
        </div>
      </form>

      <FormCancelDialog
        isOpen={showCancelDialog}
        onOpenChange={handleCancelReset}
        onConfirm={handleCancelProceed}
        onCancel={handleCancelReset}
      />

      {/* Dialog peringatan reset status verifikasi */}
      <Dialog open={showVerifikasiResetDialog} onOpenChange={handleVerifikasiResetCancel}>
        <DialogContent className="sm:max-w-md p-6 rounded-[24px] border-none shadow-xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 text-xl font-semibold">
              <ShieldAlert className="w-5 h-5" />
              Perhatian: Status Verifikasi Akan Direset!
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-gray-700 text-sm leading-relaxed space-y-3">
            <p>
              RPP ini <strong>sudah terverifikasi</strong>. Jika Anda menyimpan perubahan,
              status verifikasinya akan direset kembali ke <strong className="text-amber-600">"Menunggu Verifikasi"</strong> dan
              harus melalui proses verifikasi ulang.
            </p>
            <p className="text-red-600 font-medium">
              ⚠️ Dampaknya: Mata pelajaran yang sudah ditambahkan ke jadwal pelajaran
              tidak akan dapat diupload aktivitasnya sampai RPP ini diverifikasi kembali.
            </p>

            {/* Peringatan kritis jika ada absensi yang terdampak */}
            {absensiTerimpakCount > 0 && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 space-y-1">
                <p className="text-red-700 font-bold text-sm flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  Data Absensi Siswa Akan Terdampak!
                </p>
                <p className="text-red-600 text-xs leading-relaxed">
                  Terdapat <strong>{absensiTerimpakCount} sesi pertemuan</strong> yang sudah
                  memiliki rekaman absensi siswa, namun pertemuannya akan dihapus dari RPP ini.
                  Absensi pada pertemuan tersebut <strong>akan kehilangan referensi</strong> ke detail RPP.
                </p>
                <p className="text-red-600 text-xs font-semibold">
                  Disarankan untuk tidak menghapus pertemuan yang sudah memiliki data absensi.
                  Pertimbangkan untuk menonaktifkan atau mengosongkan materinya saja.
                </p>
              </div>
            )}

            <p>Apakah Anda yakin ingin melanjutkan?</p>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleVerifikasiResetCancel}
              disabled={isSubmitting}
              className="rounded-xl border-slate-200"
            >
              Batal, Jangan Simpan
            </Button>
            <Button
              type="button"
              onClick={handleVerifikasiResetConfirm}
              disabled={isSubmitting}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ShieldAlert className="w-4 h-4 mr-2" />
              )}
              {absensiTerimpakCount > 0 ? "Saya Mengerti, Simpan Tetap" : "Ya, Simpan & Reset Verifikasi"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
