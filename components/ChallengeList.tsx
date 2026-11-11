import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { GeneralButton } from "@/components/GeneralButton";
import { Challenge } from "@/features/challenges/Challenge";

interface ChallengeListProps {
    incoming: Challenge[];
    outgoing: Challenge[];
    onAccept: (challenge: Challenge) => void;
    onDecline: (challenge: Challenge) => void;
    onCancel: (challenge: Challenge) => void;
}

const turns = (days: number) => `${days}-day turns`;

// Challenges waiting for an answer: ones sent to you (accept or decline) and ones you sent (cancel).
export function ChallengeList({ incoming, outgoing, onAccept, onDecline, onCancel }: ChallengeListProps) {
    if (incoming.length === 0 && outgoing.length === 0) {
        return <ThemedText style={styles.empty}>No challenges waiting</ThemedText>;
    }

    return (
        <ThemedView style={styles.list}>
            {incoming.map((challenge) => (
                <ThemedView key={`in-${challenge.id}`} style={styles.incoming}>
                    <ThemedText style={styles.text}>
                        {`${challenge.challenger} ${challenge.rematch ? "wants a rematch" : "challenged you"} (${turns(challenge.days)})`}
                    </ThemedText>
                    <ThemedView style={styles.buttons}>
                        <GeneralButton title="Accept" onPress={() => onAccept(challenge)} fontSize={16} />
                        <GeneralButton title="Decline" onPress={() => onDecline(challenge)} fontSize={16} variant="secondary" />
                    </ThemedView>
                </ThemedView>
            ))}
            {outgoing.map((challenge) => (
                <ThemedView key={`out-${challenge.id}`} style={styles.outgoing}>
                    <ThemedText style={styles.text}>
                        {`Waiting for ${challenge.recipient ?? "someone to open your invite"} (${turns(challenge.days)})`}
                    </ThemedText>
                    <TouchableOpacity testID={`cancel-${challenge.id}`} onPress={() => onCancel(challenge)}>
                        <Text style={styles.cancel}>Cancel</Text>
                    </TouchableOpacity>
                </ThemedView>
            ))}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    list: {
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 20,
    },

    empty: {
        textAlign: "center",
        marginBottom: 15,
    },

    incoming: {
        alignItems: "center",
        gap: 8,
    },

    outgoing: {
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 10,
    },

    buttons: {
        flexDirection: "row",
        gap: 10,
    },

    text: {
        fontSize: 16,
        textAlign: "center",
    },

    cancel: {
        color: "red",
        fontSize: 16,
        textDecorationLine: "underline",
    },
});
