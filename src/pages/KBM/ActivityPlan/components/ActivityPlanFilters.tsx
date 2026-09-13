interface ActivityPlanFiltersProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function ActivityPlanFilters({ activeTab, setActiveTab }: ActivityPlanFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {["Semua", "Akademik", "Acara", "Libur", "Lainnya"].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
            activeTab === tab ? "bg-[#1E3A8A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
