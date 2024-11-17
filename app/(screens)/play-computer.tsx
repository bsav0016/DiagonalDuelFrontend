import React from "react";
import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";

export default function PlayComputer () {
    const router = useRouter();

    return (
        <ThemedView style={styles.playComputerView}>
            <ThemedText>
                Play computer
            </ThemedText>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    playComputerView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    }
  })