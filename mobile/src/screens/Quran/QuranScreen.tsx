import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, BookOpen, RotateCw } from "lucide-react-native";

const MUSHAF_URL = "https://mushaf.maskumambang.net";

export const QuranScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleReload = () => {
    setHasError(false);
    webViewRef.current?.reload();
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor="#09204A" />

      {/* Top Navbar: Hanya Tombol Back dan Judul */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.navIconBtn}
          onPress={handleGoBack}
          activeOpacity={0.7}
          accessibilityLabel="Kembali ke Dashboard"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.titleWrapper}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <BookOpen size={16} color="#34D399" />
            <Text style={styles.headerTitle}>Al-Qur'an Digital</Text>
          </View>
          <Text style={styles.headerSubtitle}>Mushaf Pesantren Maskumambang</Text>
        </View>
      </View>

      {/* Progress / Loading Indicator */}
      {loading && (
        <View style={styles.loadingBarContainer}>
          <ActivityIndicator size="small" color="#10B981" />
          <Text style={styles.loadingText}>Memuat mushaf...</Text>
        </View>
      )}

      {/* Main WebView: Layar Penuh Maksimal */}
      <View style={styles.webviewContainer}>
        {hasError ? (
          <View style={styles.errorContainer}>
            <BookOpen size={48} color="#94A3B8" style={{ marginBottom: 12 }} />
            <Text style={styles.errorTitle}>Gagal Membuka Mushaf</Text>
            <Text style={styles.errorSubtitle}>
              Pastikan perangkat Anda terhubung ke jaringan internet.
            </Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={handleReload}
              activeOpacity={0.8}
            >
              <RotateCw size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.retryBtnText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webViewRef as any}
            source={{ uri: MUSHAF_URL }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setHasError(true);
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#09204A",
  },
  headerBar: {
    backgroundColor: "#09204A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  titleWrapper: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#93C5FD",
    marginTop: 1,
  },
  loadingBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#064E3B",
    paddingVertical: 4,
  },
  loadingText: {
    fontSize: 11,
    color: "#A7F3D0",
    fontWeight: "600",
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  webview: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 12.5,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
