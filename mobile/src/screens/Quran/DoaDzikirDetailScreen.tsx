// mobile/src/screens/Quran/DoaDzikirDetailScreen.tsx
// Halaman Detail Doa & Dzikir — tampilan teks Arab besar, latin, terjemahan, riwayat, serta tasbih interaktif floating di bawah

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  ChevronLeft,
  Share2,
  BookOpen,
  Sparkles,
  RotateCcw,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { DoaItem, DOA_DZIKIR_LIST } from "../../utils/islamicPrayerUtil";

export const DoaDzikirDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Params from navigation
  const initialItem: DoaItem =
    route.params?.item ||
    DOA_DZIKIR_LIST.find((d) => d.id === route.params?.doaId) ||
    DOA_DZIKIR_LIST[0];

  const allItems: DoaItem[] = route.params?.allItems || DOA_DZIKIR_LIST;
  const initialIndex: number =
    route.params?.currentIndex !== undefined
      ? route.params.currentIndex
      : allItems.findIndex((d) => d.id === initialItem.id);

  const [currentIdx, setCurrentIdx] = useState<number>(
    initialIndex >= 0 ? initialIndex : 0
  );

  const item = allItems[currentIdx] || initialItem;

  // Tasbih Counter State
  const [tasbihCount, setTasbihCount] = useState<number>(0);
  const [targetCount, setTargetCount] = useState<number>(33);
  const [copiedLafadz, setCopiedLafadz] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);

  // Dapatkan insets sistem (termasuk navigation bar Android)
  const insets = useSafeAreaInsets();
  // Tinggi dock penuh ≈ 120, mini pill ≈ 44. Tambah buffer 8px di atas nav bar.
  const DOCK_FULL_H = 120;
  const DOCK_MINI_H = 44;
  const dockBottomOffset = insets.bottom + 8;
  const scrollExtraBottom = insets.bottom + (isDockCollapsed ? DOCK_MINI_H : DOCK_FULL_H) + 20;

  // Progress percentage
  const progressPercent = useMemo(() => {
    if (targetCount <= 0) return 0;
    return Math.min(100, Math.round((tasbihCount / targetCount) * 100));
  }, [tasbihCount, targetCount]);

  // Navigate to previous prayer
  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setTasbihCount(0);
      setCopiedLafadz(false);
    }
  };

  // Navigate to next prayer
  const handleNext = () => {
    if (currentIdx < allItems.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setTasbihCount(0);
      setCopiedLafadz(false);
    }
  };

  // Share Doa
  const handleShare = async () => {
    try {
      const message = `${item.judul}\n\n${item.arab}\n\n"${item.latin}"\n\nArtinya:\n${item.arti}\n\nSumber: ${item.riwayat || "Pesantren Maskumambang"}\n\nDibagikan melalui siMas (Sistem Informasi Maskumambang)`;
      await Share.share({ message });
    } catch (error) {
      console.warn("Gagal membagikan doa:", error);
    }
  };

  // Quick Share / Copy Alert
  const handleCopyLafadz = () => {
    setCopiedLafadz(true);
    handleShare();
    setTimeout(() => setCopiedLafadz(false), 2000);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {item.judul}
          </Text>
          <Text style={styles.headerSub}>
            Doa {currentIdx + 1} dari {allItems.length}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={handleShare}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Share2 size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollExtraBottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Category Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.categoryBadge}>
              <Sparkles size={12} color="#0284C7" />
              <Text style={styles.categoryBadgeText}>{item.kategori}</Text>
            </View>
            <View style={styles.numberBadge}>
              <Text style={styles.numberBadgeText}>#{currentIdx + 1}</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>{item.judul}</Text>
        </View>

        {/* 1. Card Teks Arab */}
        <View style={styles.arabCard}>
          <View style={styles.cardSectionHeader}>
            <Text style={styles.sectionLabel}>Lafadz Arab</Text>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={handleCopyLafadz}
              activeOpacity={0.7}
            >
              {copiedLafadz ? (
                <Check size={14} color="#059669" />
              ) : (
                <Share2 size={14} color="#64748B" />
              )}
              <Text
                style={[
                  styles.copyBtnText,
                  copiedLafadz && { color: "#059669" },
                ]}
              >
                {copiedLafadz ? "Dibagikan" : "Bagikan"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.arabTextBox}>
            <Text style={styles.arabText}>{item.arab}</Text>
          </View>
        </View>

        {/* 2. Card Transliterasi Latin */}
        {item.latin ? (
          <View style={styles.card}>
            <View style={styles.cardSectionHeader}>
              <Text style={styles.sectionLabel}>Cara Membaca (Latin)</Text>
            </View>
            <Text style={styles.latinText}>"{item.latin}"</Text>
          </View>
        ) : null}

        {/* 3. Card Terjemahan Indonesia */}
        <View style={styles.card}>
          <View style={styles.cardSectionHeader}>
            <Text style={styles.sectionLabel}>Artinya</Text>
          </View>
          <Text style={styles.artiText}>{item.arti}</Text>
        </View>

        {/* 4. Riwayat / Sumber Hadits */}
        {item.riwayat ? (
          <View style={styles.riwayatCard}>
            <View style={styles.riwayatHeader}>
              <BookOpen size={16} color="#047857" />
              <Text style={styles.riwayatLabel}>Sumber & Riwayat:</Text>
            </View>
            <Text style={styles.riwayatText}>{item.riwayat}</Text>
          </View>
        ) : null}

        {/* 5. Bagikan Doa Ini Button */}
        <TouchableOpacity
          style={styles.shareWideBtn}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Share2 size={16} color="#FFFFFF" />
          <Text style={styles.shareWideBtnText}>Bagikan Doa Ini</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ═════════════════════════════════════════════════════════════
          FLOATING TASBIH / DZIKIR COUNTER DOCK (DI BAGIAN BAWAH)
      ══════════════════════════════════════════════════════════════ */}
      <View style={[styles.floatingWrapper, { bottom: dockBottomOffset }]} pointerEvents="box-none">
        {isDockCollapsed ? (
          // Mini Floating Pill (Saat di-minimize)
          <TouchableOpacity
            style={styles.miniFloatingPill}
            onPress={() => setIsDockCollapsed(false)}
            activeOpacity={0.85}
          >
            <View style={styles.miniPillIconBox}>
              <Sparkles size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.miniPillText}>
              Tasbih: <Text style={styles.miniPillCountBold}>{tasbihCount}</Text>/{targetCount}
            </Text>
            <ChevronUp size={16} color="rgba(255,255,255,0.7)" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        ) : (
          // Full Modern Floating Dock
          <View style={styles.floatingDock}>
            {/* Top Bar Dock: Progress & Presets */}
            <View style={styles.dockTopBar}>
              <View style={styles.dockTopLeft}>
                <View style={styles.dockIconCircle}>
                  <Sparkles size={13} color="#0284C7" />
                </View>
                <Text style={styles.dockTitle}>Tasbih</Text>
                <View
                  style={[
                    styles.dockProgressBadge,
                    tasbihCount >= targetCount && styles.dockProgressBadgeCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.dockProgressText,
                      tasbihCount >= targetCount && styles.dockProgressTextCompleted,
                    ]}
                  >
                    {progressPercent}%
                  </Text>
                </View>
              </View>

              <View style={styles.dockTopRight}>
                {/* Target Chips: 3x, 7x, 33x, 100x */}
                <View style={styles.dockTargetGroup}>
                  {[3, 7, 33, 100].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.dockTargetChip,
                        targetCount === t && styles.dockTargetChipActive,
                      ]}
                      onPress={() => setTargetCount(t)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dockTargetChipText,
                          targetCount === t && styles.dockTargetChipTextActive,
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Reset Button */}
                {tasbihCount > 0 && (
                  <TouchableOpacity
                    style={styles.dockResetBtn}
                    onPress={() => setTasbihCount(0)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <RotateCcw size={13} color="#DC2626" />
                  </TouchableOpacity>
                )}

                {/* Minimize Button */}
                <TouchableOpacity
                  style={styles.dockCollapseBtn}
                  onPress={() => setIsDockCollapsed(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <ChevronDown size={16} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Progress Bar Indicator */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor:
                      tasbihCount >= targetCount ? "#10B981" : "#0284C7",
                  },
                ]}
              />
            </View>

            {/* Main Interactive Action Row: Prev Doa | Tap Area | Next Doa */}
            <View style={styles.dockActionRow}>
              {/* Previous Doa */}
              <TouchableOpacity
                style={[
                  styles.dockNavBtn,
                  currentIdx === 0 && styles.dockNavBtnDisabled,
                ]}
                onPress={handlePrev}
                disabled={currentIdx === 0}
                activeOpacity={0.7}
              >
                <ChevronLeft
                  size={20}
                  color={currentIdx === 0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.85)"}
                />
              </TouchableOpacity>

              {/* Main Thumb Tap Button */}
              <TouchableOpacity
                style={[
                  styles.dockMainTapBtn,
                  tasbihCount >= targetCount && styles.dockMainTapBtnCompleted,
                ]}
                onPress={() => setTasbihCount((prev) => prev + 1)}
                activeOpacity={0.85}
              >
                {/* Big Number Pill */}
                <View
                  style={[
                    styles.dockCountBadge,
                    tasbihCount >= targetCount && styles.dockCountBadgeCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.dockCountNum,
                      tasbihCount >= targetCount && styles.dockCountNumCompleted,
                    ]}
                  >
                    {tasbihCount}
                  </Text>
                </View>

                {/* Instruction Text */}
                <View style={styles.dockTapInfo}>
                  <Text style={styles.dockTapMainText}>
                    {tasbihCount >= targetCount
                      ? "Alhamdulillah, Selesai! 🎉"
                      : "Ketuk untuk Menghitung"}
                  </Text>
                  <Text style={styles.dockTapSubText}>
                    {tasbihCount >= targetCount
                      ? `Target ${targetCount}x tercapai`
                      : `Target: ${targetCount} kali hitungan`}
                  </Text>
                </View>

                {/* Quick +1 / Check Icon */}
                <View
                  style={[
                    styles.dockPlusBubble,
                    tasbihCount >= targetCount && styles.dockPlusBubbleCompleted,
                  ]}
                >
                  {tasbihCount >= targetCount ? (
                    <Check size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.dockPlusText}>+1</Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Next Doa */}
              <TouchableOpacity
                style={[
                  styles.dockNavBtn,
                  currentIdx === allItems.length - 1 && styles.dockNavBtnDisabled,
                ]}
                onPress={handleNext}
                disabled={currentIdx === allItems.length - 1}
                activeOpacity={0.7}
              >
                <ChevronRight
                  size={20}
                  color={
                    currentIdx === allItems.length - 1
                      ? "rgba(255,255,255,0.25)"
                      : "rgba(255,255,255,0.85)"
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#162E6E",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 11,
    color: "#E2E8F0",
    marginTop: 2,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 170, // Memberi ruang ekstra agar teks terbawah tidak tertutup floating dock
    gap: 14,
  },

  // Hero Card
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0369A1",
  },
  numberBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  numberBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 24,
  },

  // Arab Card
  arabCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  arabTextBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  arabText: {
    fontSize: 25,
    lineHeight: 46,
    textAlign: "right",
    color: "#0F172A",
    fontWeight: "500",
  },

  // Standard Card (Latin & Translation)
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  latinText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
    fontStyle: "italic",
  },
  artiText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#1E293B",
  },

  // Riwayat Card
  riwayatCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  riwayatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  riwayatLabel: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#047857",
  },
  riwayatText: {
    fontSize: 12.5,
    color: "#065F46",
    fontWeight: "600",
    lineHeight: 18,
  },

  shareWideBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0284C7",
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 4,
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  shareWideBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  // ═════════════════════════════════════════════════════════════
  // FLOATING TASBIH DOCK STYLES
  // ═════════════════════════════════════════════════════════════
  floatingWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    // bottom diatur dinamis lewat inline style berdasarkan useSafeAreaInsets
    alignItems: "center",
    paddingHorizontal: 14,
  },

  // Mini Floating Pill (Saat di-minimize)
  miniFloatingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#162E6E",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 0,
    shadowColor: "#162E6E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    gap: 8,
  },
  miniPillIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  miniPillText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
  },
  miniPillCountBold: {
    fontWeight: "900",
    color: "#FFFFFF",
  },

  // Full Floating Dock
  floatingDock: {
    width: "100%",
    backgroundColor: "#162E6E",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderWidth: 0,
    shadowColor: "#162E6E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    gap: 8,
  },

  // Dock Top Bar
  dockTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dockTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dockIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  dockTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  dockProgressBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  dockProgressBadgeCompleted: {
    backgroundColor: "rgba(16, 185, 129, 0.3)",
  },
  dockProgressText: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.9)",
  },
  dockProgressTextCompleted: {
    color: "#6EE7B7",
  },

  dockTopRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dockTargetGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  dockTargetChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dockTargetChipActive: {
    backgroundColor: "#FFFFFF",
  },
  dockTargetChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.65)",
  },
  dockTargetChipTextActive: {
    color: "#162E6E",
    fontWeight: "800",
  },
  dockResetBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
  },
  dockCollapseBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Progress Bar
  progressBarTrack: {
    width: "100%",
    height: 3.5,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },

  // Main Action Row (Thumb Zone)
  dockActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dockNavBtn: {
    width: 38,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  dockNavBtnDisabled: {
    opacity: 0.25,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },

  // Main Tap Button
  dockMainTapBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#162E6E",
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 10,
    shadowColor: "#162E6E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  dockMainTapBtnCompleted: {
    backgroundColor: "#059669",
    shadowColor: "#059669",
  },
  dockCountBadge: {
    minWidth: 38,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  dockCountBadgeCompleted: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  dockCountNum: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  dockCountNumCompleted: {
    color: "#FFFFFF",
  },
  dockTapInfo: {
    flex: 1,
    marginLeft: 8,
    marginRight: 6,
  },
  dockTapMainText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  dockTapSubText: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 1,
  },
  dockPlusBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  dockPlusBubbleCompleted: {
    backgroundColor: "#10B981",
  },
  dockPlusText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
