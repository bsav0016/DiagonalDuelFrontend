import React, { useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { GeneralButton } from "@/components/GeneralButton";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/contexts/ToastContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { useUser } from "@/contexts/UserContext";
import { useGamePoll } from "@/contexts/GamePollContext";
import { useGameService } from "@/hooks/useGameService";
import { useThemeColor } from "@/hooks/useThemeColor";
import { InvitePreview } from "@/features/challenges/ChallengeService";
import { Routes } from "./Routes";

// After the app opens from a link the stored user takes a moment to load, so wait before saying nobody is signed in.
const USER_WAIT_MS = 3000;

// Opened from an invite link (the code is filled in and looked up) or from Play Online > Join with a Code.
export default function JoinChallengeScreen() {
    const { addToast } = useToast();
    const { routeBack, routeReplace } = useRouteTo();
    const { user } = useUser();
    const { pollUserGames } = useGamePoll();
    const { previewInvite, acceptInvite } = useGameService();
    const color = useThemeColor({}, 'text');
    const params = useLocalSearchParams();
    const linkedCode = typeof params.code === "string" ? params.code : "";

    const [code, setCode] = useState<string>(linkedCode);
    const [preview, setPreview] = useState<InvitePreview | null>(null);
    const [working, setWorking] = useState<boolean>(false);
    const [waited, setWaited] = useState<boolean>(false);

    useEffect(() => {
        const timer = setTimeout(() => setWaited(true), USER_WAIT_MS);
        return () => clearTimeout(timer);
    }, []);

    const lookUp = async (value: string) => {
        if (!value.trim()) {
            addToast("Enter the code your friend sent you");
            return;
        }
        setWorking(true);
        try {
            setPreview(await previewInvite(value));
        } catch (error) {
            setPreview(null);
            addToast(error instanceof Error ? error.message : "Could not look up that code");
        } finally {
            setWorking(false);
        }
    };

    // A code that came with the link is looked up as soon as we know who is signed in. The ref keeps this effect
    // to running when that changes, not on every render.
    const lookUpRef = useRef(lookUp);
    useEffect(() => { lookUpRef.current = lookUp; });
    const signedIn = user !== null;
    useEffect(() => {
        if (signedIn && linkedCode) lookUpRef.current(linkedCode);
    }, [signedIn, linkedCode]);

    const accept = async () => {
        setWorking(true);
        try {
            const game = await acceptInvite(code);
            await pollUserGames();
            routeReplace(Routes.Game, { game: encodeURIComponent(JSON.stringify(game)) });
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Could not accept the invite");
            setPreview(null);
        } finally {
            setWorking(false);
        }
    };

    const changeCode = (value: string) => {
        setCode(value);
        setPreview(null);
    };

    if (!user) {
        return (
            <CustomHeaderView header="Join a Game" goBack={() => routeReplace(Routes.HomeScreen)}>
                <ThemedView style={styles.formView}>
                    {waited ? (
                        <>
                            <ThemedText style={styles.help}>
                                {"Sign in or create an account first. Then open the link again, or enter the code under Play Online > Join with a Code."}
                            </ThemedText>
                            <GeneralButton title="Sign In" onPress={() => routeReplace(Routes.Login)} />
                        </>
                    ) : (
                        <LoadingSpinner />
                    )}
                </ThemedView>
            </CustomHeaderView>
        );
    }

    return (
        <CustomHeaderView header="Join a Game" goBack={() => routeBack()}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
                >
                    <ThemedView style={styles.formView}>
                        <ThemedText style={styles.help}>Enter the code a friend sent you to see who is asking.</ThemedText>
                        <TextInput
                            value={code}
                            onChangeText={changeCode}
                            placeholder="Code"
                            placeholderTextColor={color}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            returnKeyType="done"
                            onSubmitEditing={() => Keyboard.dismiss()}
                            style={[styles.textInput, { color: color, borderColor: color }]}
                        />
                        {working ? <LoadingSpinner /> : !preview && <GeneralButton title="Look Up" onPress={() => lookUp(code)} />}
                        {preview && !working && (
                            preview.canAccept ? (
                                <>
                                    <ThemedText style={styles.help}>
                                        {`${preview.challenge.challenger} invites you to play, with ${preview.challenge.days}-day turns.`}
                                    </ThemedText>
                                    <GeneralButton title="Accept" onPress={accept} />
                                </>
                            ) : (
                                <ThemedText style={styles.help}>
                                    This invite cannot be accepted. It may be yours, already taken, cancelled or out of date.
                                </ThemedText>
                            )
                        )}
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
        textAlign: 'center',
        letterSpacing: 2,
    },
});
