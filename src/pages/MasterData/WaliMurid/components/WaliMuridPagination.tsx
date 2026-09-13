interface WaliMuridPaginationProps {
  totalData: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
}

export default function WaliMuridPagination({
  totalData,
  currentPage,
  itemsPerPage,
  totalPages,
  setCurrentPage,
  setItemsPerPage
}: WaliMuridPaginationProps) {
  if (totalData === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border shadow-sm gap-4 mt-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Tampilkan</span>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 block p-1.5"
        >
          {[10, 20, 30, 40, 50].map((val) => (
            <option key={val} value={val}>{val}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          dari {totalData} data
        </span>
      </div>

      {totalPages > 1 && (
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Sebelumnya
          </button>
          <div className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg">
            {currentPage} / {totalPages}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Selanjutnya
          </button>
        </div>
      )}
    </div>
  );
}
