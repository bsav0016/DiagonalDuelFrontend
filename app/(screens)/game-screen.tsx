import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Game } from "@/features/game/models/Game";
import { useRouteTo } from "@/contexts/RouteContext";
import { useToast } from "@/contexts/ToastContext";
import { useUser } from "@/contexts/UserContext";
import { useLoading } from "@/contexts/LoadingContext";
import { useGamePoll } from "@/contexts/GamePollContext";
import { Routes } from "./Routes";
import { GameBoard } from "@/features/game/components/GameBoard";
import { StyleSheet } from "react-native";
import { checkWinner, computerMove, getAllValidMoves, hideValidMoves, resetGameInstance, validateMove, WinnerInterface } from "@/features/game/gameUtils";
import { GeneralButton } from "@/components/GeneralButton";
import { Move } from "@/features/game/models/Move";
import { GameType } from "@/features/game/models/GameType";
import { Player } from "@/features/game/models/Player";
import { useGameService } from "@/hooks/useGameService";

export default function GameScreen () {
    const { routeTo, routeBack, routeReplace } = useRouteTo();
    const { addToast } = useToast();
    const { user } = useUser();
    const { setLoading } = useLoading();
    const { makeMove } = useGameService();
    const { pollUserGames } = useGamePoll();

    const params = useLocalSearchParams();
    const gameParam = params.game as string | undefined;
    const parsedGame = gameParam ? JSON.parse(decodeURIComponent(gameParam)) : null;
    if (!parsedGame) {
        addToast('Could not load game');
        routeTo(Routes.HomeScreen);
        return null;
    }

    const [gameInstance, setGameInstance] = useState<Game>(Game.fromParams(parsedGame));
    const [header, setHeader] = useState<string>('');
    const [gameArray, setGameArray] = useState<number[][]>(gameInstance.initializeGameArray());
    const [selectedMove, setSelectedMove] = useState<Move | null>(null);
    const [lastMove, setLastMove] = useState<Move | null>(
        gameInstance.moves.length > 0 ? gameInstance.moves[gameInstance.moves.length - 1] : null
    );
    const [lastUpdated, setLastUpdated] = useState<Date>(
        gameInstance.lastUpdated ? gameInstance.lastUpdated : new Date()
    );
    const [displayConfirm, setDisplayConfirm] = useState<Boolean>(false);
    const [winnerDetails, setWinnerDetails] = useState<WinnerInterface | null>(checkWinner(gameArray));
    const [isComputerProcessing, setIsComputerProcessing] = useState(false);

    const timeDiff: number = gameInstance.moveTime
            ? gameInstance.moveTime - (Date.now() - (gameInstance.lastUpdated ? new Date(gameInstance.lastUpdated).getTime() : 0))
            : 0;

    const timeRemaining: number = timeDiff / 1000;

    useEffect(() => {
        const compMakeMove = async () => {
            if (gameInstance.isComputerTurn()) {
                const computerPlayer = gameInstance.computerPlayer()
                if (!computerPlayer) {
                    addToast('Computer has given up!');
                    return;
                }
                await computerTurn(computerPlayer, gameInstance);
            }
        }

        compMakeMove();
    }, []);

    useEffect(() => {
        setHeader(() => {
            if (gameInstance.winner) {
                return gameInstance.winner;
            }
            if (gameInstance.moves.length % 2 === 0) {
                return `${gameInstance.player1.username}'s Turn`
            } else {
                return `${gameInstance.player2.username}'s Turn`
            }
        })
    }, [gameInstance]);

    useEffect(() => {
        if (gameInstance.gameType === GameType.Online && !user) {
            routeReplace(Routes.Login);
        }
    }, [user])

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

    const computerTurn = async (computerPlayer: Player, newGameInstance: Game) => {
        const move: Move | null = await computerMove(gameArray, computerPlayer);
        if (!move) {
            addToast('Computer did not find a valid move!');
            return;
        }
        setSelectedMove(move);
        const compPlayerNum = computerPlayer === gameInstance.player1 ? 1 : 2;
        const updatedGameArray = [...gameArray];
        updatedGameArray[move.row][move.column] = compPlayerNum;
        setGameArray(updatedGameArray);

        let updatedGameInstance = new Game (
            newGameInstance.gameType,
            newGameInstance.gameId,
            newGameInstance.player1,
            newGameInstance.player2,
            [...newGameInstance.moves, move],
            new Date(),
            newGameInstance.moveTime
        );
    
        const winner = checkWinner(updatedGameArray);
        if (winner) {
            const thisWinner: string = `Computer Wins!`;
            updatedGameInstance.winner = thisWinner;
            setWinnerDetails(winner);
        }
        
        setGameInstance(updatedGameInstance); 
        setLastMove(move);
        resetSelectedButton();
        updateAvailableMoves(true);
    }

    const executeMove = async (row: number, col: number) => {
        if (isComputerProcessing) {
            return;
        }
        if (gameInstance.gameType === GameType.Online) {
            setLoading(true);
            try {
                if (!gameInstance.gameId) {
                    throw new Error("No game ID");
                }
                await makeMove(gameInstance.gameId, row, col);
                await pollUserGames();
                routeBack();
            } catch (error) {
                console.error(error);
                addToast("Network error while making move")
            } finally {
                setLoading(false);
                resetSelectedButton();
            }
        } else {
            const currentPlayer = gameInstance.playerTurn();
            
            let newGameInstance = new Game (
                gameInstance.gameType,
                gameInstance.gameId,
                gameInstance.player1,
                gameInstance.player2,
                [...gameInstance.moves],
                lastUpdated,
                gameInstance.moveTime
            );
            await newGameInstance.addMove(currentPlayer, row, col);
            
            setGameInstance(newGameInstance); 
            setLastMove(selectedMove);
            resetSelectedButton();
            updateAvailableMoves(true);
        
            const winner = checkWinner(gameArray);
            if (winner) {
                const thisWinner: string = `${currentPlayer.username} Wins!`;
                newGameInstance.winner = thisWinner;
                setWinnerDetails(winner);
            } 
            else if (newGameInstance.isComputerTurn()) {
                setIsComputerProcessing(true);
                const computerPlayer = newGameInstance.computerPlayer();
                if (!computerPlayer) {
                    addToast('Computer player has left the game');
                    setIsComputerProcessing(false);
                    return;
                }
                await computerTurn(computerPlayer, newGameInstance);
                setIsComputerProcessing(false);
            }
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
            setWinnerDetails(null);
        });
    }

    const timeExpired = async () => {
        const waitingPlayer: Player = gameInstance.playerWaiting();
        const winner: string = `${waitingPlayer.username} Wins by Timeout`
        let newGameInstance = new Game (
            gameInstance.gameType,
            gameInstance.gameId,
            gameInstance.player1,
            gameInstance.player2,
            gameInstance.moves,
            lastUpdated,
            gameInstance.moveTime,
            winner
        );
        setGameInstance(newGameInstance);
    }

    return (
        <CustomHeaderView header={header}>
            <ThemedView style={styles.gameBoard}>
                <ThemedView style={styles.winnerView}>
                    { (!gameInstance.winner && 
                        !selectedMove && 
                        !(gameInstance.gameType === GameType.Online && user && gameInstance.turnUsername() !== user.username)
                    ) ? (
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
                    time={gameInstance.gameType === GameType.Online && !gameInstance.winner ? timeRemaining : null}
                    winnerDetails={winnerDetails}
                    resetClicked={resetBoard}
                    timeExpired={timeExpired}
                    disabled={
                        (gameInstance.isComputerTurn() || 
                        !!gameInstance.winner || 
                        (gameInstance.gameType === GameType.Online && !!user && gameInstance.turnUsername() !== user.username)) 
                    }
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