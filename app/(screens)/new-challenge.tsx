import React, { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput } from "react-native";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { GeneralButton } from "@/components/GeneralButton";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/contexts/ToastContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { useGameService } from "@/hooks/useGameService";
import { useThemeColor } from "@/hooks/useThemeColor";
import { CHALLENGE_DAY_OPTIONS } from "@/features/challenges/Challenge";
import { shareInvite } from "@/features/challenges/invite";

export default function NewChallengeScreen() {
    const { addToast } = useToast();
    const { routeBack } = useRouteTo();
    const { sendChallenge, createInvite, enablePushNotifications } = useGameService();
    const color = useThemeColor({}, 'text');
    const [username, setUsername] = useState<string>("");
    const [days, setDays] = useState<number>(CHALLENGE_DAY_OPTIONS[0]);
    const [sending, setSending] = useState<boolean>(false);

    const send = async () => {
        const name = username.trim();
        if (!name) {
            addToast("Enter your friend's username");
            return;
        }
        setSending(true);
        try {
            // A reply is when notifications become useful, so this is when we ask (the system only prompts once).
            await enablePushNotifications().catch(() => {});
            await sendChallenge(name, days);
            addToast(`Challenge sent to ${name}`);
            routeBack();
        } catch (error) {
            // The server's message says why: no such player, already challenged, too many waiting.
            addToast(error instanceof Error ? error.message : "Could not send the challenge");
        } finally {
            setSending(false);
        }
    };

    // An open invite: nobody is named, so whoever gets the link or code first can accept it.
    const sendInvite = async () => {
        setSending(true);
        let created;
        try {
            await enablePushNotifications().catch(() => {});
            created = await createInvite(days);
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Could not create the invite");
            setSending(false);
            return;
        }
        try {
            await shareInvite(created.inviteCode ?? "", days);
        } catch {
            // The invite exists either way: it is listed on Play Online, where it can be shared again.
            addToast("Invite created. Share it again from Play Online.");
        } finally {
            setSending(false);
        }
        routeBack();
    };

    return (
        <CustomHeaderView header="Challenge a Friend">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
                >
                    <ThemedView style={styles.formView}>
                        <ThemedText style={styles.help}>
                            Enter your friend's username. They get a notification and have a week to accept.
                            The game counts toward your rating like any other online game.
                        </ThemedText>
                        <TextInput
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Friend's username"
                            placeholderTextColor={color}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="done"
                            onSubmitEditing={() => Keyboard.dismiss()}
                            style={[styles.textInput, { color: color, borderColor: color }]}
                        />
                        <ThemedText style={styles.help}>Time for each move</ThemedText>
                        <ThemedView style={styles.dayButtons}>
                            {CHALLENGE_DAY_OPTIONS.map((option) => (
                                <GeneralButton
                                    key={option}
                                    title={`${option} ${option === 1 ? "Day" : "Days"}`}
                                    onPress={() => setDays(option)}
                                    variant={option === days ? "primary" : "secondary"}
                                    fontSize={16}
                                />
                            ))}
                        </ThemedView>
                        {sending ? <LoadingSpinner /> : <GeneralButton title="Send Challenge" onPress={send} />}
                        {!sending &&
                            <>
                                <ThemedText style={styles.help}>Or invite someone who is not in the list: you get a link and a code to send them.</ThemedText>
                                <GeneralButton title="Invite With a Link" onPress={sendInvite} variant="secondary" fontSize={18} />
                            </>
                        }
                    </ThemedView>
                </KeyboardAvoidingView>
            </ScrollView>
        </CustomHeaderView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },

    formView: {
        alignItems: 'center',
        paddingHorizontal: 30,
        gap: 12,
        marginBottom: 60,
    },

    help: {
        textAlign: 'center',
    },

    textInput: {
        width: '100%',
        borderWidth: 1,
        borderRadius: 3,
        padding: 6,
        fontSize: 20,
    },

    dayButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
});
