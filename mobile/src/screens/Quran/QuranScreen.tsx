import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  RotateCw,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react-native";

const MUSHAF_URL = "https://mushaf.maskumambang.net";

export const QuranScreen = () => {
  const navigation = useNavigation<any>();
  const webViewRef = useRef<WebView>(null);

  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleReload = () => {
    setHasError(false);
    webViewRef.current?.reload();
  };

  const handleGoBack = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      navigation.goBack();
    }
  };

  const handleHome = () => {
    setHasError(false);
    webViewRef.current?.injectJavaScript(`window.location.href = '${MUSHAF_URL}'; true;`);
  };

  const handleNavigationStateChange = (navState: WebViewNavigation): void => {
    setCanGoBack(Boolean(navState.canGoBack));
    setCanGoForward(Boolean(navState.canGoForward));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#09204A" />

      {/* Top Navbar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={handleGoBack}
            activeOpacity={0.7}
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

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={handleHome}
            activeOpacity={0.7}
            accessibilityLabel="Beranda Mushaf"
          >
            <Home size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={handleReload}
            activeOpacity={0.7}
            accessibilityLabel="Muat Ulang"
          >
            <RotateCw size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress / Loading Indicator */}
      {loading && (
        <View style={styles.loadingBarContainer}>
          <ActivityIndicator size="small" color="#10B981" />
          <Text style={styles.loadingText}>Memuat mushaf...</Text>
        </View>
      )}

      {/* Main WebView Container */}
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
            onNavigationStateChange={handleNavigationStateChange}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
        )}
      </View>

      {/* Bottom Sub-Navigation Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bottomBarBtn, !canGoBack && styles.bottomBarBtnDisabled]}
          onPress={() => webViewRef.current?.goBack()}
          disabled={!canGoBack}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={canGoBack ? "#1E293B" : "#CBD5E1"} />
          <Text style={[styles.bottomBarText, !canGoBack && styles.bottomBarTextDisabled]}>
            Sebelumnya
          </Text>
        </TouchableOpacity>

        <View style={styles.domainBadge}>
          <Text style={styles.domainBadgeText}>mushaf.maskumambang.net</Text>
        </View>

        <TouchableOpacity
          style={[styles.bottomBarBtn, !canGoForward && styles.bottomBarBtnDisabled]}
          onPress={() => webViewRef.current?.goForward()}
          disabled={!canGoForward}
          activeOpacity={0.7}
        >
          <Text style={[styles.bottomBarText, !canGoForward && styles.bottomBarTextDisabled]}>
            Berikutnya
          </Text>
          <ChevronRight size={20} color={canGoForward ? "#1E293B" : "#CBD5E1"} />
        </TouchableOpacity>
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
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#064E3B",
    paddingVertical: 5,
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
  bottomBar: {
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  bottomBarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  bottomBarBtnDisabled: {
    opacity: 0.5,
  },
  bottomBarText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  bottomBarTextDisabled: {
    color: "#CBD5E1",
  },
  domainBadge: {
    backgroundColor: "#EEF2F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  domainBadgeText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#64748B",
  },
});
