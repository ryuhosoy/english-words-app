import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

interface BadgeProps {
  text: string;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

export default function Badge({
  text,
  backgroundColor = "#f0b100",
  textColor = "#ffffff",
  style,
}: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor }, style]}>
      <Text style={[styles.text, { color: textColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
});
