import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Colors } from "@/constants/Colors";

interface PlayerChipsProps {
    player1Name: string;
    player2Name: string;
    // 1 or 2 for the player to move, null once the game is over.
    activePlayer: 1 | 2 | null;
}

function Chip({ name, color, active }: { name: string; color: string; active: boolean }) {
    const surface = useThemeColor({}, 'surface');
    const border = useThemeColor({}, 'border');
    const tint = useThemeColor({}, 'tint');

    return (
        <View style={[styles.chip, { backgroundColor: surface, borderColor: active ? tint : border }, active && styles.chipActive]}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <ThemedText style={[styles.name, { backgroundColor: 'transparent' }, active && styles.nameActive]} numberOfLines={1}>
                {name}
            </ThemedText>
        </View>
    );
}

// Shows each player's piece colour and whose move it is, so the board needs no explanation.
export function PlayerChips({ player1Name, player2Name, activePlayer }: PlayerChipsProps) {
    return (
        <View style={styles.row}>
            <Chip name={player1Name} color={Colors.board.player1} active={activePlayer === 1} />
            <Chip name={player2Name} color={Colors.board.player2} active={activePlayer === 2} />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 16,
    },
    chip: {
        flex: 1,
        maxWidth: 170,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    chipActive: {
        borderWidth: 2.5,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    name: {
        flexShrink: 1,
        fontSize: 15,
    },
    nameActive: {
        fontWeight: '700',
    },
});
