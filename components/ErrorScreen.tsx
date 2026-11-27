import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { GeneralButton } from '@/components/GeneralButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { report } from '@/lib/errorReporting';

interface ErrorScreenProps {
    error: Error;
    retry: () => void;
}

/** Shown instead of a blank screen when a screen fails to draw. expo-router passes the error and a way to try again. */
export function ErrorScreen({ error, retry }: ErrorScreenProps) {
    useEffect(() => {
        report(error, { where: 'screen failed to draw', fatal: true });
    }, [error]);

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.title}>Something went wrong</ThemedText>
            <ThemedText style={styles.message}>
                Diagonal Duel ran into a problem. Your games are safe on the server. Try again, and if it keeps happening, close and reopen the app.
            </ThemedText>
            <GeneralButton title="Try again" onPress={retry} />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
    title: { textAlign: 'center' },
    message: { textAlign: 'center' },
});
