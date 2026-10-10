// mobile/src/components/RoleBadgeButton.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ChevronDown, Shield, Award, BookOpen, Sparkles, UserCheck, Heart } from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import { RoleSwitcherModal } from "./RoleSwitcherModal";

interface RoleBadgeButtonProps {
  style?: any;
  variant?: "dark" | "light" | "pill";
}

export const RoleBadgeButton: React.FC<RoleBadgeButtonProps> = ({ style, variant = "pill" }) => {
  const { user, activeRole } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);

  const roles = user?.roles || [];
  const hasMultipleRoles = roles.length > 1;

  const roleName = activeRole?.nama_role || roles[0]?.nama_role || "Pengguna";
  const lembagaSingkatan = activeRole?.lembaga?.singkatan || null;
  const displayText = lembagaSingkatan ? `${roleName} • ${lembagaSingkatan}` : roleName;

  const getRoleIcon = () => {
    const name = (roleName || "").toLowerCase();
    const iconSize = 13;
    const iconColor = variant === "dark" ? "#FACC15" : "#1D4ED8";

    if (name.includes("direktur") || name.includes("super admin")) {
      return <Shield size={iconSize} color={iconColor} />;
    }
    if (name.includes("kepala") || name.includes("waka")) {
      return <Award size={iconSize} color={iconColor} />;
    }
    if (name.includes("tahfidz")) {
      return <Sparkles size={iconSize} color={iconColor} />;
    }
    if (name.includes("wali kelas")) {
      return <UserCheck size={iconSize} color={iconColor} />;
    }
    if (name.includes("wali murid") || name.includes("orang tua")) {
      return <Heart size={iconSize} color={iconColor} />;
    }
    return <BookOpen size={iconSize} color={iconColor} />;
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          variant === "dark" && styles.containerDark,
          variant === "light" && styles.containerLight,
          variant === "pill" && styles.containerPill,
          style,
        ]}
        onPress={() => {
          if (hasMultipleRoles) {
            setModalVisible(true);
          }
        }}
        activeOpacity={hasMultipleRoles ? 0.75 : 1}
        disabled={!hasMultipleRoles}
      >
        <View style={styles.contentRow}>
          {getRoleIcon()}
          <Text
            style={[
              styles.roleText,
              variant === "dark" && styles.roleTextDark,
              variant === "light" && styles.roleTextLight,
              variant === "pill" && styles.roleTextPill,
            ]}
            numberOfLines={1}
          >
            {displayText}
          </Text>
          {hasMultipleRoles && (
            <ChevronDown
              size={13}
              color={variant === "dark" ? "#FACC15" : "#1D4ED8"}
              style={{ marginLeft: 3 }}
            />
          )}
        </View>
      </TouchableOpacity>

      <RoleSwitcherModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Dark variant (untuk header navy)
  containerDark: {
    backgroundColor: "rgba(250, 204, 21, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.4)",
  },
  roleTextDark: {
    color: "#FACC15",
  },
  // Light variant (untuk card putih / profil)
  containerLight: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  roleTextLight: {
    color: "#1E293B",
  },
  // Pill variant
  containerPill: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  roleTextPill: {
    color: "#FFFFFF",
  },
});
