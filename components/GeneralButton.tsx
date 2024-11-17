import React from "react";
import { Button, StyleSheet, Text, TouchableOpacity } from "react-native";

interface GeneralButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function GeneralButton({ title, onPress, disabled=false }: GeneralButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.generalButton, disabled && styles.disabled]}
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
    fontSize: 16,
  },
  disabled: {
    backgroundColor: '#cccccc',
    color: '#666666',
  }
});
