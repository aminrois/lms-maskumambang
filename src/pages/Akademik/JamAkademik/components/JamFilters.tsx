import React from "react";

interface JamFiltersProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const JamFilters: React.FC<JamFiltersProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`py-2.5 px-5 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === tab
              ? "border-blue-900 text-blue-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
