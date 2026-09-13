import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, RotateCcw } from "lucide-react";
import { eventTypes } from "../hooks/useKalender";
import type { CalendarEvent, EventTypeKey } from "../hooks/useKalender";
import { KalenderFilters } from "./KalenderFilters";

interface KalenderSidebarProps {
  selectedDate: Date | null;
  setSelectedDate: (date: Date) => void;
  setCurrentMonthDate: (date: Date) => void;
  getFullEventsForDate: (date: Date) => CalendarEvent[];
  filteredEvents: CalendarEvent[];
  canDelete: boolean;
  deletePending: boolean;
  onDeleteClick: (event: CalendarEvent) => void;
  filterKategori: EventTypeKey | "Semua";
  setFilterKategori: (kategori: EventTypeKey | "Semua") => void;
  filterBulan: string;
  setFilterBulan: (bulan: string) => void;
}

export const KalenderSidebar: React.FC<KalenderSidebarProps> = ({
  selectedDate,
  setSelectedDate,
  setCurrentMonthDate,
  getFullEventsForDate,
  filteredEvents,
  canDelete,
  deletePending,
  onDeleteClick,
  filterKategori,
  setFilterKategori,
  filterBulan,
  setFilterBulan,
}) => {
  const isFilterActive = filterKategori !== "Semua" || filterBulan !== "Semua";

  const handleResetFilter = () => {
    setFilterKategori("Semua");
    setFilterBulan("Semua");
  };

  return (
    <div className="flex flex-col gap-6 lg:col-span-1">
      {/* Selected Date Details Card */}
      {selectedDate && (
        <Card className="rounded-[20px] shadow-sm border-none h-fit bg-white">
          <CardContent className="p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {selectedDate.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h3>
            {getFullEventsForDate(selectedDate).length === 0 ? (
              <p className="text-sm text-slate-400 mt-2">Tidak ada event</p>
            ) : (
              <div className="flex flex-col gap-3 mt-4">
                {getFullEventsForDate(selectedDate).map((evt, i) => {
                  const getEventTypeInfo = (type?: string) => {
                    if (!type) return eventTypes.Lainnya;
                    const norm = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
                    return (eventTypes as any)[norm] || (eventTypes as any)[type] || eventTypes.Lainnya;
                  };
                  const eventInfo = getEventTypeInfo(evt.type);
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-4 rounded-xl ${eventInfo.bgLight} ${eventInfo.textLight}`}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-[15px]">
                          {evt.nama_kegiatan}
                        </span>
                        <span className="text-sm mt-0.5 opacity-90">
                          {evt.typeText}
                        </span>
                      </div>
                      {canDelete && !evt.isActivityPlan && (
                        <button
                          onClick={() => onDeleteClick(evt)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 text-xs font-semibold transition-all disabled:opacity-30 shrink-0 cursor-pointer shadow-2xs"
                          disabled={deletePending}
                          title="Hapus Event"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events Card */}
      <Card className="rounded-[20px] shadow-sm border-none h-fit bg-white overflow-hidden">
        <CardHeader className="px-6 sm:px-8 pt-6 sm:pt-8 pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-semibold text-slate-800">
            Event Mendatang
          </CardTitle>
          {isFilterActive && (
            <button
              onClick={handleResetFilter}
              className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
              title="Reset Filter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </CardHeader>

        {/* Filter Box dalam Card Event Mendatang */}
        <div className="px-6 sm:px-8 pb-4">
          <KalenderFilters
            filterKategori={filterKategori}
            setFilterKategori={setFilterKategori}
            filterBulan={filterBulan}
            setFilterBulan={setFilterBulan}
            setCurrentMonthDate={setCurrentMonthDate}
          />
        </div>

        <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0">
          <div className="flex flex-col gap-5 max-h-92.5 overflow-y-auto pr-2 custom-scrollbar">
            {filteredEvents.length === 0 ? (
              <p className="text-sm text-slate-400">Tidak ada event mendatang</p>
            ) : (
              filteredEvents.map((event, index) => {
                const getEventTypeInfo = (type?: string) => {
                  if (!type) return eventTypes.Lainnya;
                  const norm = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
                  return (eventTypes as any)[norm] || (eventTypes as any)[type] || eventTypes.Lainnya;
                };
                const eventTypeInfo = getEventTypeInfo(event.type);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors"
                    onClick={() => {
                      setSelectedDate(event.date);
                      setCurrentMonthDate(
                        new Date(
                          event.date.getFullYear(),
                          event.date.getMonth(),
                          1,
                        ),
                      );
                    }}
                  >
                    <div
                      className={`shrink-0 w-11 h-11 flex items-center justify-center rounded-full text-base font-semibold ${eventTypeInfo.bgLight} ${eventTypeInfo.textLight}`}
                    >
                      {event.date.getDate()}
                    </div>
                    <div className="flex flex-col justify-center">
                      <h3 className="text-slate-800 font-medium text-base leading-tight mb-1">
                        {event.nama_kegiatan}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${eventTypeInfo.color}`}
                        ></div>
                        <span
                          className={`font-medium ${eventTypeInfo.textLight}`}
                        >
                          {event.typeText}
                        </span>
                        {event.extraText && (
                          <span className="text-slate-400">
                            {event.extraText}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
