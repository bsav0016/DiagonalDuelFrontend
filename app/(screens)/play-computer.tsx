import React, { useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { GeneralButton } from "@/components/GeneralButton";
import Slider from "@react-native-community/slider";
import { useToast } from "@/contexts/ToastContext";
import { Player } from "@/features/game/models/Player";
import { Game } from "@/features/game/models/Game";
import { GameType } from "@/features/game/models/GameType";
import { useRouteTo } from "@/contexts/RouteContext";
import { Routes } from "./Routes";
import { Colors } from "@/constants/Colors";


export default function PlayComputer () {
    const color = useThemeColor({}, 'text');
    const surface = useThemeColor({}, 'surface');
    const border = useThemeColor({}, 'border');
    const muted = useThemeColor({}, 'muted');
    const [level, setLevel] = useState('0');
    const { addToast } = useToast();
    const { routeTo } = useRouteTo();

    const levelNumber = isNaN(parseInt(level, 10)) ? 0 : parseInt(level, 10);

    const setLevelSlider = (value: number) => {
        setLevel(`${value}`);
    }

    const handleLevelInput = (value: string) => {
        if (value === '') {
            setLevel('');
        }
        const parsedValue = parseInt(value, 10);
        if (!isNaN(parsedValue)) {
            if (parsedValue < 0) {
                addToast("Level can't be negative");
            } else if (parsedValue > 100) {
                addToast("Max level is 100");
            } else {
                setLevel(value);
            }
        }
    };

    const startLocalGame = () => {
        const player1: Player = new Player("Player 1");
        const player2: Player = new Player("Player 2");
        startGame(player1, player2, false);
    }

    const startComputerGame = () => {
        const computerPlayer: Player = new Player("Computer", 0, levelNumber);
        const userPlayer: Player = new Player("Player");
        const computerFirst: Boolean = Math.random() < 0.5;
        const player1: Player = computerFirst ? computerPlayer : userPlayer;
        const player2: Player = computerFirst ? userPlayer : computerPlayer;
        startGame(player1, player2, true);
    }

    const startGame = (player1: Player, player2: Player, computerGame: Boolean) => {
        const gameType: GameType = computerGame ? GameType.Computer : GameType.TwoPlayer;
        const game: Game = new Game(gameType, null, player1, player2);
        const serializedGame = encodeURIComponent(JSON.stringify(game));
        routeTo(Routes.Game, { game: serializedGame });
    }

    return (
        <CustomHeaderView header="Play Computer">
            <ThemedView style={styles.twoPlayerButtonView}>
                <ThemedView style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
                    <ThemedText style={[styles.cardTitle, { color: muted }]}>SAME DEVICE</ThemedText>
                    <GeneralButton
                        title="2 Player Game"
                        onPress={startLocalGame}
                        autoWidth={false}
                        variant="secondary"
                    />
                </ThemedView>
            </ThemedView>
            <ThemedView style={styles.playComputerView}>
                <ThemedView style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
                    <ThemedText style={[styles.cardTitle, { color: muted }]}>AGAINST THE COMPUTER</ThemedText>
                    <ThemedView style={[styles.levelView, { backgroundColor: surface }]}>
                        <ThemedText style={{ backgroundColor: surface }}>
                            Level:
                        </ThemedText>
                        <TextInput
                            style={[styles.input, { borderColor: border, color: color, backgroundColor: surface }]}
                            value={String(level)}
                            onChangeText={handleLevelInput}
                            keyboardType="numeric"
                        />
                    </ThemedView>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={100}
                        step={1}
                        value={levelNumber}
                        onValueChange={(value) => setLevelSlider(value)}
                        minimumTrackTintColor={Colors.button.background}
                        thumbTintColor={Colors.button.background}
                        maximumTrackTintColor="#c3cadb"
                    />
                    <GeneralButton
                        title="Start Computer Game"
                        onPress={startComputerGame}
                        autoWidth={false}
                    />
                </ThemedView>
            </ThemedView>
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    twoPlayerButtonView: {
      flex: 2,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20
    },

    playComputerView: {
        flex: 3,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 20
    },

    card: {
        width: '100%',
        borderRadius: 20,
        borderWidth: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: 'center',
        shadowColor: '#1c2a6b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 2,
    },

    cardTitle: {
        width: '100%',
        textAlign: 'left',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: 8,
    },

    levelView: {
        flexDirection: 'row',
        alignItems: 'center'
    },

    input: {
        marginLeft: 10,
        width: 64,
        height: 44,
        borderWidth: 1.5,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 20
    },

    slider: {
        width: '100%',
        marginVertical: 6
    }
  })