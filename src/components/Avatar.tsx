import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface AvatarProps {
  initial: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  style?: ViewStyle;
}

export default function Avatar({
  initial,
  size = 40,
  backgroundColor = '#980ffa',
  textColor = '#ffffff',
  borderColor,
  borderWidth = 0,
  style
}: AvatarProps) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          borderColor,
          borderWidth,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: textColor, fontSize: size * 0.4 }]}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});

