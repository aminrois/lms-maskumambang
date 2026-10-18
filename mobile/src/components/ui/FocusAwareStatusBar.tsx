// mobile/src/components/ui/FocusAwareStatusBar.tsx
import React from "react";
import { StatusBar as RNStatusBar } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

interface FocusAwareStatusBarProps {
  barStyle?: "light-content" | "dark-content";
  backgroundColor?: string;
  translucent?: boolean;
}

export const FocusAwareStatusBar: React.FC<FocusAwareStatusBarProps> = ({
  barStyle = "light-content",
  backgroundColor = "#162E6E",
  translucent = false,
}) => {
  const isFocused = useIsFocused();

  if (!isFocused) return null;

  return (
    <>
      <RNStatusBar
        barStyle={barStyle}
        backgroundColor={backgroundColor}
        translucent={translucent}
      />
      <ExpoStatusBar style={barStyle === "light-content" ? "light" : "dark"} />
    </>
  );
};
