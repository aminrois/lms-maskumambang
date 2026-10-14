// mobile/src/screens/LMS/LmsScreen.tsx
import React, { useEffect } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LessonPlanScreen } from "./LessonPlanScreen";
import { VerifikasiLessonPlanScreen } from "./VerifikasiLessonPlanScreen";
import { useAuthStore } from "../../store/useAuthStore";
import { canVerifikasiRpp } from "../../utils/permissions";

export const LmsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, activeRole } = useAuthStore();
  const canVerify = canVerifikasiRpp(activeRole || user);

  useEffect(() => {
    if (route.params?.tab === "rekap") {
      navigation.replace("RekapAbsensiMapel");
    } else if (route.params?.tab === "jurnal") {
      navigation.replace("JurnalMengajar");
    }
  }, [route.params?.tab, navigation]);

  if (canVerify) {
    return <VerifikasiLessonPlanScreen />;
  }

  return <LessonPlanScreen />;
};
