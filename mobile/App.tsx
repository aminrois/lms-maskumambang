// mobile/App.tsx
import "react-native-gesture-handler"; // ⚠️ Harus di baris pertama untuk gestures
import React from "react";
import { StatusBar } from "expo-status-bar";
import { StatusBar as RNStatusBar, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppNavigator } from "./src/navigation/AppNavigator";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          {Platform.OS === "android" && (
            <RNStatusBar backgroundColor="#162E6E" barStyle="light-content" translucent={false} />
          )}
          <AppNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
