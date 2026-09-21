// mobile/src/components/ui/Badge.tsx
import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Colors } from "../../constants/colors";

interface BadgeProps {
  label: string;
  variant?: "success" | "warning" | "danger" | "info" | "primary" | "neutral";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "neutral",
  size = "md",
}) => {
  const getColors = (): { bg: string; text: string } => {
    switch (variant) {
      case "success":
        return { bg: Colors.successBg, text: Colors.success };
      case "warning":
        return { bg: Colors.warningBg, text: Colors.warning };
      case "danger":
        return { bg: Colors.dangerBg, text: Colors.danger };
      case "info":
        return { bg: Colors.infoBg, text: Colors.info };
      case "primary":
        return { bg: Colors.primaryLight, text: Colors.primary };
      case "neutral":
      default:
        return { bg: "#F1F5F9", text: "#475569" };
    }
  };

  const c = getColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg },
        size === "sm" && styles.badgeSm,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: c.text },
          size === "sm" && styles.textSm,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  textSm: {
    fontSize: 10,
    fontWeight: "600",
  },
});
