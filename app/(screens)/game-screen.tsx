import React, { useEffect, useState } from "react";
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
import { checkWinner, computerMove, getAllValidMoves, hideValidMoves, resetGameInstance, validateMove } from "@/features/game/gameUtils";
import { GeneralButton } from "@/components/GeneralButton";
import { Move } from "@/features/game/models/Move";
import { GameType } from "@/features/game/models/GameType";
import { Player } from "@/features/game/models/Player";


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
    const [selectedMove, setSelectedMove] = useState<Move | null>(null);
    const [lastMove, setLastMove] = useState<Move | null>(
        gameInstance.moves.length > 0 ? gameInstance.moves[gameInstance.moves.length - 1] : null
    );
    const [lastUpdated, setLastUpdated] = useState<Date>(
        gameInstance.lastUpdated ? gameInstance.lastUpdated : new Date()
    );
    const [time, setTime] = useState<number | null>(null);
    const [displayConfirm, setDisplayConfirm] = useState<Boolean>(false);

    useEffect(() => {
        if (gameInstance.isComputerTurn()) {
            const computerPlayer = gameInstance.computerPlayer()
            if (!computerPlayer) {
                addToast('Computer has given up!');
                return;
            }
            computerTurn(computerPlayer);
        }
    }, [])

    useEffect(() => {
        if (!lastUpdated || !gameInstance.moveTime) return;

        const currentTime = new Date().getTime();
        const lastUpdatedTime = new Date(lastUpdated).getTime();
        const initialTime = currentTime - lastUpdatedTime - gameInstance.moveTime;

        setTime(Math.max(0, initialTime));

        const interval = setInterval(() => {
            setTime(prevTime => {
                if (prevTime === null || prevTime <= 0) {
                    clearInterval(interval);
                    return null;
                }
                return prevTime - 1000;
            });
        }, 1000);

        return () => clearInterval(interval);

    }, [lastUpdated]);

    const updateGameArray = (move: Move, val: number) => {
        const updatedGameArray = [...gameArray];
        updatedGameArray[move.row][move.column] = val;
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
        const move = new Move(currentPlayer, row, col);
        updateGameArray(move, currentPlayer === gameInstance.player1 ? 1 : 2);
        setSelectedMove(move);
        setDisplayConfirm(true);
    };

    const computerTurn = (computerPlayer: Player) => {
        console.log("Here")
        const move: Move | null = computerMove(gameArray, computerPlayer);
        console.log(move);
        if (!move) {
            addToast('Computer did not find a valid move!');
            return;
        }
        console.log(move)
        setSelectedMove(move);
        updateGameArray(move, computerPlayer === gameInstance.player1 ? 1 : 2);
        executeMove(move.row, move.column);
    }

    const executeMove = (row: number, col: number) => {
        const currentPlayer = gameInstance.playerTurn();
        
        let newGameInstance = new Game (
            gameInstance.gameType,
            gameInstance.player1,
            gameInstance.player2,
            [...gameInstance.moves],
            lastUpdated
        );
        newGameInstance.addMove(currentPlayer, row, col);       
    
        if (checkWinner(gameArray)) {
            const winner: string = `${currentPlayer.username} Wins!`
            setHeader(winner);
            newGameInstance.winner = winner
        } else {
            setHeader(
                `${newGameInstance.playerTurn().username}'s Turn`
            );
        }
        setGameInstance(newGameInstance); 
        setLastMove(selectedMove);
        resetSelectedButton();
        updateAvailableMoves(true);
        if (newGameInstance.isComputerTurn()) {
            const computerPlayer = newGameInstance.computerPlayer();
            if (!computerPlayer) {
                addToast('Computer player has left the game');
                return;
            }
            computerTurn(computerPlayer);
        }
    }

    const resetSelectedButton = () => {
        setDisplayConfirm(false);
        setSelectedMove(null);
    }

    const unselectedButton = () => {
        if (selectedMove !== null) {
            updateGameArray(selectedMove, 0);
        }
    }

    const updateAvailableMoves = (hide: Boolean) => {
        const newGameArray: number[][] = hide ? hideValidMoves(gameArray) : getAllValidMoves(gameArray);
        setGameArray(newGameArray);
    }

    const resetBoard = gameInstance.gameType === GameType.Online ? null : () => {
        addToast('Confirm Reset?', () => {
            const newGameArray: number[][] = [];
            for (let i = 0; i < 8; i++) {
                newGameArray[i] = new Array(8).fill(0);
            }
            setGameArray(newGameArray);
            setLastMove(null);
            resetSelectedButton();
            const newGameInstance = resetGameInstance(gameInstance);
            setGameInstance(newGameInstance);
            setHeader(`${newGameInstance.player1.username}'s Turn`);
        });
    }

    return (
        <CustomHeaderView header={header}>
            <ThemedView style={styles.gameBoard}>
                <ThemedView style={styles.winnerView}>
                    { (!gameInstance.winner && !selectedMove) ?
                    (
                        gameArray.some(row => row.includes(3)) ?
                        <GeneralButton title='Hide Valid Moves' onPress={() => updateAvailableMoves(true)} />
                        :
                        <GeneralButton title='Show Valid Moves' onPress={() => updateAvailableMoves(false)} />
                    ) :
                    null
                    }
                </ThemedView>

                <GameBoard 
                    gameArray={gameArray}
                    selectedMove={selectedMove}
                    lastMove={lastMove}
                    time={gameInstance.gameType === GameType.Online ? time : null}
                    resetClicked={resetBoard}
                    disabled={ gameInstance.isComputerTurn() || !!gameInstance.winner }
                    onCellClick={handleCellClick} 
                />
            </ThemedView>
            { displayConfirm &&
            <ThemedView style={styles.confirmView}>
                <ThemedText style={styles.confirmText}>
                    Confirm Move?
                </ThemedText>
                <GeneralButton 
                    title="Yes" 
                    onPress={() => {
                        if (!selectedMove) {
                            addToast('Internal error occurred');
                            console.error('Selected move not set before confirm move');
                            return;
                        }
                        executeMove(selectedMove.row, selectedMove.column)
                    }} 
                />
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

    winnerView: {
        height: 50,
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