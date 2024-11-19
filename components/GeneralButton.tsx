import React from "react";
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";

interface GeneralButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  autoWidth?: boolean;
}

export function GeneralButton({ title, onPress, disabled=false, autoWidth=true }: GeneralButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.generalButton, 
        disabled && styles.disabled, 
        !autoWidth && { width: '100%' }
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  generalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007bff',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
  },
  disabled: {
    backgroundColor: '#cccccc',
    color: '#666666',
  }
});
