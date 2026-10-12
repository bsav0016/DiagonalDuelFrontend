import { GeneralButton } from "@/components/GeneralButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { StyleSheet } from "react-native";

interface ConfirmViewProps {
    onPressYes: () => void;
    onPressNo: () => void;
}

export function ConfirmView({ onPressYes, onPressNo }: ConfirmViewProps) {
    return (
        <ThemedView style={styles.confirmView}>
            <ThemedText style={styles.confirmText}>
                Confirm Move?
            </ThemedText>
            <GeneralButton title="Yes" onPress={onPressYes} fontSize={18} />
            <GeneralButton title="No" onPress={onPressNo} fontSize={18} variant="secondary" />
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    confirmView: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 10
    },

    confirmText: {
        marginRight: 14,
        fontWeight: '600'
    }
})
