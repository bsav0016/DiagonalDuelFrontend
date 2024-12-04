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
            <GeneralButton title="Yes" onPress={onPressYes} 
            />
            <GeneralButton title="No" onPress={onPressNo} />
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    confirmView: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 3,
        marginTop: 10
    },

    confirmText: {
        marginRight: 20
    }
})