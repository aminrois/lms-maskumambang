// mobile/src/components/ui/DateRangePickerModal.tsx
// Visual Calendar Date Range Picker — Kalender visual interaktif seperti kalender HP asli

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Calendar as CalendarIcon,
  CalendarDays,
} from "lucide-react-native";

interface DateRangePickerModalProps {
  visible: boolean;
  onClose: () => void;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onApply: (start: string, end: string) => void;
  title?: string;
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const formatDateId = (dateStr: string) => {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${parseInt(d, 10)} ${MONTH_NAMES[parseInt(m, 10) - 1].substring(0, 3)} ${y}`;
};

export const DateRangePickerModal: React.FC<DateRangePickerModalProps> = ({
  visible,
  onClose,
  startDate,
  endDate,
  onApply,
  title = "Pilih Rentang Tanggal",
}) => {
  const [activePickingMode, setActivePickingMode] = useState<"start" | "end">("start");

  // Selected dates in modal state
  const [selectedStart, setSelectedStart] = useState<string>(startDate);
  const [selectedEnd, setSelectedEnd] = useState<string>(endDate);

  // Calendar view navigation (month & year)
  const [viewYear, setViewYear] = useState<number>(() => {
    const s = startDate ? new Date(startDate) : new Date();
    return s.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    const s = startDate ? new Date(startDate) : new Date();
    return s.getMonth();
  });

  // Sync when visible opens
  React.useEffect(() => {
    if (visible) {
      setSelectedStart(startDate);
      setSelectedEnd(endDate);
      const d = startDate ? new Date(startDate) : new Date();
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setActivePickingMode("start");
    }
  }, [visible, startDate, endDate]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Generate days in the viewed month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days: ({ day: number; dateStr: string; isCurrentMonth: boolean } | null)[] = [];

    // Empty padding days before first day of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const monthStr = String(viewMonth + 1).padStart(2, "0");
      const dayStr = String(d).padStart(2, "0");
      const dateStr = `${viewYear}-${monthStr}-${dayStr}`;
      days.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const handleSelectDay = (dateStr: string) => {
    if (activePickingMode === "start") {
      setSelectedStart(dateStr);
      if (dateStr > selectedEnd) {
        setSelectedEnd(dateStr);
      }
      setActivePickingMode("end");
    } else {
      if (dateStr < selectedStart) {
        setSelectedStart(dateStr);
      } else {
        setSelectedEnd(dateStr);
      }
    }
  };

  const handleApplyPreset = (preset: string) => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    if (preset === "hari_ini") {
      setSelectedStart(today);
      setSelectedEnd(today);
    } else if (preset === "minggu_ini") {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 6);
      setSelectedStart(past7.toISOString().split("T")[0]);
      setSelectedEnd(today);
    } else if (preset === "30_hari") {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 29);
      setSelectedStart(past30.toISOString().split("T")[0]);
      setSelectedEnd(today);
    } else if (preset === "bulan_ini") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      setSelectedStart(firstDay);
      setSelectedEnd(today);
    } else if (preset === "bulan_lalu") {
      const firstDayPast = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
      const lastDayPast = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
      setSelectedStart(firstDayPast);
      setSelectedEnd(lastDayPast);
    }
  };

  const handleConfirm = () => {
    onApply(selectedStart, selectedEnd);
    onClose();
  };

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleCol}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalSubtitle}>Tap tanggal untuk menentukan rentang waktu</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <View style={styles.presetSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
              {[
                { key: "hari_ini", label: "Hari Ini" },
                { key: "minggu_ini", label: "7 Hari Terakhir" },
                { key: "30_hari", label: "30 Hari Terakhir" },
                { key: "bulan_ini", label: "Bulan Ini" },
                { key: "bulan_lalu", label: "Bulan Lalu" },
              ].map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={styles.presetPill}
                  onPress={() => handleApplyPreset(p.key)}
                >
                  <Text style={styles.presetPillText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Range Mode Switcher Tabs */}
          <View style={styles.rangeTabsRow}>
            <TouchableOpacity
              style={[
                styles.rangeTabBtn,
                activePickingMode === "start" && styles.rangeTabBtnActive,
              ]}
              onPress={() => setActivePickingMode("start")}
              activeOpacity={0.8}
            >
              <Text style={styles.rangeTabSub}>Mulai</Text>
              <Text
                style={[
                  styles.rangeTabVal,
                  activePickingMode === "start" && styles.rangeTabValActive,
                ]}
              >
                {formatDateId(selectedStart)}
              </Text>
            </TouchableOpacity>

            <View style={styles.rangeDivider}>
              <Text style={styles.rangeDividerText}>s/d</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.rangeTabBtn,
                activePickingMode === "end" && styles.rangeTabBtnActive,
              ]}
              onPress={() => setActivePickingMode("end")}
              activeOpacity={0.8}
            >
              <Text style={styles.rangeTabSub}>Selesai</Text>
              <Text
                style={[
                  styles.rangeTabVal,
                  activePickingMode === "end" && styles.rangeTabValActive,
                ]}
              >
                {formatDateId(selectedEnd)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Month & Year Navigation */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navArrowBtn} activeOpacity={0.7}>
              <ChevronLeft size={20} color="#1E293B" />
            </TouchableOpacity>

            <Text style={styles.monthYearText}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <TouchableOpacity onPress={handleNextMonth} style={styles.navArrowBtn} activeOpacity={0.7}>
              <ChevronRight size={20} color="#1E293B" />
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View style={styles.daysHeaderGrid}>
            {DAY_NAMES.map((name, index) => (
              <View key={name} style={styles.dayHeaderCell}>
                <Text
                  style={[
                    styles.dayHeaderText,
                    index === 0 && { color: "#DC2626" },
                    index === 5 && { color: "#059669" },
                  ]}
                >
                  {name}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid Numbers (1..31) */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((item, index) => {
              if (!item) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const { day, dateStr } = item;
              const isStart = dateStr === selectedStart;
              const isEnd = dateStr === selectedEnd;
              const isBetween = dateStr > selectedStart && dateStr < selectedEnd;
              const isToday = dateStr === todayStr;

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.dayCell,
                    isBetween && styles.dayCellBetween,
                    isStart && styles.dayCellStart,
                    isEnd && styles.dayCellEnd,
                  ]}
                  onPress={() => handleSelectDay(dateStr)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.dayNumberCircle,
                      (isStart || isEnd) && styles.dayNumberCircleSelected,
                      isToday && !isStart && !isEnd && styles.dayNumberCircleToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        (isStart || isEnd) && styles.dayNumberTextSelected,
                        isBetween && styles.dayNumberTextBetween,
                        isToday && !isStart && !isEnd && styles.dayNumberTextToday,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
              <Check size={18} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>Terapkan Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitleCol: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
  },
  presetSection: {
    marginVertical: 10,
  },
  presetScroll: {
    gap: 6,
  },
  presetPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  presetPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  rangeTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rangeTabBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 9,
    alignItems: "center",
  },
  rangeTabBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  rangeTabSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
  },
  rangeTabVal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginTop: 2,
  },
  rangeTabValActive: {
    color: "#162E6E",
  },
  rangeDivider: {
    paddingHorizontal: 4,
  },
  rangeDividerText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
  },
  monthNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  monthYearText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  daysHeaderGrid: {
    flexDirection: "row",
    marginBottom: 6,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 1,
  },
  dayCellBetween: {
    backgroundColor: "#EFF6FF",
  },
  dayCellStart: {
    backgroundColor: "#EFF6FF",
    borderTopLeftRadius: 19,
    borderBottomLeftRadius: 19,
  },
  dayCellEnd: {
    backgroundColor: "#EFF6FF",
    borderTopRightRadius: 19,
    borderBottomRightRadius: 19,
  },
  dayNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumberCircleSelected: {
    backgroundColor: "#162E6E",
  },
  dayNumberCircleToday: {
    borderWidth: 1.5,
    borderColor: "#162E6E",
  },
  dayNumberText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  dayNumberTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  dayNumberTextBetween: {
    color: "#1E40AF",
    fontWeight: "700",
  },
  dayNumberTextToday: {
    color: "#162E6E",
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#162E6E",
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
