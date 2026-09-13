import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

const monthsIndo = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const daysOfWeek = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export interface KalendarProps {
  eventTypes: Record<string, { color: string; label: string; bgLight: string; textLight: string; borderLight: string; hexLight?: string }>;
  getEventsForDate: (date: Date) => string[];
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function Kalendar({ eventTypes, getEventsForDate, selectedDate, onDateSelect, currentMonth, onMonthChange }: KalendarProps) {
  const handlePrevMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const isSameDay = (d1: Date | null, d2: Date) => {
    if (!d1) return false;
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  };

  const today = new Date();

  const dynamicCalendarDays: { dateObj: Date; date: number; events?: string[]; isSelected?: boolean; isCurrentMonth?: boolean }[] = [];

  // Previous month dates
  for (let i = 0; i < firstDayOfMonth; i++) {
    const d = daysInPrevMonth - firstDayOfMonth + i + 1;
    const dateObj = new Date(year, month - 1, d);
    dynamicCalendarDays.push({
      dateObj,
      date: d,
      events: getEventsForDate(dateObj),
      isSelected: isSameDay(selectedDate, dateObj),
      isCurrentMonth: false
    });
  }

  // Current month dates
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    dynamicCalendarDays.push({
      dateObj,
      date: d,
      events: getEventsForDate(dateObj),
      isSelected: isSameDay(selectedDate, dateObj),
      isCurrentMonth: true
    });
  }

  // Next month dates
  const daysToFillAtEnd = (7 - (dynamicCalendarDays.length % 7)) % 7;
  for (let i = 1; i <= daysToFillAtEnd; i++) {
    const dateObj = new Date(year, month + 1, i);
    dynamicCalendarDays.push({
      dateObj,
      date: i,
      events: getEventsForDate(dateObj),
      isSelected: isSameDay(selectedDate, dateObj),
      isCurrentMonth: false
    });
  }

  return (
    <Card className="rounded-[20px] shadow-sm border-none lg:col-span-2">
      <CardContent className="p-6 sm:p-8">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="icon" className="rounded-full text-slate-600 hover:bg-slate-50" onClick={handlePrevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold text-slate-800">{`${monthsIndo[month]} ${year}`}</h2>
          <Button variant="ghost" size="icon" className="rounded-full text-slate-600 hover:bg-slate-50" onClick={handleNextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-6 gap-x-2 mb-8">
          {/* Days of week */}
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-slate-400 mb-2">
              {day}
            </div>
          ))}

          {/* Dates */}
          {dynamicCalendarDays.map((dayObj, index) => {
            const isTodayDate = isSameDay(today, dayObj.dateObj);
            const hasEvent = dayObj.events && dayObj.events.length > 0;
            const firstEvent = hasEvent ? dayObj.events![0] : null;
            const getEventInfo = (type: string) => {
              const norm = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
              return eventTypes[norm] || eventTypes[type] || {
                color: "bg-slate-500",
                label: type,
                bgLight: "bg-slate-100",
                textLight: "text-slate-600",
                borderLight: "border-slate-200",
                hexLight: "#f1f5f9"
              };
            };
            const firstEventInfo = firstEvent ? getEventInfo(firstEvent) : null;

            const isConnectedPrev = index % 7 !== 0 && hasEvent && dynamicCalendarDays[index - 1].events?.includes(firstEvent as string);
            const isConnectedNext = index % 7 !== 6 && hasEvent && dynamicCalendarDays[index + 1].events?.includes(firstEvent as string);

            let bgElement = null;
            if (hasEvent) {
              if (isConnectedPrev && isConnectedNext) {
                bgElement = (
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none z-0 -left-1 -right-1 sm:-left-2 sm:-right-2 lg:-left-3 lg:-right-3"
                    style={{ backgroundColor: firstEventInfo?.hexLight }}
                  />
                );
              } else if (!isConnectedPrev && isConnectedNext) {
                bgElement = (
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none z-0 left-1/2 -right-1 sm:-right-2 lg:-right-3"
                    style={{ backgroundColor: firstEventInfo?.hexLight }}
                  />
                );
              } else if (isConnectedPrev && !isConnectedNext) {
                bgElement = (
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none z-0 -left-1 sm:-left-2 lg:-left-3 right-1/2"
                    style={{ backgroundColor: firstEventInfo?.hexLight }}
                  />
                );
              }
            }

            return (
              <div key={index} className="flex flex-col items-center justify-start w-full relative">
                {bgElement}
                <div
                  onClick={() => {
                    if (dayObj.isSelected) {
                      onDateSelect(null);
                    } else {
                      onDateSelect(dayObj.dateObj);
                    }
                  }}
                  className={`flex flex-col items-center justify-center w-full max-w-17.5 aspect-square rounded-xl transition-colors cursor-pointer relative z-10 box-border ${dayObj.isSelected
                    ? "bg-[#243B7A] text-white shadow-md font-medium text-sm md:text-base border-none"
                    : isTodayDate
                      ? "bg-slate-900 text-white font-bold text-base md:text-[17px] shadow-sm hover:bg-slate-800 border-none"
                      : hasEvent
                        ? `${firstEventInfo?.bgLight} text-slate-800 font-medium text-sm md:text-base border-none`
                        : !dayObj.isCurrentMonth
                          ? "text-slate-300 text-sm md:text-base border-none"
                          : "text-slate-700 hover:bg-slate-50 text-sm md:text-base border-none"
                    }`}
                >
                  <span className={hasEvent ? "mb-1" : ""}>{dayObj.date}</span>
                  {hasEvent && (
                    <div className="absolute bottom-1.5 sm:bottom-2 flex gap-1 items-center justify-center">
                      {dayObj.events!.map((evt, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${getEventInfo(evt).color}`}></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-100">
          {Object.entries(eventTypes).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${value.color}`}></div>
              <span className="text-sm font-medium text-slate-500">{value.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
