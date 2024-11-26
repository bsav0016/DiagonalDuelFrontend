import React from "react";
import { StyleSheet } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { CustomHeaderView } from "@/components/CustomHeaderView";

export default function Support () {
    return (
        <CustomHeaderView header="Support">
            <ThemedView style={styles.playComputerView}>
                <ThemedText>
                    Support Page Goes Here!
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