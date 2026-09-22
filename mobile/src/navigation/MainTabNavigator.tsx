// mobile/src/navigation/MainTabNavigator.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  Home,
  BookOpen,
  QrCode,
  Calendar,
  User,
  X,
  ScanLine,
} from "lucide-react-native";
import { TeacherDashboardScreen } from "../screens/Dashboard/TeacherDashboardScreen";
import { ParentDashboardScreen } from "../screens/Dashboard/ParentDashboardScreen";
import { JadwalScreen } from "../screens/Jadwal/JadwalScreen";
import { ProfileScreen } from "../screens/Profile/ProfileScreen";
import { useAuthStore } from "../store/useAuthStore";
import { Colors } from "../constants/colors";

const Tab = createBottomTabNavigator();

export const MainTabNavigator = () => {
  const [showScanModal, setShowScanModal] = useState(false);
  const { user } = useAuthStore();

  const isWali = user?.roles?.some((r) => {
    const role = (r.nama_role || "").toLowerCase();
    return role.includes("wali") || role.includes("orang tua") || role.includes("parent");
  });

  const DashboardComponent = isWali ? ParentDashboardScreen : TeacherDashboardScreen;

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#1D4ED8",
          tabBarInactiveTintColor: "#94A3B8",
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopColor: "#EEF2F6",
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 10,
            paddingTop: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10.5,
            fontWeight: "700",
          },
        }}
      >
        {/* 1. Beranda */}
        <Tab.Screen
          name="DashboardTab"
          component={DashboardComponent}
          options={{
            tabBarLabel: "Beranda",
            tabBarIcon: ({ color }) => <Home size={22} color={color} />,
          }}
        />

        {/* 2. LMS */}
        <Tab.Screen
          name="LmsTab"
          component={JadwalScreen}
          options={{
            tabBarLabel: "LMS",
            tabBarIcon: ({ color }) => <BookOpen size={22} color={color} />,
          }}
        />

        {/* 3. Scan (Center Elevated Floating Button) */}
        <Tab.Screen
          name="ScanTab"
          component={TeacherDashboardScreen}
          options={{
            tabBarLabel: "Scan",
            tabBarButton: (props) => (
              <TouchableOpacity
                style={styles.floatingScanWrapper}
                onPress={() => setShowScanModal(true)}
                activeOpacity={0.85}
              >
                <View style={styles.floatingScanBtn}>
                  <QrCode size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.floatingScanLabel}>Scan</Text>
              </TouchableOpacity>
            ),
          }}
        />

        {/* 4. Kegiatan */}
        <Tab.Screen
          name="JadwalTab"
          component={JadwalScreen}
          options={{
            tabBarLabel: "Kegiatan",
            tabBarIcon: ({ color }) => <Calendar size={22} color={color} />,
          }}
        />

        {/* 5. Profil */}
        <Tab.Screen
          name="ProfileTab"
          component={ProfileScreen}
          options={{
            tabBarLabel: "Profil",
            tabBarIcon: ({ color }) => <User size={22} color={color} />,
          }}
        />
      </Tab.Navigator>

      {/* Modal QR Code Scanner Presensi */}
      <Modal
        visible={showScanModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowScanModal(false)}
      >
        <View style={styles.scanModalOverlay}>
          <View style={styles.scanModalCard}>
            <View style={styles.scanModalHeader}>
              <Text style={styles.scanModalTitle}>Scan QR Code Presensi</Text>
              <TouchableOpacity
                onPress={() => setShowScanModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrScannerArea}>
              <View style={styles.scannerGuideBox}>
                <ScanLine size={120} color="#3B82F6" strokeWidth={1.5} />
              </View>
              <Text style={styles.scannerInstruction}>
                Arahkan kamera ke QR Code kegiatan, presensi sholat, atau kartu santri
              </Text>
            </View>

            <TouchableOpacity
              style={styles.simulateScanBtn}
              onPress={() => {
                setShowScanModal(false);
                Alert.alert(
                  "Presensi Berhasil",
                  "QR Code terverifikasi. Kehadiran Anda pada agenda kegiatan telah tercatat secara otomatis di sistem."
                );
              }}
            >
              <Text style={styles.simulateScanText}>Simulasi Pindai QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingScanWrapper: {
    top: -16,
    justifyContent: "center",
    alignItems: "center",
  },
  floatingScanBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  floatingScanLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 2,
  },
  scanModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    padding: 20,
  },
  scanModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
  },
  scanModalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  scanModalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  qrScannerArea: {
    width: "100%",
    height: 220,
    backgroundColor: "#0F172A",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  scannerGuideBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  scannerInstruction: {
    color: "#94A3B8",
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 16,
  },
  simulateScanBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 18,
    width: "100%",
    alignItems: "center",
  },
  simulateScanText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
