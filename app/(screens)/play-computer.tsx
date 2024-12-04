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


export default function PlayComputer () {
    const color = useThemeColor({}, 'text');
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
                <GeneralButton 
                    title="2 Player Game" 
                    onPress={startLocalGame} 
                />
                
            </ThemedView>
            <ThemedView style={styles.playComputerView}>
                <ThemedView style={styles.levelView}>
                    <ThemedText>
                        Level:
                    </ThemedText>
                    <TextInput
                        style={[styles.input, { borderColor: color, color: color }]}
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
                />
                <GeneralButton
                    title="Start Computer Game"
                    onPress={startComputerGame}
                />
            </ThemedView>
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    twoPlayerButtonView: {
      flex: 2,
      justifyContent: 'center',
      alignItems: 'center'
    },

    playComputerView: {
        flex: 3,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 40
    },

    levelView: {
        flexDirection: 'row'
    },

    input: {
        marginLeft: 10,
        width: 50,
        borderWidth: 1,
        borderRadius: 5,
        textAlign: 'center',
        fontSize: 20
    },

    slider: {
        width: '100%'
    }
  })