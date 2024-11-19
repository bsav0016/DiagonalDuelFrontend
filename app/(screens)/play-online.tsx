import React from "react";
import { StyleSheet } from "react-native";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";

export default function PlayOnline () {
    return (
        <CustomHeaderView header="Play Online">
            <ThemedView style={styles.playComputerView}>
                <ThemedText>
                    Play Online
                </ThemedText>
            </ThemedView>
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    playComputerView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    }
  })