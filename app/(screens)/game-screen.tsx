import React, { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Game } from "@/features/game/models/Game";
import { useRouteTo } from "@/contexts/RouteContext";
import { useToast } from "@/contexts/ToastContext";
import { Routes } from "./Routes";
import { GameBoard } from "@/features/game/components/GameBoard";
import { StyleSheet } from "react-native";
import { validateMove } from "@/features/game/gameUtils";
import { GeneralButton } from "@/components/GeneralButton";


export default function GameScreen () {
    const { routeTo } = useRouteTo();
    const { addToast } = useToast();

    const params = useLocalSearchParams();
    const gameParam = params.game as string | undefined;
    const parsedGame = gameParam ? JSON.parse(decodeURIComponent(gameParam)) : null;
    if (!parsedGame) {
        addToast('Could not load game');
        routeTo(Routes.HomeScreen);
        return null;
    }

    const [gameInstance, setGameInstance] = useState<Game>(Game.fromParams(parsedGame));
    const [header, setHeader] = useState<string>(`${gameInstance.player1.username}'s Turn`);
    const [gameArray, setGameArray] = useState<number[][]>(gameInstance.initializeGameArray());
    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [selectedCol, setSelectedCol] = useState<number | null>(null);
    const [lastRow, setLastRow] = useState<number | null>(
        gameInstance.moves.length > 0 ? gameInstance.moves[gameInstance.moves.length - 1].row : null
    );
    const [lastCol, setLastCol] = useState<number | null>(
        gameInstance.moves.length > 0 ? gameInstance.moves[gameInstance.moves.length - 1].column : null
    );
    const [displayConfirm, setDisplayConfirm] = useState<Boolean>(false);

    const updateGameArray = (row: number, col: number, val: number) => {
        const updatedGameArray = [...gameArray];
        updatedGameArray[row][col] = val;
        setGameArray(updatedGameArray);
    }

    const handleCellClick = (row: number, col: number) => {
        unselectedButton();
        if (!validateMove(gameArray, row, col)) {
            resetSelectedButton();
            addToast('Invalid Move');
            return;
        }
        const currentPlayer = gameInstance.playerTurn();
        updateGameArray(row, col, currentPlayer === gameInstance.player1 ? 1 : 2);
        setSelectedRow(row);
        setSelectedCol(col);
        setDisplayConfirm(true);
    };

    const executeMove = () => {
        if (selectedRow === null || selectedCol === null) {
            addToast('Internal error occurred');
            console.error('Row or column not set');
            return;
        }
        const currentPlayer = gameInstance.playerTurn();        
        
        const newGameInstance = new Game (
            gameInstance.gameType,
            gameInstance.player1,
            gameInstance.player2,
            [...gameInstance.moves]
        )
        newGameInstance.addMove(currentPlayer, selectedRow, selectedCol)
        setGameInstance(newGameInstance);        
    
        if (newGameInstance.determineWinner()) {
            setHeader(`${currentPlayer.username} Wins!`);
        } else {
            setHeader(
                `${newGameInstance.playerTurn().username}'s Turn`
            );
        }
        setLastRow(selectedRow);
        setLastCol(selectedCol);
        resetSelectedButton();
    }

    const resetSelectedButton = () => {
        setDisplayConfirm(false);
        setSelectedRow(null);
        setSelectedCol(null);
    }

    const unselectedButton = () => {
        if (selectedRow !== null && selectedCol !== null) {
            updateGameArray(selectedRow, selectedCol, 0);
        }
    }

    return (
        <CustomHeaderView header={header}>
            <ThemedView style={styles.gameBoard}>
                <GameBoard 
                    gameArray={gameArray}
                    selectedRow={selectedRow}
                    selectedCol={selectedCol}
                    lastRow={lastRow}
                    lastCol={lastCol}
                    disabled={ gameInstance.isComputerTurn() || !!gameInstance.winner }
                    onCellClick={handleCellClick} 
                />
            </ThemedView>
            { displayConfirm &&
            <ThemedView style={styles.confirmView}>
                <ThemedText style={styles.confirmText}>
                    Confirm Move?
                </ThemedText>
                <GeneralButton title="Yes" onPress={() => executeMove()} />
                <GeneralButton title="No" onPress={() => {resetSelectedButton(), unselectedButton()}} />
            </ThemedView>
            }
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    gameBoard: {
        alignItems: 'center',
        justifyContent: 'center'
    },

    confirmView: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 3,
        marginTop: 10
    },

    confirmText: {
        marginRight: 20
    }
})