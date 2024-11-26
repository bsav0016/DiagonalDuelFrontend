import React, { useEffect, useState } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { Colors } from '@/constants/Colors';

export function LoadingSpinner() {
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
        <Animated.View
            style={[
                styles.spinner,
                { transform: [{ rotate: spin }] },
            ]}
        />
    );
}

const styles = StyleSheet.create({
    spinner: {
        width: 50,
        height: 50,
        borderWidth: 8,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 50,
        borderTopColor: Colors.button.background,
    },
});
