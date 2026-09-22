// mobile/src/components/ui/SwipeBackContainer.tsx
import React, { useRef } from "react";
import { View, PanResponder, StyleSheet, ViewStyle } from "react-native";
import { useNavigation } from "@react-navigation/native";

interface SwipeBackProps {
  children: React.ReactNode;
  onBack?: () => void;
  style?: ViewStyle;
  enabled?: boolean;
}

export const SwipeBackContainer: React.FC<SwipeBackProps> = ({
  children,
  onBack,
  style,
  enabled = true,
}) => {
  const navigation = useNavigation<any>();

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (!enabled) return false;
        // Tangkap swipe horizontal dari sisi kiri layar ke kanan
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.3;
        const isFromLeftEdge = evt.nativeEvent.pageX < 120;
        const isSwipingRight = gestureState.dx > 15;
        return isHorizontal && isFromLeftEdge && isSwipingRight;
      },
      onPanResponderRelease: (_evt, gestureState) => {
        // Jika swipe ke kanan lebih dari 60px atau memiliki kecepatan geser ke kanan
        if (gestureState.dx > 60 || gestureState.vx > 0.3) {
          if (onBack) {
            onBack();
          } else if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }
      },
    })
  ).current;

  return (
    <View style={[styles.container, style]} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
