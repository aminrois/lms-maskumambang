import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import type { ColumnDef, SortingState, ColumnFiltersState } from "@tanstack/react-table";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  renderMobileCard?: (row: TData) => React.ReactNode;
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Cari...",
  renderMobileCard,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="flex items-center relative max-w-sm">
          <Search className="absolute left-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="pl-9 rounded-xl bg-white border-gray-200"
          />
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        {/* Desktop View */}
        <div className={`overflow-x-auto ${renderMobileCard ? "hidden md:block" : ""}`}>
          <Table>
            <TableHeader className="bg-gray-50/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-gray-100">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="text-[#A3AED0] font-medium py-4 whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={`skeleton-${idx}`} className="border-gray-50">
                    {columns.map((_, colIdx) => (
                      <TableCell key={`skeleton-cell-${colIdx}`} className="py-4">
                        <div className="h-4 bg-gray-200 rounded-md animate-pulse w-3/4"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                    Tidak ada data ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        {renderMobileCard && (
          <div className="block md:hidden">
            {isLoading ? (
              <div className="flex flex-col p-4 space-y-4 bg-gray-50/30">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={`mobile-skeleton-${idx}`} className="bg-white border border-gray-100 rounded-xl p-4 shadow-2xs space-y-3">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3 mt-2"></div>
                  </div>
                ))}
              </div>
            ) : table.getRowModel().rows?.length ? (
              <div className="flex flex-col p-4 space-y-4 bg-gray-50/30">
                {table.getRowModel().rows.map((row) => (
                  <div key={row.id}>
                    {renderMobileCard(row.original)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-center text-gray-500">
                Tidak ada data ditemukan.
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-1">
        <div className="flex items-center gap-2.5 text-xs text-slate-600">
          <span className="text-slate-500 font-medium">Tampilkan:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
              table.setPageIndex(0);
            }}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
          >
            {[10, 15, 20, 25, 50, 100].map((val) => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
          <span className="text-slate-500 font-semibold">
            per halaman • Menampilkan {table.getFilteredRowModel().rows.length > 0 ? (table.getState().pagination.pageIndex * table.getState().pagination.pageSize) + 1 : 0}–{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} dari {table.getFilteredRowModel().rows.length} baris data
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-lg h-8 px-3 text-xs cursor-pointer"
          >
            Sebelumnya
          </Button>
          <span className="text-xs font-bold text-slate-700 px-2">
            {table.getFilteredRowModel().rows.length > 0 ? table.getState().pagination.pageIndex + 1 : 1} / {Math.max(1, table.getPageCount())}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-lg h-8 px-3 text-xs cursor-pointer"
          >
            Selanjutnya
          </Button>
        </div>
      </div>
    </div>
  );
}
