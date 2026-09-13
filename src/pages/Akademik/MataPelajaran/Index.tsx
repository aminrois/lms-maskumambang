// src/pages/Akademik/MataPelajaran/Index.tsx
import React from "react";
import { BookOpen, Edit, Trash2, School } from "lucide-react";
import { DataTable } from "@/components/custom/data-table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { usePermissions } from "@/hooks/usePermissions";
import { useMataPelajaran } from "./hooks/useMataPelajaran";
import type { MataPelajaranResponse } from "./hooks/useMataPelajaran";
import { MataPelajaranHeader } from "./components/MataPelajaranHeader";
import { MataPelajaranFilters } from "./components/MataPelajaranFilters";
import { MataPelajaranDeleteModal } from "./components/MataPelajaranDeleteModal";
import { MataPelajaranDialog } from "./MataPelajaranDialog";

const ActionCell = ({
  row,
  onDelete,
  onEdit,
  canUpdate,
  canDelete,
}: {
  row: any;
  onDelete: (mapel: MataPelajaranResponse) => void;
  onEdit: (id: number) => void;
  canUpdate: boolean;
  canDelete: boolean;
}) => {
  return (
    <div className="flex justify-end items-center gap-1.5">
      {canUpdate && (
        <button
          onClick={() => onEdit(row.original.mapel_id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs"
          title="Edit Mata Pelajaran"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
      )}
      {canDelete && (
        <button
          onClick={() => onDelete(row.original)}
          className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shadow-2xs"
          title="Hapus Mata Pelajaran"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const MataPelajaranIndex: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePermissions('mata_pelajaran');
  const {
    userLembagaId,
    userRole,
    filterLembaga,
    activeFilter,
    setActiveFilter,
    dialogOpen,
    setDialogOpen,
    editId,
    setEditId,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    mapelToDelete,
    setMapelToDelete,
    handleDelete,
    filteredData,
    fetchMapel,
    isLoading,
  } = useMataPelajaran();

  const columns: ColumnDef<MataPelajaranResponse>[] = [
    {
      header: "NO",
      cell: ({ row }) => <span className="text-slate-500 font-medium pl-4">{row.index + 1}</span>,
      id: "index",
    },
    {
      accessorKey: "nama_mapel",
      header: "NAMA MATA PELAJARAN",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 font-semibold text-[#2B3674]">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <BookOpen size={18} />
          </div>
          {row.original.nama_mapel}
        </div>
      ),
    },
    {
      accessorKey: "lembaga.singkatan",
      header: () => <div className="text-center">LEMBAGA</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
            {row.original.lembaga?.singkatan || "—"}
          </span>
        </div>
      ),
    },

    {
      id: "kelas",
      header: "KELAS",
      cell: ({ row }) => {
        const kelasList = row.original.kelas_mapel
          ?.map((item) => item.kelas)
          .filter((k): k is { kelas_id: number; nama_kelas: string } => Boolean(k && k.nama_kelas)) || [];

        if (kelasList.length === 0) {
          return (
            <div className="text-left">
              <span className="text-slate-400 text-sm font-medium">Belum ada kelas</span>
            </div>
          );
        }

        return (
          <div className="flex flex-wrap gap-1.5">
            {kelasList.map((k) => (
              <span
                key={k.kelas_id}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100"
              >
                <School className="w-3 h-3" />
                {k.nama_kelas}
              </span>
            ))}
          </div>
        );
      },
    },
    ...((canUpdate || canDelete) ? [{
      id: "actions",
      header: "",
      cell: ({ row }: { row: any }) => {
        const canUpdateThis = canUpdate && (userRole === 'Super Admin' || row.original.lembaga_id === userLembagaId);
        const canDeleteThis = canDelete && (userRole === 'Super Admin' || row.original.lembaga_id === userLembagaId);
        
        if (!canUpdateThis && !canDeleteThis) return null;

        return (
          <div className="text-right pr-4">
            <ActionCell 
              row={row} 
              onDelete={(mapel) => { setMapelToDelete(mapel); setIsDeleteModalOpen(true); }} 
              onEdit={(id) => { setEditId(id); setDialogOpen(true); }} 
              canUpdate={canUpdateThis} 
              canDelete={canDeleteThis} 
            />
          </div>
        );
      },
    }] : [])
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 bg-[#F4F7FE] min-h-dvh font-sans">
      {/* HEADER */}
      <MataPelajaranHeader
        canCreate={canCreate}
        onAddClick={() => {
          setEditId(null);
          setDialogOpen(true);
        }}
      />

      {/* FILTER BUTTONS */}
      <MataPelajaranFilters
        filterLembaga={filterLembaga}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* DATA TABLE */}
      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        renderMobileCard={(mapel) => {
          const canUpdateThis = canUpdate && (userRole === 'Super Admin' || mapel.lembaga_id === userLembagaId);
          const canDeleteThis = canDelete && (userRole === 'Super Admin' || mapel.lembaga_id === userLembagaId);
          const kelasList = mapel.kelas_mapel
            ?.map((item) => item.kelas)
            .filter((k): k is { kelas_id: number; nama_kelas: string } => Boolean(k && k.nama_kelas)) || [];

          return (
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#2B3674] truncate text-base">{mapel.nama_mapel}</h3>
                    <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-100 uppercase mt-0.5">
                      {mapel.lembaga?.singkatan || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">
                  Daftar Kelas
                </span>
                {kelasList.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {kelasList.map((k) => (
                      <span
                        key={k.kelas_id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100"
                      >
                        <School className="w-3 h-3" />
                        {k.nama_kelas}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs font-medium">Belum ada kelas</span>
                )}
              </div>

              {(canUpdateThis || canDeleteThis) && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  {canUpdateThis && (
                    <button
                      onClick={() => { setEditId(mapel.mapel_id); setDialogOpen(true); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  )}
                  {canDeleteThis && (
                    <button
                      onClick={() => { setMapelToDelete(mapel); setIsDeleteModalOpen(true); }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        }}
      />

      {/* DIALOG FORM MODAL */}
      <MataPelajaranDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mapelId={editId}
        onSuccess={fetchMapel}
      />

      {/* DELETE CONFIRM MODAL */}
      <MataPelajaranDeleteModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        mapelToDelete={mapelToDelete}
        onConfirm={() => {
          if (mapelToDelete) {
            handleDelete(mapelToDelete.mapel_id);
          }
          setIsDeleteModalOpen(false);
          setMapelToDelete(null);
        }}
      />
    </div>
  );
};

export default MataPelajaranIndex;
