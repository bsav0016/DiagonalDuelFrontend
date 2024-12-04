import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ThemedText } from './ThemedText';
import { formatTime } from '@/lib/TimeFormatUtil';

interface CountdownTimerProps {
    timeRemaining: number;
    alignRight?: boolean;
    color?: string
    whenZero?: (() => Promise<void>) | null
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
    timeRemaining, 
    alignRight=false, 
    color='black',
    whenZero=null
}) => {
  const [timeLeft, setTimeLeft] = useState(timeRemaining);

  useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 0) {
                    if (whenZero !== null) {
                        whenZero();
                    }
                    clearInterval(interval);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeRemaining]);

    return (
        <View style={{ flex: 1 }}>
            <ThemedText style={[{ color: color }, alignRight && { textAlign: 'right' }]}>
                {formatTime(timeLeft)}
            </ThemedText>
        </View>
    );
};
