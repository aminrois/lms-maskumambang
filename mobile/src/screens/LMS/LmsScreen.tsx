// mobile/src/screens/LMS/LmsScreen.tsx
import React, { useEffect } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LessonPlanScreen } from "./LessonPlanScreen";

export const LmsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  useEffect(() => {
    if (route.params?.tab === "rekap") {
      navigation.replace("RekapAbsensiMapel");
    } else if (route.params?.tab === "jurnal") {
      navigation.replace("JurnalMengajar");
    }
  }, [route.params?.tab, navigation]);

  return <LessonPlanScreen />;
};
