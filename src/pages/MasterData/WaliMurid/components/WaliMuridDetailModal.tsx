import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { User, Copy, Check, Loader2, Pencil, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { WALI_MURID } from "../../../../types/database";

interface WaliMuridDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWali: WALI_MURID | null;
  canUpdate: boolean;
  canDelete: boolean;
  userRole: string | null;
  getUserById: (id: string) => Promise<any>;
  onEdit: (wali: WALI_MURID) => void;
  onDelete: (wali: WALI_MURID) => void;
  onOpenResetModal: () => void;
  onCreateAccount?: () => void;
  isCreatingAccount?: boolean;
}

export default function WaliMuridDetailModal({
  isOpen,
  onClose,
  activeWali,
  canUpdate,
  canDelete,
  userRole,
  getUserById,
  onEdit,
  onDelete,
  onOpenResetModal,
  onCreateAccount,
  isCreatingAccount = false
}: WaliMuridDetailModalProps) {
  const [copiedUserId, setCopiedUserId] = useState(false);

  const userAccountQuery = useQuery({
    queryKey: ['userAccount', activeWali?.user_id],
    queryFn: () => getUserById(activeWali!.user_id!),
    enabled: !!activeWali?.user_id && isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Wali Murid</DialogTitle>
        </DialogHeader>
        {activeWali && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Nama Wali Utama</span>
                <span className="font-semibold text-gray-800">{activeWali.nama_wali || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">NIK Wali Utama</span>
                <span className="font-medium text-gray-800">{activeWali.nik_wali || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">No HP Wali Utama</span>
                <span className="font-medium text-gray-800">{activeWali.no_hp_wali || "—"}</span>
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Nama Ayah</span>
                <span className="font-medium text-gray-800">{activeWali.nama_ayah || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">NIK Ayah</span>
                <span className="font-medium text-gray-800">{activeWali.nik_ayah || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">No HP Ayah</span>
                <span className="font-medium text-gray-800">{activeWali.no_hp_ayah || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Pekerjaan Ayah</span>
                <span className="font-medium text-gray-800">{activeWali.pekerjaan_ayah || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Pendidikan Ayah</span>
                <span className="font-medium text-gray-800">{activeWali.pendidikan_ayah || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Penghasilan Ayah</span>
                <span className="font-medium text-gray-800">{activeWali.penghasilan_ayah || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Status Ayah</span>
                <span className="font-medium text-gray-800">{activeWali.status_ayah || "—"}</span>
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Nama Ibu</span>
                <span className="font-semibold text-gray-800">{activeWali.nama_ibu || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">NIK Ibu</span>
                <span className="font-medium text-gray-800">{activeWali.nik_ibu || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">No HP Ibu</span>
                <span className="font-medium text-gray-800">{activeWali.no_hp_ibu || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Pekerjaan Ibu</span>
                <span className="font-medium text-gray-800">{activeWali.pekerjaan_ibu || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Pendidikan Ibu</span>
                <span className="font-medium text-gray-800">{activeWali.pendidikan_ibu || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Penghasilan Ibu</span>
                <span className="font-medium text-gray-800">{activeWali.penghasilan_ibu || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Status Ibu</span>
                <span className="font-medium text-gray-800">{activeWali.status_ibu || "—"}</span>
              </div>

              <div className="flex justify-between items-start pb-2 gap-4">
                <span className="text-gray-500 font-medium shrink-0">Alamat</span>
                <span className="font-medium text-gray-800 text-right wrap-break-word">{activeWali.alamat || "—"}</span>
              </div>
            </div>

            {activeWali.user_id ? (
              <div className="bg-gray-50 p-4 rounded-xl border mt-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-800">Informasi Akun</span>
                </div>
                {userAccountQuery.isLoading ? (
                  <div className="flex justify-center items-center py-2">
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  </div>
                ) : userAccountQuery.isError ? (
                  <div className="text-red-500 text-xs">Gagal memuat informasi akun</div>
                ) : userAccountQuery.data ? (
                  <>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-gray-500 font-medium">NIK</span>
                      <span className="font-medium text-gray-800">{userAccountQuery.data.username}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-gray-500 font-medium">Password Default</span>
                      <span className="font-medium text-gray-800">password123</span>
                    </div>
                    <div className="flex justify-between items-center pb-2">
                      <span className="text-gray-500 font-medium">ID User</span>
                      <button
                        onClick={() => {
                          if (userAccountQuery.data?.user_id) {
                            navigator.clipboard.writeText(userAccountQuery.data.user_id);
                            setCopiedUserId(true);
                            setTimeout(() => setCopiedUserId(false), 2000);
                          }
                        }}
                        title={userAccountQuery.data?.user_id || ""}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${copiedUserId
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                          }`}
                      >
                        {copiedUserId ? (
                          <><Check className="w-3.5 h-3.5" /> Tersalin!</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" /> Salin ID</>
                        )}
                      </button>
                    </div>
                    {userRole === 'Super Admin' && (
                      <div className="pt-3 border-t mt-1">
                        <button
                          onClick={onOpenResetModal}
                          className="w-full py-2 text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200 transition-colors flex justify-center items-center gap-2"
                        >
                          Reset Password Akun
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500 text-xs">Informasi akun tidak ditemukan</div>
                )}
              </div>
            ) : onCreateAccount ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 mt-4">
                <div className="flex items-start gap-2.5">
                  <User className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900">Belum Memiliki Akun Login</h4>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                      Wali murid ini belum memiliki akun login. Anda dapat membuatkan akun login baru (NIK: <strong>{activeWali.nik_wali || activeWali.nik_ayah || "—"}</strong>, Password: <strong>password123</strong>) dengan role Wali Murid.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCreateAccount}
                  disabled={isCreatingAccount}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-2xs disabled:opacity-50"
                >
                  {isCreatingAccount ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  Buat Akun Login Wali Murid
                </button>
              </div>
            ) : (
              <div className="bg-orange-50 p-4 rounded-xl border mt-4 text-center">
                <span className="text-orange-700 text-sm">Akun login belum dibuat untuk wali murid ini.</span>
              </div>
            )}

            <DialogFooter className="mt-6 sm:justify-between gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 w-full sm:w-auto text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Tutup</button>
              {(canUpdate || canDelete) && (
                <div className="flex gap-2 w-full sm:w-auto">
                  {canUpdate && (
                    <button
                      onClick={() => {
                        onClose();
                        onEdit(activeWali);
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
                        onDelete(activeWali);
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
        )}
      </DialogContent>
    </Dialog>
  );
}
