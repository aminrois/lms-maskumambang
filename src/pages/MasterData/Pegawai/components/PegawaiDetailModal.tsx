import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { Loader2, User, Copy, Check, Pencil, Trash2 } from "lucide-react";
import type { PegawaiUI } from "../hooks/usePegawaiData";

interface PegawaiDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPegawai: PegawaiUI | null;
  canUpdate: boolean;
  canDelete: boolean;
  canReadRole: boolean;
  userRole: string | null;
  userAccountQuery: { isLoading?: boolean; isError?: boolean; data?: { username: string; user_id: string } };
  resetPasswordMutation: { isPending?: boolean };
  onEdit: (pegawai: PegawaiUI) => void;
  onDelete: (pegawai: PegawaiUI) => void;
  onResetPassword: () => void;
  onAssignRole: () => void;
  onCreateAccount?: () => void;
  isCreatingAccount?: boolean;
}

export default function PegawaiDetailModal({
  isOpen,
  onClose,
  selectedPegawai,
  canUpdate,
  canDelete,
  canReadRole,
  userRole,
  userAccountQuery,
  resetPasswordMutation,
  onEdit,
  onDelete,
  onResetPassword,
  onAssignRole,
  onCreateAccount,
  isCreatingAccount = false
}: PegawaiDetailModalProps) {
  const [copiedUserId, setCopiedUserId] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Pegawai</DialogTitle>
        </DialogHeader>
        {selectedPegawai && (
          <div className="space-y-4 mt-2 text-sm">
            <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Nama Lengkap</span>
                <span className="font-semibold text-gray-800">{selectedPegawai.nama}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">NIG</span>
                <span className="font-medium text-gray-800">{selectedPegawai.nig}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">NIP</span>
                <span className="font-medium text-gray-800">{selectedPegawai.nip}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">NIK</span>
                <span className="font-medium text-gray-800">{selectedPegawai.raw.nik || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Jenis Kelamin</span>
                <span className="font-medium text-gray-800">{selectedPegawai.jenisKelamin}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Tempat Lahir</span>
                <span className="font-medium text-gray-800">{selectedPegawai.raw.tempat_lahir || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Tanggal Lahir</span>
                <span className="font-medium text-gray-800">
                  {selectedPegawai.raw.tanggal_lahir ? new Date(selectedPegawai.raw.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Tahun Lahir</span>
                <span className="font-medium text-gray-800">
                  {selectedPegawai.raw.tanggal_lahir ? new Date(selectedPegawai.raw.tanggal_lahir).getFullYear() : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Umur</span>
                <span className="font-medium text-gray-800">
                  {(() => {
                    if (!selectedPegawai.raw.tanggal_lahir) return "—";
                    const birth = new Date(selectedPegawai.raw.tanggal_lahir);
                    if (isNaN(birth.getTime())) return "—";
                    const now = new Date();
                    let age = now.getFullYear() - birth.getFullYear();
                    const m = now.getMonth() - birth.getMonth();
                    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                    return age >= 0 ? `${age} tahun` : "—";
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-start border-b pb-2 gap-4">
                <span className="text-gray-500 font-medium shrink-0">Alamat</span>
                <span className="font-medium text-gray-800 text-right wrap-break-word">{selectedPegawai.raw.alamat || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">No HP</span>
                <span className="font-medium text-gray-800">{selectedPegawai.raw.no_hp || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Jabatan</span>
                <span className="font-medium text-gray-800">{selectedPegawai.jabatan}</span>
              </div>
              <div className="flex justify-between items-start border-b pb-2 gap-4">
                <span className="text-gray-500 font-medium shrink-0">Tugas Tambahan</span>
                <span className="font-medium text-gray-800 text-right wrap-break-word">{selectedPegawai.raw.tugas_tambahan || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Jumlah Anak (L)</span>
                <span className="font-medium text-gray-800">{selectedPegawai.raw.jumlah_anak_laki !== null && selectedPegawai.raw.jumlah_anak_laki !== undefined ? selectedPegawai.raw.jumlah_anak_laki : "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Jumlah Anak (P)</span>
                <span className="font-medium text-gray-800">{selectedPegawai.raw.jumlah_anak_perempuan !== null && selectedPegawai.raw.jumlah_anak_perempuan !== undefined ? selectedPegawai.raw.jumlah_anak_perempuan : "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Nama Ayah</span>
                <span className="font-medium text-gray-800">{selectedPegawai.raw.nama_ayah || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Nama Ibu</span>
                <span className="font-medium text-gray-800">{selectedPegawai.raw.nama_ibu || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Golongan Darah</span>
                <span className="font-medium text-gray-800">{selectedPegawai.raw.golongan_darah || "—"}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500 font-medium">Lembaga</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${selectedPegawai.lembagaList === "Global"
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}>
                  {selectedPegawai.lembagaList}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-gray-500 font-medium">Status</span>
                <span className={`font-semibold ${selectedPegawai.status === "Aktif" ? "text-green-600" : "text-red-600"}`}>
                  {selectedPegawai.status}
                </span>
              </div>
            </div>

            {canReadRole && !selectedPegawai.raw.user_id && onCreateAccount && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 mt-4">
                <div className="flex items-start gap-2.5">
                  <User className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900">Belum Memiliki Akun Login</h4>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                      Pegawai ini belum memiliki akun login. Anda dapat membuatkan akun login baru (NIG: <strong>{selectedPegawai.nig || "—"}</strong>, Password: <strong>password123</strong>) untuk mengatur role.
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
                  Buat Akun Login Pegawai
                </button>
              </div>
            )}

            {canReadRole && selectedPegawai.raw.user_id && (
              <div className="space-y-4 mt-4">
                <button
                  type="button"
                  onClick={onAssignRole}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors flex justify-center items-center gap-2 shadow-2xs"
                >
                  <User className="w-4 h-4" />
                  Atur Role Pengguna
                </button>

                <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
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
                        <span className="text-gray-500 font-medium">NIG</span>
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
                            onClick={onResetPassword}
                            disabled={resetPasswordMutation.isPending}
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
              </div>
            )}

            <DialogFooter className="mt-6 sm:justify-between gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 w-full sm:w-auto text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Tutup</button>
              {(canUpdate || canDelete) && (
                <div className="flex gap-2 w-full sm:w-auto">
                  {canUpdate && (
                    <button
                      onClick={() => onEdit(selectedPegawai)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onDelete(selectedPegawai)}
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
