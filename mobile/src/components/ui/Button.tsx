// mobile/src/components/ui/Button.tsx
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { Colors } from "../../constants/colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const getVariantStyle = (): { btn: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case "secondary":
        return {
          btn: { backgroundColor: Colors.primaryLight, borderWidth: 0 },
          text: { color: Colors.primary },
        };
      case "outline":
        return {
          btn: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: Colors.border },
          text: { color: Colors.text },
        };
      case "danger":
        return {
          btn: { backgroundColor: Colors.danger, borderWidth: 0 },
          text: { color: "#FFFFFF" },
        };
      case "success":
        return {
          btn: { backgroundColor: Colors.success, borderWidth: 0 },
          text: { color: "#FFFFFF" },
        };
      case "primary":
      default:
        return {
          btn: { backgroundColor: Colors.primary, borderWidth: 0 },
          text: { color: "#FFFFFF" },
        };
    }
  };

  const getSizeStyle = (): { btn: ViewStyle; text: TextStyle } => {
    switch (size) {
      case "sm":
        return {
          btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
          text: { fontSize: 12, fontWeight: "600" },
        };
      case "lg":
        return {
          btn: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14 },
          text: { fontSize: 16, fontWeight: "700" },
        };
      case "md":
      default:
        return {
          btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
          text: { fontSize: 14, fontWeight: "700" },
        };
    }
  };

  const vStyle = getVariantStyle();
  const sStyle = getSizeStyle();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        vStyle.btn,
        sStyle.btn,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vStyle.text.color} size="small" />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[styles.text, vStyle.text, sStyle.text, icon ? { marginLeft: 8 } : null, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    textAlign: "center",
  },
  disabled: {
    opacity: 0.6,
  },
});
