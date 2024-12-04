import React from "react";
import { StyleSheet, Linking, TouchableOpacity } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { CustomHeaderView } from "@/components/CustomHeaderView";

export default function Support () {
    const openEmail = () => {
        const email = "savidgeapps@gmail.com";
        const subject = "Feedback for Diagonal Duel";
        const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
        Linking.openURL(mailto).catch((err) =>
            console.error("Failed to open mail app", err)
        );
    };

    return (
        <CustomHeaderView header="Support">
            <ThemedView style={styles.playComputerView}>
                <ThemedText style={styles.thankYouText}>
                    Thank you for playing Diagonal Duel!
                </ThemedText>
                <ThemedText>
                    If you have any feedback, please feel to reach out at the below email address:
                </ThemedText>
                <TouchableOpacity onPress={openEmail}>
                    <ThemedText style={styles.emailLink}>
                        savidgeapps@gmail.com
                    </ThemedText>
                </TouchableOpacity>
            </ThemedView>
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    playComputerView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },

    thankYouText: {
        fontWeight: 'bold',
        fontSize: 20,
        marginBottom: 20
    },

    emailLink: {
        color: "#1E90FF",
        marginTop: 10,
        textDecorationLine: "underline",
    },
  })