import { report } from '@/lib/errorReporting';
import React from "react";
import { Alert, StyleSheet, Linking, TouchableOpacity } from "react-native";
import { sendTestReport } from "@/lib/sentry";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { CustomHeaderView } from "@/components/CustomHeaderView";

const PRIVACY_POLICY_URL = "https://bsav0016.github.io/DiagonalDuelFrontend/privacy.html";

export default function Support () {
    const openEmail = () => {
        const email = "savidgeapps@gmail.com";
        const subject = "Feedback for Diagonal Duel";
        const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
        Linking.openURL(mailto).catch((err) =>
            report(err, { where: 'open mail app' })
        );
    };

    const openPrivacyPolicy = () => {
        Linking.openURL(PRIVACY_POLICY_URL).catch((err) =>
            report(err, { where: 'open privacy policy' })
        );
    };

    // Press and hold the thank-you line to send one harmless test report, to check error reporting from an installed build.
    const sendTest = () => {
        Alert.alert(sendTestReport() ? "Test report sent" : "Error reporting is not on in this build");
    };

    return (
        <CustomHeaderView header="Support">
            <ThemedView style={styles.playComputerView}>
                <ThemedText style={styles.thankYouText} onLongPress={sendTest}>
                    Thank you for playing Diagonal Duel!
                </ThemedText>
                <ThemedText>
                    If you have any feedback, please feel to reach out:
                </ThemedText>
                <TouchableOpacity onPress={openEmail}>
                    <ThemedText style={styles.emailLink}>
                        savidgeapps@gmail.com
                    </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={openPrivacyPolicy}>
                    <ThemedText style={styles.emailLink}>
                        Privacy Policy
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
        fontSize: 22,
        marginBottom: 20,
        textAlign: 'center'
    },

    emailLink: {
        color: "#1E90FF",
        marginTop: 10,
        textDecorationLine: "underline",
    },
  })