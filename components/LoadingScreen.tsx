import React, { useEffect, useState } from 'react';
import { StyleSheet, Animated, View } from 'react-native';
import { ThemedView } from './ThemedView';
import { Colors } from '@/constants/Colors';

export function LoadingScreen() {
    const [spinValue] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
            })
        ).start();
    }, [spinValue]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <ThemedView style={styles.loadingScreen}>
            <Animated.View
                style={[
                    styles.spinner,
                    { transform: [{ rotate: spin }] },
                ]}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    loadingScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    spinner: {
        width: 75,
        height: 75,
        borderWidth: 8,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 50,
        borderTopColor: Colors.button.background,
    },
});
