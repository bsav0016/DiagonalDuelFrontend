import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { GeneralButton } from "@/components/GeneralButton";
import { useRouteTo } from "@/contexts/RouteContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Colors } from "@/constants/Colors";

const STEPS = [
    {
        title: "Take turns",
        body: "Two players alternate, placing one piece per turn. Red goes first, then yellow.",
    },
    {
        title: "Build outward from the corner",
        body: "You can only play on a square that connects to the pieces already in play: any square in the first row or first column, or a square touching an existing piece diagonally up-left, directly above, or directly left of it.",
    },
    {
        title: "Not sure where you can play?",
        body: "Tap Show Valid Moves during a game and every legal square lights up purple.",
    },
    {
        title: "Get four in a row",
        body: "Four of your pieces in a straight line wins, whether across, down or diagonally. If the board fills up with no winner, the game is a draw.",
    },
];

export default function HowToPlay() {
    const { routeBack } = useRouteTo();
    const surface = useThemeColor({}, 'surface');
    const border = useThemeColor({}, 'border');
    const muted = useThemeColor({}, 'muted');

    return (
        <CustomHeaderView header="How to Play" canGoBack={true} goBack={routeBack}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.pieces}>
                    <View style={[styles.piece, { backgroundColor: Colors.board.player1 }]} />
                    <View style={[styles.piece, { backgroundColor: Colors.board.player2 }]} />
                </View>
                {STEPS.map((step, index) => (
                    <ThemedView key={step.title} style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
                        <View style={styles.numberBadge}>
                            <ThemedText style={styles.numberText}>{index + 1}</ThemedText>
                        </View>
                        <ThemedView style={styles.cardText}>
                            <ThemedText style={styles.cardTitle}>{step.title}</ThemedText>
                            <ThemedText style={[styles.cardBody, { color: muted }]}>{step.body}</ThemedText>
                        </ThemedView>
                    </ThemedView>
                ))}
                <View style={styles.gotItWrapper}>
                    <GeneralButton title="Got it" onPress={routeBack} autoWidth={false} />
                </View>
            </ScrollView>
        </CustomHeaderView>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        gap: 12,
    },

    gotItWrapper: {
        paddingHorizontal: 3,
    },

    pieces: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 8,
    },

    piece: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },

    card: {
        flexDirection: 'row',
        gap: 14,
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
    },

    numberBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.button.background,
        alignItems: 'center',
        justifyContent: 'center',
    },

    numberText: {
        color: Colors.button.text,
        fontWeight: '700',
        backgroundColor: 'transparent',
        lineHeight: 22,
    },

    cardText: {
        flex: 1,
        backgroundColor: 'transparent',
        gap: 4,
    },

    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        backgroundColor: 'transparent',
    },

    cardBody: {
        fontSize: 15,
        lineHeight: 21,
        backgroundColor: 'transparent',
    },
});
