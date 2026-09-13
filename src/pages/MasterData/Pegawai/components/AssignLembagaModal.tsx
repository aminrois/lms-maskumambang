import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restClient } from "@/lib/api/axios";
import { getPegawaiLembaga, updatePegawaiLembaga } from "@/lib/api/services/masterService";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { toast } from "sonner";
interface AssignLembagaModalProps {
  isOpen: boolean;
  onClose: () => void;
  pegawaiId: number | null;
  pegawaiName: string;
}

export default function AssignLembagaModal({ isOpen, onClose, pegawaiId, pegawaiName }: AssignLembagaModalProps) {
  const queryClient = useQueryClient();
  const [selectedLembagas, setSelectedLembagas] = useState<number[]>([]);

  // Realtime: auto-refresh saat ada perubahan pada tabel pegawai_lembaga atau lembaga
  useRealtimeSync([
    { table: 'pegawai_lembaga', queryKeys: [['master-data', 'pegawai-lembaga']] },
    { table: 'lembaga',         queryKeys: [['master-data', 'lembaga-options']] },
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

  // Fetch currently assigned lembagas
  const { data: assignedLembagas, isLoading: isLoadingAssigned } = useQuery({
    queryKey: ['master-data', 'pegawai-lembaga', pegawaiId],
    queryFn: () => getPegawaiLembaga(pegawaiId!),
    enabled: !!pegawaiId && isOpen,
  });

  useEffect(() => {
    if (assignedLembagas) {
      setSelectedLembagas(assignedLembagas.map((item: any) => item.lembaga_id));
    }
  }, [assignedLembagas, isOpen]);

  const updateMutation = useMutation({
    mutationFn: () => updatePegawaiLembaga(pegawaiId!, selectedLembagas),
    onSuccess: () => {
      toast.success("Aksi berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ['master-data', 'pegawai-lembaga', pegawaiId] });
      onClose();
    },
    onError: () => {
      toast.error("Penugasan lembaga gagal disimpan. Silakan coba lagi.");
    }
  });

  const handleToggle = (lembagaId: number) => {
    setSelectedLembagas(prev => 
      prev.includes(lembagaId) ? prev.filter(id => id !== lembagaId) : [...prev, lembagaId]
    );
  };

  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();
    if (pegawaiId) {
      updateMutation.mutate();
    }
  };

  const isLoading = isLoadingLembaga || isLoadingAssigned;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atur Penugasan Lembaga</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSimpan} className="space-y-4 mt-4">
          <div className="bg-gray-50 p-3 rounded-lg border text-sm text-gray-600 mb-4">
            Atur lembaga mana saja yang dapat diakses oleh pegawai <strong>{pegawaiName}</strong>.
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              {lembagas.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Belum ada data lembaga.</p>
              ) : (
                lembagas.map((l: any) => (
                  <label 
                    key={l.lembaga_id} 
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${selectedLembagas.includes(l.lembaga_id) ? 'border-blue-500 bg-blue-50/50' : 'hover:bg-gray-50'}`}
                  >
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-3"
                      checked={selectedLembagas.includes(l.lembaga_id)}
                      onChange={() => handleToggle(l.lembaga_id)}
                    />
                    <div>
                      <span className="text-sm font-bold text-gray-800 block">{l.nama_lembaga}</span>
                      {l.singkatan && <span className="text-xs font-medium text-gray-500 block">{l.singkatan}</span>}
                    </div>
                  </label>
                ))
              )}
            </div>
          )}

          <DialogFooter className="mt-6 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">Batal</button>
            <button type="submit" disabled={updateMutation.isPending || isLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2">
              {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Simpan Penugasan
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
