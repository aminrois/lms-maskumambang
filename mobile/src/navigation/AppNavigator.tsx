// mobile/src/navigation/AppNavigator.tsx
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Image, StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../screens/Auth/LoginScreen";
import { AbsensiMapelScreen } from "../screens/Absensi/AbsensiMapelScreen";
import { TahfidzSetoranScreen } from "../screens/Tahfidz/TahfidzSetoranScreen";
import { BeritaScreen } from "../screens/Berita/BeritaScreen";
import { MainTabNavigator } from "./MainTabNavigator";
import { useAuthStore } from "../store/useAuthStore";
import { Colors } from "../constants/colors";

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

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
