// mobile/src/navigation/AppNavigator.tsx
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Image, StatusBar, AppState, Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../screens/Auth/LoginScreen";
import { AbsensiMapelScreen } from "../screens/Absensi/AbsensiMapelScreen";
import { TahfidzSetoranScreen } from "../screens/Tahfidz/TahfidzSetoranScreen";
import { BeritaScreen } from "../screens/Berita/BeritaScreen";
import { WaliLaporanHafalanScreen } from "../screens/Wali/WaliLaporanHafalanScreen";
import { WaliPresensiScreen } from "../screens/Wali/WaliPresensiScreen";
import { WaliJadwalScreen } from "../screens/Wali/WaliJadwalScreen";
import { WaliLmsScreen } from "../screens/Wali/WaliLmsScreen";
import { WaliKeuanganScreen } from "../screens/Wali/WaliKeuanganScreen";
import { WaliGuidanceScreen } from "../screens/Wali/WaliGuidanceScreen";
import { WaliDetailSantriScreen } from "../screens/Wali/WaliDetailSantriScreen";
import { GuidanceHomeScreen } from "../screens/Guidance/GuidanceHomeScreen";
import { GuidanceDetailScreen } from "../screens/Guidance/GuidanceDetailScreen";
import { GuidanceCatatSesiScreen } from "../screens/Guidance/GuidanceCatatSesiScreen";
import { QuranScreen } from "../screens/Quran/QuranScreen";
import { MainTabNavigator } from "./MainTabNavigator";
import { useAuthStore } from "../store/useAuthStore";
import { Colors } from "../constants/colors";

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const {
    isAuthenticated,
    isLoading,
    restoreSession,
    checkSessionExpiry,
    updateLastActiveTime,
    wasAutoLoggedOut,
    resetAutoLogoutFlag,
    autoLogoutMinutes,
  } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Handle Inactivity & Background Auto Logout
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === "active") {
        // App kembali ke layar utama: periksa apakah sudah melebihi batas waktu
        const isExpired = await checkSessionExpiry();
        if (isExpired) {
          Alert.alert(
            "Sesi Kedaluwarsa",
            `Aplikasi telah otomatis logout karena tidak digunakan selama lebih dari ${autoLogoutMinutes} menit demi keamanan data Anda.`,
            [{ text: "OK" }]
          );
        } else {
          updateLastActiveTime();
        }
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        // App diminimize / layar dimatikan: catat waktu aktivitas terakhir
        updateLastActiveTime();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    // Pengecekan berkala jika aplikasi dibiarkan terbuka tanpa disentuh
    const interval = setInterval(async () => {
      const isExpired = await checkSessionExpiry();
      if (isExpired) {
        Alert.alert(
          "Sesi Kedaluwarsa",
          `Aplikasi telah otomatis logout karena tidak ada aktivitas selama ${autoLogoutMinutes} menit demi keamanan data Anda.`,
          [{ text: "OK" }]
        );
      }
    }, 30000); // Cek setiap 30 detik

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [isAuthenticated, checkSessionExpiry, updateLastActiveTime, autoLogoutMinutes]);

  // Notifikasi jika sesi kedaluwarsa saat pertama kali membuka aplikasi
  useEffect(() => {
    if (!isAuthenticated && !isLoading && wasAutoLoggedOut) {
      Alert.alert(
        "Sesi Kedaluwarsa",
        "Sesi login Anda telah berakhir demi keamanan. Silakan login kembali untuk melanjutkan.",
        [{ text: "Mengerti", onPress: () => resetAutoLogoutFlag() }]
      );
    }
  }, [isAuthenticated, isLoading, wasAutoLoggedOut, resetAutoLogoutFlag]);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Image
          source={require("../../assets/splash.png")}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View style={styles.splashLoader}>
          <ActivityIndicator size="small" color="#162E6E" />
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
              name="AbsensiMapel"
              component={AbsensiMapelScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="TahfidzSetoran"
              component={TahfidzSetoranScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="Berita"
              component={BeritaScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            {/* Screen Khusus Wali Santri */}
            <Stack.Screen
              name="WaliLaporanHafalan"
              component={WaliLaporanHafalanScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="WaliPresensi"
              component={WaliPresensiScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="WaliJadwal"
              component={WaliJadwalScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="WaliLms"
              component={WaliLmsScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="WaliKeuangan"
              component={WaliKeuanganScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            {/* Fitur Guidance / Bimbingan Santri */}
            <Stack.Screen
              name="GuidanceHome"
              component={GuidanceHomeScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="GuidanceDetail"
              component={GuidanceDetailScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="GuidanceCatatSesi"
              component={GuidanceCatatSesiScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="WaliGuidance"
              component={WaliGuidanceScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="WaliDetailSantri"
              component={WaliDetailSantriScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="Quran"
              component={QuranScreen}
              options={{
                animation: "slide_from_right",
                gestureEnabled: false,
                fullScreenGestureEnabled: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  splashLoader: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
  },
});
