// mobile/src/components/RoleSwitcherModal.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import {
  Shield,
  Award,
  BookOpen,
  Sparkles,
  UserCheck,
  Heart,
  User,
  Check,
  X,
  Building,
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import { UserRoleItem } from "../api/authService";
import { Colors } from "../constants/colors";

interface RoleSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({ visible, onClose }) => {
  const { user, activeRole, setActiveRole } = useAuthStore();
  const roles = user?.roles || [];

  const handleSelectRole = async (role: UserRoleItem) => {
    await setActiveRole(role);
    onClose();
  };

  const getRoleIcon = (roleName: string) => {
    const name = (roleName || "").toLowerCase();
    if (name.includes("direktur") || name.includes("super admin")) {
      return <Shield size={22} color="#1E293B" />;
    }
    if (name.includes("kepala") || name.includes("waka")) {
      return <Award size={22} color="#1E3A8A" />;
    }
    if (name.includes("tahfidz")) {
      return <Sparkles size={22} color="#047857" />;
    }
    if (name.includes("wali kelas")) {
      return <UserCheck size={22} color="#0D9488" />;
    }
    if (name.includes("wali murid") || name.includes("orang tua")) {
      return <Heart size={22} color="#BE185D" />;
    }
    return <BookOpen size={22} color="#2563EB" />;
  };

  const getRoleBadgeColor = (roleName: string) => {
    const name = (roleName || "").toLowerCase();
    if (name.includes("direktur") || name.includes("super admin")) {
      return { bg: "#F1F5F9", border: "#CBD5E1", tagBg: "#334155", tagText: "#F8FAFC" };
    }
    if (name.includes("kepala") || name.includes("waka")) {
      return { bg: "#EFF6FF", border: "#BFDBFE", tagBg: "#1D4ED8", tagText: "#FFFFFF" };
    }
    if (name.includes("tahfidz")) {
      return { bg: "#ECFDF5", border: "#A7F3D0", tagBg: "#059669", tagText: "#FFFFFF" };
    }
    if (name.includes("wali kelas")) {
      return { bg: "#F0FDFA", border: "#99F6E4", tagBg: "#0D9488", tagText: "#FFFFFF" };
    }
    if (name.includes("wali murid") || name.includes("orang tua")) {
      return { bg: "#FDF2F8", border: "#FBCFE8", tagBg: "#DB2777", tagText: "#FFFFFF" };
    }
    return { bg: "#EFF6FF", border: "#BFDBFE", tagBg: "#2563EB", tagText: "#FFFFFF" };
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>Ganti Peran Aktif</Text>
                  <Text style={styles.sheetSubtitle}>
                    Pilih peran untuk menyesuaikan menu dan fitur SIMAS
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Roles List */}
              <ScrollView
                style={styles.scrollList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                {roles.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>Tidak ada daftar peran lain yang terdaftar.</Text>
                  </View>
                ) : (
                  roles.map((r, index) => {
                    const isSelected =
                      activeRole?.role_id === r.role_id &&
                      (r.lembaga_id ? activeRole?.lembaga_id === r.lembaga_id : true);
                    const colorScheme = getRoleBadgeColor(r.nama_role);
                    const lembagaTitle =
                      r.lembaga?.singkatan || r.lembaga?.nama_lembaga || (r.lembaga_id ? `Lembaga #${r.lembaga_id}` : null);

                    return (
                      <TouchableOpacity
                        key={`${r.role_id}-${r.lembaga_id || index}`}
                        style={[
                          styles.roleCard,
                          { backgroundColor: colorScheme.bg, borderColor: colorScheme.border },
                          isSelected && styles.roleCardActive,
                        ]}
                        onPress={() => handleSelectRole(r)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.roleCardLeft}>
                          <View style={styles.roleIconCircle}>
                            {getRoleIcon(r.nama_role)}
                          </View>
                          <View style={styles.roleInfo}>
                            <View style={styles.roleTitleRow}>
                              <Text style={styles.roleNameText}>{r.nama_role}</Text>
                              {isSelected && (
                                <View style={styles.activePill}>
                                  <Text style={styles.activePillText}>Aktif</Text>
                                </View>
                              )}
                            </View>
                            {lembagaTitle && (
                              <View style={styles.lembagaRow}>
                                <Building size={12} color="#64748B" />
                                <Text style={styles.lembagaText}>{lembagaTitle}</Text>
                              </View>
                            )}
                          </View>
                        </View>

                        <View style={styles.roleCardRight}>
                          {isSelected ? (
                            <View style={styles.checkCircleActive}>
                              <Check size={16} color="#FFFFFF" strokeWidth={3} />
                            </View>
                          ) : (
                            <View style={styles.checkCircleInactive} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingHorizontal: 20,
    paddingTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
  },
  sheetSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 16,
  },
  scrollList: {
    marginTop: 4,
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  roleCardActive: {
    borderColor: "#1D4ED8",
    backgroundColor: "#F0F5FF",
    borderWidth: 2,
  },
  roleCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  roleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  roleInfo: {
    flex: 1,
  },
  roleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  roleNameText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1E293B",
  },
  activePill: {
    backgroundColor: "#1D4ED8",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activePillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  lembagaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  lembagaText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  roleCardRight: {
    marginLeft: 8,
  },
  checkCircleActive: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleInactive: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
});
