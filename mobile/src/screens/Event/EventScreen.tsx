// mobile/src/screens/Event/EventScreen.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarDays, Sparkles, Clock, BellRing, ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

export const EventScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#162E6E" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <CalendarDays size={24} color="#FFFFFF" />
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Event & Kalender Akademik</Text>
            <Text style={styles.headerSubtitle}>Agenda & Kegiatan Pondok Pesantren</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Under Construction Card */}
        <View style={styles.heroCard}>
          <View style={styles.iconCircle}>
            <CalendarDays size={42} color="#1D4ED8" />
          </View>
          <View style={styles.badge}>
            <Sparkles size={12} color="#D97706" />
            <Text style={styles.badgeText}>Dalam Proses Pengembangan</Text>
          </View>
          <Text style={styles.heroTitle}>Fitur Event Segera Hadir</Text>
          <Text style={styles.heroDesc}>
            Fitur agenda kegiatan, kalender akademik, dan jadwal event pesantren sedang dalam tahap
            pengembangan untuk memberikan informasi yang lebih lengkap dan terintegrasi.
          </Text>
        </View>

        {/* Feature Preview Cards */}
        <Text style={styles.sectionTitle}>Yang Akan Tersedia:</Text>

        <View style={styles.previewCard}>
          <View style={[styles.previewIconBox, { backgroundColor: "#EFF6FF" }]}>
            <CalendarDays size={20} color="#1D4ED8" />
          </View>
          <View style={styles.previewTextWrap}>
            <Text style={styles.previewTitle}>Kalender Akademik Pesantren</Text>
            <Text style={styles.previewSubtitle}>Jadwal ujian, libur semester, kepulangan & kedatangan santri</Text>
          </View>
        </View>

        <View style={styles.previewCard}>
          <View style={[styles.previewIconBox, { backgroundColor: "#F0FDF4" }]}>
            <Clock size={20} color="#16A34A" />
          </View>
          <View style={styles.previewTextWrap}>
            <Text style={styles.previewTitle}>Event & Perlombaan Santri</Text>
            <Text style={styles.previewSubtitle}>Daftar kegiatan ekstrakurikuler, tabligh akbar, & perlombaan</Text>
          </View>
        </View>

        <View style={styles.previewCard}>
          <View style={[styles.previewIconBox, { backgroundColor: "#FAF5FF" }]}>
            <BellRing size={20} color="#7E22CE" />
          </View>
          <View style={styles.previewTextWrap}>
            <Text style={styles.previewTitle}>Pengingat Otomatis</Text>
            <Text style={styles.previewSubtitle}>Notifikasi event penting langsung ke aplikasi mobile Anda</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#162E6E",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#CBD5E1",
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FEF3C7",
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  heroDesc: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 12,
    marginLeft: 4,
  },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  previewIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  previewTextWrap: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  previewSubtitle: {
    fontSize: 11.5,
    color: "#64748B",
    lineHeight: 16,
  },
});
