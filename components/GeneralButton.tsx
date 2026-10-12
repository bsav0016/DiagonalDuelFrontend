import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface GeneralButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  autoWidth?: boolean;
  fontSize?: number;
  variant?: 'primary' | 'secondary';
}

export function GeneralButton({ title, onPress, disabled=false, autoWidth=true, fontSize=20, variant='primary' }: GeneralButtonProps) {
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const secondary = variant === 'secondary';

  return (
    <TouchableOpacity
      style={[
        styles.generalButton,
        secondary
          ? { backgroundColor: surface, borderColor: border, borderWidth: 1.5, elevation: 0, shadowOpacity: 0 }
          : { backgroundColor: Colors.button.background },
        disabled && styles.disabled,
        !autoWidth && { width: '100%' }
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.buttonText, { fontSize: fontSize }, secondary && { color: Colors.button.background }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  generalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
    shadowColor: '#1c2a6b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center'
  },
  disabled: {
    backgroundColor: Colors.button.disabled,
  }
});
