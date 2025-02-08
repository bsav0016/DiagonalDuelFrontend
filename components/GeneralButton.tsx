import { Colors } from "@/constants/Colors";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface GeneralButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  autoWidth?: boolean;
  fontSize?: number;
}

export function GeneralButton({ title, onPress, disabled=false, autoWidth=true, fontSize=20 }: GeneralButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.generalButton, 
        { backgroundColor: Colors.button.background },
        disabled && styles.disabled, 
        !autoWidth && { width: '100%' }
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, { fontSize: fontSize }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  generalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center'
  },
  disabled: {
    backgroundColor: '#cccccc',
    color: '#666666',
  }
});
