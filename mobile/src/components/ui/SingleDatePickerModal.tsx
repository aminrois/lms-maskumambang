// mobile/src/components/ui/SingleDatePickerModal.tsx
// Visual Calendar Single Date Picker — Kalender visual interaktif seperti kalender HP asli

import React, { useState, useMemo, useEffect } from "react";
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
  CalendarDays,
} from "lucide-react-native";

interface SingleDatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  value: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  title?: string;
  minDate?: string;
  maxDate?: string;
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
  return `${parseInt(d, 10)} ${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
};

export const SingleDatePickerModal: React.FC<SingleDatePickerModalProps> = ({
  visible,
  onClose,
  value,
  onSelect,
  title = "Pilih Tanggal",
  minDate,
  maxDate,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(value || new Date().toISOString().split("T")[0]);

  // Calendar view navigation
  const [viewYear, setViewYear] = useState<number>(() => {
    const s = value ? new Date(value) : new Date();
    return s.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    const s = value ? new Date(value) : new Date();
    return s.getMonth();
  });

  useEffect(() => {
    if (visible) {
      const initial = value || new Date().toISOString().split("T")[0];
      setSelectedDate(initial);
      const d = initial ? new Date(initial) : new Date();
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [visible, value]);

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

  // Generate calendar grid days
  const calendarDays = useMemo(() => {
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthLastDate = new Date(viewYear, viewMonth, 0).getDate();

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthLastDate - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }

    // Next month padding to fill full grid (multiple of 7)
    const totalSlots = Math.ceil(days.length / 7) * 7;
    const remaining = totalSlots - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    return days;
  }, [viewYear, viewMonth]);

  const handleDayPress = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const handleApply = () => {
    onSelect(selectedDate);
    onClose();
  };

  const setToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
    const d = new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const setYesterday = () => {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toISOString().split("T")[0];
    setSelectedDate(yestStr);
    setViewYear(yest.getFullYear());
    setViewMonth(yest.getMonth());
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <CalendarDays size={20} color="#162E6E" />
              </View>
              <View>
                <Text style={styles.headerTitle}>{title}</Text>
                <Text style={styles.headerSubtitle}>
                  {selectedDate ? formatDateId(selectedDate) : "Pilih tanggal"}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <View style={styles.quickPresetRow}>
            <TouchableOpacity
              style={[
                styles.quickPresetBtn,
                selectedDate === todayStr && styles.quickPresetBtnActive,
              ]}
              onPress={setToday}
            >
              <Text
                style={[
                  styles.quickPresetText,
                  selectedDate === todayStr && styles.quickPresetTextActive,
                ]}
              >
                Hari Ini
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickPresetBtn}
              onPress={setYesterday}
            >
              <Text style={styles.quickPresetText}>Kemarin</Text>
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn} activeOpacity={0.7}>
              <ChevronLeft size={20} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.monthYearText}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn} activeOpacity={0.7}>
              <ChevronRight size={20} color="#1E293B" />
            </TouchableOpacity>
          </View>

          {/* Day Names Header */}
          <View style={styles.dayNamesRow}>
            {DAY_NAMES.map((d, i) => (
              <Text
                key={d}
                style={[
                  styles.dayNameText,
                  (i === 0 || i === 6) && styles.dayNameTextWeekend,
                ]}
              >
                {d}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((item, idx) => {
              const isSelected = item.dateStr === selectedDate;
              const isToday = item.dateStr === todayStr;

              return (
                <TouchableOpacity
                  key={`${item.dateStr}-${idx}`}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    !isSelected && isToday && styles.dayCellToday,
                  ]}
                  onPress={() => handleDayPress(item.dateStr)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !item.isCurrentMonth && styles.dayTextOtherMonth,
                      isSelected && styles.dayTextSelected,
                      !isSelected && isToday && styles.dayTextToday,
                    ]}
                  >
                    {item.dayNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleApply} style={styles.applyBtn} activeOpacity={0.85}>
              <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.applyBtnText}>Pilih Tanggal</Text>
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
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "600",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  quickPresetRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  quickPresetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quickPresetBtnActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#93C5FD",
  },
  quickPresetText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  quickPresetTextActive: {
    color: "#1E40AF",
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  navBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  monthYearText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  dayNamesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  dayNameText: {
    width: 36,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  dayNameTextWeekend: {
    color: "#DC2626",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    rowGap: 6,
    marginBottom: 16,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  dayCellSelected: {
    backgroundColor: "#162E6E",
    ...Platform.select({
      ios: {
        shadowColor: "#162E6E",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: "#2563EB",
  },
  dayText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  dayTextOtherMonth: {
    color: "#CBD5E1",
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  dayTextToday: {
    color: "#2563EB",
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  applyBtn: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#162E6E",
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
