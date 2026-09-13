import { useState } from "react";
import { Loader2, Trash2, Shield, Plus, AlertTriangle, RefreshCw, Building2, Unlink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restClient } from "../../../../lib/api/axios";
import { getRoles, createUserRole, deleteUserRole } from "../../../../lib/api/services/userService";
import { updateLembaga } from "../../../../lib/api/services/masterService";
import { toast } from "sonner";
import { usePermissions } from "../../../../hooks/usePermissions";
import { useRealtimeSync } from "../../../../hooks/useRealtimeSync";

interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  pegawaiId: number | null;
  pegawaiName: string;
}

export default function AssignRoleModal({ isOpen, onClose, userId, pegawaiId, pegawaiName }: AssignRoleModalProps) {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<number | "">("");
  const [selectedLembagaId, setSelectedLembagaId] = useState<number | "">("");
  const [isAdding, setIsAdding] = useState(false);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<{ id: number; name: string } | null>(null);

  const { canCreate, canDelete } = usePermissions('user_role');

  // Realtime: auto-refresh saat ada perubahan pada tabel user_role, role, atau lembaga
  useRealtimeSync([
    { table: 'user_role', queryKeys: [['user-roles'], ['user-roles-relation']] },
    { table: 'role',      queryKeys: [['roles']] },
    { table: 'lembaga',   queryKeys: [['master-data', 'lembaga-options']] },
  ]);

  // Fetch all lembagas
  const { data: lembagas = [], isLoading: isLoadingLembaga } = useQuery({
    queryKey: ['master-data', 'lembaga-options'],
    queryFn: async () => {
      const response = await restClient.get('/lembaga', {
        params: { select: 'lembaga_id,nama_lembaga,singkatan', order: 'lembaga_id.asc' }
      });
      return response.data || [];
    }
  });

  // Fetch all roles
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => getRoles()
  });

  // Fetch currently assigned user role
  const { data: assignedRoles, isLoading: isLoadingAssigned } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      // Kita fetch juga dengan relation agar dapat nama role
      const response = await restClient.get(`/user_role?user_id=eq.${userId}&select=*,role(nama_role)`);
      return response.data || [];
    },
    enabled: !!userId && isOpen,
  });

  // Fetch pegawai_lembaga untuk cek akses lembaga yang masih tertaut
  const { data: pegawaiLembagaList = [], refetch: refetchPegawaiLembaga } = useQuery({
    queryKey: ['pegawai-lembaga', pegawaiId],
    queryFn: async () => {
      const response = await restClient.get('/pegawai_lembaga', {
        params: { pegawai_id: `eq.${pegawaiId}`, select: 'lembaga_id' }
      });
      return (response.data || []).map((item: any) => item.lembaga_id) as number[];
    },
    enabled: !!pegawaiId && isOpen,
  });

  // Lembaga yang masih tertaut di pegawai_lembaga tapi TIDAK ada role aktif di sana
  const orphanedLembagaIds = pegawaiLembagaList.filter((lid: number) => {
    const hasRole = (assignedRoles || []).some((ar: any) => ar.lembaga_id === lid);
    return !hasRole;
  });
  const orphanedLembagas = orphanedLembagaIds
    .map((lid: number) => lembagas.find((l: any) => l.lembaga_id === lid))
    .filter(Boolean);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !selectedRoleId) {
        throw new Error("Pilih role terlebih dahulu");
      }

      const selectedRole = roles.find((r: any) => r.role_id === Number(selectedRoleId));
      const roleName = selectedRole?.nama_role.toLowerCase() || "";
      const requiresLembaga = !['super admin', 'direktur'].includes(roleName);

      if (requiresLembaga && !selectedLembagaId) {
        throw new Error("Lembaga wajib dipilih untuk role ini.");
      }

      // Check if user already has this role (with same lembaga_id or both null)
      const isDuplicate = assignedRoles?.some((ar: any) => 
        ar.role_id === Number(selectedRoleId) && 
        (ar.lembaga_id === (selectedLembagaId ? Number(selectedLembagaId) : null))
      );
      
      if (isDuplicate) {
        throw new Error("Pegawai sudah memiliki role ini untuk lembaga tersebut.");
      }

      const payload: any = {
        user_id: userId,
        role_id: Number(selectedRoleId),
      };

      if (selectedLembagaId) {
        payload.lembaga_id = Number(selectedLembagaId);
      } else {
        payload.lembaga_id = null;
      }

      // Create new role
      await createUserRole(payload);

      // Automatically assign to lembaga if applicable
      if (selectedLembagaId && pegawaiId) {
        try {
          await restClient.post('/pegawai_lembaga', {
            pegawai_id: Number(pegawaiId),
            lembaga_id: Number(selectedLembagaId)
          }, {
            headers: { 'Prefer': 'resolution=ignore-duplicates' }
          });
        } catch (error: any) {
          // Abaikan error conflict (data sudah ada), lanjutkan proses
          const isConflict = error.response?.status === 409 || error.response?.data?.code === '23505';
          if (!isConflict) {
            console.error("Gagal menambahkan ke pegawai_lembaga", error);
          }
        }

        const roleInfo = roles.find((r: any) => r.role_id === Number(selectedRoleId));
        if (roleInfo) {
          const roleName = roleInfo.nama_role.toLowerCase();
          if (roleName.includes("kepala") || roleName.includes("kurikulum")) {
            const payloadLembaga: any = {};
            if (roleName.includes("kepala")) payloadLembaga.kepala_sekolah_id = Number(pegawaiId);
            if (roleName.includes("kurikulum")) payloadLembaga.kurikulum_id = Number(pegawaiId);
            
            await updateLembaga(Number(selectedLembagaId), payloadLembaga).catch(() => {});
          }
        }
      }
    },
    onSuccess: () => {
      toast.success("Role berhasil ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ['user-roles', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-roles-relation'] });
      setIsAdding(false);
      setSelectedRoleId("");
      setSelectedLembagaId("");
    },
    onError: (error: any) => {
      const errorMsg = error?.message || "";
      // Cek apakah error adalah duplikat role
      if (errorMsg.includes("sudah memiliki role")) {
        toast.error("Role ini sudah ditambahkan untuk lembaga yang dipilih.");
      } else if (errorMsg.includes("Lembaga wajib")) {
        toast.error(errorMsg);
      } else {
        toast.error("Role gagal ditambahkan. Silakan coba lagi.");
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (userRoleId: number) => {
      // 1. Ambil detail role yang akan dihapus sebelum didelete
      const roleDetail = assignedRoles?.find((ar: any) => ar.user_role_id === userRoleId);

      // 2. Hapus role dari user_role
      await deleteUserRole(userRoleId);

      if (roleDetail) {
        const { lembaga_id: roleLembagaId, role_id: roleId } = roleDetail;

        // 3. Jika role terikat ke lembaga tertentu, cek apakah pegawai masih punya role lain di lembaga yang sama
        if (roleLembagaId && pegawaiId) {
          try {
            const remainingRoles = await restClient.get('/user_role', {
              params: {
                user_id: `eq.${userId}`,
                lembaga_id: `eq.${roleLembagaId}`
              }
            });
            const stillHasRole = (remainingRoles.data || []).length > 0;

            // Jika tidak ada role lain di lembaga ini, hapus juga dari pegawai_lembaga
            if (!stillHasRole) {
              await restClient.delete(
                `/pegawai_lembaga?pegawai_id=eq.${pegawaiId}&lembaga_id=eq.${roleLembagaId}`
              );
            }
          } catch (e) {
            console.error("Gagal memeriksa/membersihkan pegawai_lembaga:", e);
          }
        }

        // 4. Jika role adalah Kepala Sekolah atau Waka Kurikulum, reset kolom di tabel lembaga
        if (roleLembagaId && pegawaiId) {
          try {
            const roleInfo = roles.find((r: any) => r.role_id === roleId);
            const roleName = roleInfo?.nama_role?.toLowerCase() || "";
            const payloadLembaga: any = {};
            if (roleName.includes("kepala")) payloadLembaga.kepala_sekolah_id = null;
            if (roleName.includes("kurikulum")) payloadLembaga.kurikulum_id = null;

            if (Object.keys(payloadLembaga).length > 0) {
              await updateLembaga(roleLembagaId, payloadLembaga).catch(() => {});
            }
          } catch (e) {
            console.error("Gagal mereset pejabat lembaga:", e);
          }
        }
      }
    },
    onSuccess: () => {
      toast.success("Role berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ['user-roles', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-roles-relation'] });
      queryClient.invalidateQueries({ queryKey: ['master-data', 'pegawai-all'] });
      queryClient.invalidateQueries({ queryKey: ['master-data', 'lembaga'] });
    },
    onError: () => {
      toast.error("Role gagal dihapus. Silakan coba lagi.");
    }
  });

  // Mutation: hapus akses lembaga orphan secara manual
  const removeLembagaAccessMutation = useMutation({
    mutationFn: async (lembagaId: number) => {
      await restClient.delete(
        `/pegawai_lembaga?pegawai_id=eq.${pegawaiId}&lembaga_id=eq.${lembagaId}`
      );
      // Reset pejabat lembaga jika pegawai ini tercatat sebagai kepsek/wakaur
      await updateLembaga(lembagaId, {
        kepala_sekolah_id: null,
        kurikulum_id: null
      }).catch(() => {});
    },
    onSuccess: () => {
      toast.success("Akses lembaga berhasil dihapus!");
      refetchPegawaiLembaga();
      queryClient.invalidateQueries({ queryKey: ['master-data', 'pegawai-all'] });
      queryClient.invalidateQueries({ queryKey: ['master-data', 'lembaga'] });
    },
    onError: () => {
      toast.error("Gagal menghapus akses lembaga. Silakan coba lagi.");
    }
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const isLoading = isLoadingLembaga || isLoadingRoles || isLoadingAssigned;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Atur Akses Akun untuk {pegawaiName}</DialogTitle>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-500">Memuat data...</p>
            </div>
          ) : (
            <div className="mt-2 flex flex-col space-y-4">
              <div className="border rounded-md overflow-hidden bg-slate-50">
                <div className="bg-slate-100 px-4 py-2 border-b flex justify-between items-center">
                  <span>Daftar Role</span>
                  {canCreate && (
                    <button 
                      onClick={() => setIsAdding(!isAdding)}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Tambah
                    </button>
                  )}
                </div>
                
                <ul className="divide-y max-h-48 overflow-y-auto">
                  {assignedRoles && assignedRoles.length > 0 ? (
                    assignedRoles.map((ar: any) => {
                      const lembagaInfo = lembagas.find((l: any) => l.lembaga_id === ar.lembaga_id);
                      return (
                        <li key={ar.user_role_id} className="p-3 text-sm flex justify-between items-center bg-white hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex justify-center items-center">
                              <Shield className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold">{ar.role?.nama_role || "Role Tidak Diketahui"}</p>
                              <p className="text-xs text-slate-500">
                                {lembagaInfo ? lembagaInfo.nama_lembaga : "Global (Semua Lembaga)"}
                              </p>
                            </div>
                          </div>
                          {canDelete && (
                            <button 
                              onClick={() => {
                                setRoleToDelete({
                                  id: ar.user_role_id,
                                  name: ar.role?.nama_role || "Role"
                                });
                                setIsDeleteConfirmOpen(true);
                              }}
                              disabled={deleteMutation.isPending}
                              className="text-red-500 p-2 hover:bg-red-50 rounded"
                              title="Hapus Role"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </li>
                      );
                    })
                  ) : (
                    <li className="p-4 text-center text-sm text-slate-500">Belum ada role yang ditugaskan.</li>
                  )}
                </ul>
              </div>

              {/* Section: Akses Lembaga Orphan */}
              {orphanedLembagas.length > 0 && (
                <div className="border border-amber-200 rounded-md overflow-hidden bg-amber-50">
                  <div className="bg-amber-100 px-4 py-2 border-b border-amber-200 flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-amber-800">
                      <Unlink className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">Akses Lembaga Tanpa Role</span>
                    </div>
                    <span className="text-xs text-amber-600">Klik hapus untuk mencabut akses</span>
                  </div>
                  <ul className="divide-y divide-amber-100">
                    {orphanedLembagas.map((lembaga: any) => (
                      <li key={lembaga.lembaga_id} className="px-4 py-2.5 text-sm flex justify-between items-center bg-white hover:bg-amber-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex justify-center items-center">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">{lembaga.nama_lembaga}</p>
                            {lembaga.singkatan && (
                              <p className="text-xs text-slate-400">{lembaga.singkatan}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeLembagaAccessMutation.mutate(lembaga.lembaga_id)}
                          disabled={removeLembagaAccessMutation.isPending}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 flex items-center gap-1 transition-colors disabled:opacity-50"
                          title="Hapus akses ke lembaga ini"
                        >
                          {removeLembagaAccessMutation.isPending
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Trash2 className="w-3 h-3" />
                          }
                          Hapus Akses
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isAdding && (
                <form onSubmit={handleAdd} className="space-y-4 p-4 border rounded-md bg-white">
                  <h4 className="text-sm font-semibold border-b pb-2">Tambah Role Baru</h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role <span className="text-red-500">*</span></label>
                    <select 
                      required
                      value={selectedRoleId} 
                      onChange={(e) => {
                        setSelectedRoleId(e.target.value === "" ? "" : Number(e.target.value));
                        setSelectedLembagaId("");
                      }}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">-- Pilih Role --</option>
                      {roles.filter((role: any) => role.nama_role.toLowerCase() !== 'wali murid').map((role: any) => (
                        <option key={role.role_id} value={role.role_id}>{role.nama_role}</option>
                      ))}
                    </select>
                  </div>
  
                  {selectedRoleId !== "" && (() => {
                    const selectedRole = roles.find((r: any) => r.role_id === selectedRoleId);
                    const roleName = selectedRole?.nama_role.toLowerCase() || "";
                    const showLembaga = !['super admin', 'direktur'].includes(roleName);
                    
                    if (!showLembaga) return null;
  
                    return (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Lembaga <span className="text-red-500">*</span></label>
                        <select 
                          required
                          value={selectedLembagaId} 
                          onChange={(e) => setSelectedLembagaId(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                        >
                          <option value="">-- Pilih Lembaga --</option>
                          {lembagas.map((lembaga: any) => (
                            <option key={lembaga.lembaga_id} value={lembaga.lembaga_id}>
                              {lembaga.nama_lembaga} {lembaga.singkatan ? `(${lembaga.singkatan})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
  
                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsAdding(false)} 
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      disabled={saveMutation.isPending || !selectedRoleId} 
                      className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2"
                    >
                      {saveMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                      Simpan
                    </button>
                  </div>
                </form>
              )}
  
              <DialogFooter className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    refetchPegawaiLembaga();
                    queryClient.invalidateQueries({ queryKey: ['user-roles', userId] });
                  }}
                  className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1.5"
                  title="Sinkronisasi ulang data akses lembaga"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sinkronisasi
                </button>
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="px-4 py-2 flex-1 text-sm font-medium text-gray-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                >
                  Tutup
                </button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Hapus Role */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 text-base font-bold">
              <AlertTriangle className="w-5 h-5" />
              Hapus Role Pegawai
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-700">
            Apakah Anda yakin ingin menghapus role <span className="font-bold">{roleToDelete?.name}</span> dari pegawai <span className="font-bold">{pegawaiName}</span>?
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsDeleteConfirmOpen(false);
                setRoleToDelete(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                if (roleToDelete) {
                  deleteMutation.mutate(roleToDelete.id);
                  setIsDeleteConfirmOpen(false);
                  setRoleToDelete(null);
                }
              }}
              disabled={deleteMutation.isPending}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center gap-1.5"
            >
              {deleteMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Ya, Hapus
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
