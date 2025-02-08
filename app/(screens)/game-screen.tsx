import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedView } from "@/components/ThemedView";
import { Game } from "@/features/game/models/Game";
import { useRouteTo } from "@/contexts/RouteContext";
import { ToastAction, useToast } from "@/contexts/ToastContext";
import { useUser } from "@/contexts/UserContext";
import { useLoading } from "@/contexts/LoadingContext";
import { useGamePoll } from "@/contexts/GamePollContext";
import { Routes } from "./Routes";
import { GameBoard } from "@/features/game/components/GameBoard";
import { StyleSheet } from "react-native";
import { checkWinner, getAllValidMoves, hideValidMoves, resetGameInstance, validateMove, WinnerInterface } from "@/features/game/gameUtils";
import { GeneralButton } from "@/components/GeneralButton";
import { Move } from "@/features/game/models/Move";
import { GameType } from "@/features/game/models/GameType";
import { Player } from "@/features/game/models/Player";
import { useGameService } from "@/hooks/useGameService";
import { GameAI } from "@/features/game/models/GameAI";
import { ConfirmView } from "@/features/game/components/ConfirmView";


export default function GameScreen () {
    const { routeTo, routeBack, routeReplace } = useRouteTo();
    const { addToast } = useToast();
    const { userRef, updateUserComputerScore } = useUser();
    const { setLoading } = useLoading();
    const { makeMove, updateComputerScore } = useGameService();
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
    const [header, setHeader] = useState<string>(() => {
        if (gameInstance.winner) {
            return gameInstance.winner;
        } else {
            return ''
        }
    });
    const [gameArray, setGameArray] = useState<number[][]>(gameInstance.initializeGameArray());
    const [selectedMove, setSelectedMove] = useState<Move | null>(null);
    const [lastMove, setLastMove] = useState<Move | null>(
        gameInstance.moves.length > 0 ? gameInstance.moves[gameInstance.moves.length - 1] : null
    );
    const [displayConfirm, setDisplayConfirm] = useState<Boolean>(false);
    const [winnerDetails, setWinnerDetails] = useState<WinnerInterface | null>(checkWinner(gameArray));
    const [isComputerProcessing, setIsComputerProcessing] = useState(false);
    const [gameAI, setGameAI] = useState<GameAI | null>(null);
    const [computerTurn, setComputerTurn] = useState(false);
    

    const timeDiff: number = gameInstance.moveTime
            ? gameInstance.moveTime - (Date.now() - (gameInstance.lastUpdated ? new Date(gameInstance.lastUpdated).getTime() : 0))
            : 0;

    const timeRemaining: number = timeDiff / 1000;
    const lastUpdated = gameInstance.lastUpdated ? gameInstance.lastUpdated : new Date();


    useEffect(() => {
        if (gameInstance.gameType === GameType.Online && !userRef.current) {
            routeReplace(Routes.Login);
        }
    }, [userRef.current]);

    useEffect(() => {
        if (!gameInstance.winner) {
            const newGameArray = gameInstance.initializeGameArray();
            const winner = checkWinner(newGameArray);
            if (winner) {
                const winnerPlayer: Player = winner.player === 1 ? gameInstance.player1 : gameInstance.player2
                updateWinner(`${winnerPlayer.username} wins!`);
                if (gameInstance.gameType === GameType.Computer) {
                    const computerPlayer = gameInstance.computerPlayer();
                    if (computerPlayer && computerPlayer !== winnerPlayer && computerPlayer.computerLevel && userRef.current) {
                        try {
                            updateComputerScore(computerPlayer.computerLevel);
                            updateUserComputerScore(computerPlayer.computerLevel);
                        } catch {
                            console.error("Could not update user's computer score")
                        }
                    }
                }
                setWinnerDetails(winner);
            } else {
                setHeader(() => {
                    if (gameInstance.moves.length % 2 === 0) {
                        return `${gameInstance.player1.username}'s Turn`
                    } else {
                        return `${gameInstance.player2.username}'s Turn`
                    }
                });
            }

            setGameArray(newGameArray);
            if (!winner) {
                setComputerTurn(gameInstance.isComputerTurn());
            }
        }
    }, [gameInstance]);

    useEffect(() => {
        const checkComputerTurn = async () => {
            if (computerTurn && !isComputerProcessing) {
                setIsComputerProcessing(true);
                const compPlayer = gameInstance.computerPlayer();
                if (!compPlayer) {
                    addToast("Computer left the match");
                    setHeader("Player wins by default!")
                    return;
                }

                try {
                    let usedAI: GameAI;
                    if (gameAI) {
                        usedAI = gameAI;
                    } else {
                        const compNumber = compPlayer.username === gameInstance.player1.username ? 1 : 2
                        const computerLevel = compPlayer.computerLevel || 1;
                        usedAI = new GameAI(computerLevel, gameArray, compPlayer, compNumber);
                        setGameAI(usedAI);
                    }
        
                    const aiMove = await usedAI.computeMove(gameInstance);
                    if (aiMove) {
                        setGameInstance(aiMove.updatedGame);
                        setSelectedMove(null);
                        setLastMove(aiMove.newMove);
                    } else {
                        addToast("Computer couldn't find a move");
                        setHeader("Player wins by default!")
                    }
                } catch (error) {
                    console.error(error);
                    addToast("Unexpected error. Please restart game.")
                } finally {
                    setIsComputerProcessing(false);
                }
            }
        }

        checkComputerTurn();
    }, [computerTurn]);

    const updateWinner = (winner: string) => {
        setHeader(winner);
        const newGameInstance = new Game(
            gameInstance.gameType,
            gameInstance.gameId,
            gameInstance.player1,
            gameInstance.player2,
            gameInstance.moves,
            gameInstance.lastUpdated,
            gameInstance.moveTime,
            winner
        );
        setGameInstance(newGameInstance);
    }

    const updateMoves = (move: Move) => {
        const newGameInstance = new Game(
            gameInstance.gameType,
            gameInstance.gameId,
            gameInstance.player1,
            gameInstance.player2,
            [...gameInstance.moves, move],
            gameInstance.lastUpdated,
            gameInstance.moveTime,
            gameInstance.winner
        );
        setGameInstance(newGameInstance);
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

    const handleCellClick = (row: number, col: number) => {
        setSelectedMove(null);
        if (!validateMove(gameArray, row, col)) {
            setDisplayConfirm(false);
            addToast('Invalid Move');
            return;
        }
        const currentPlayer = gameInstance.playerTurn();
        const move = new Move(currentPlayer, row, col);
        setDisplayConfirm(true);
        setSelectedMove(move);
    };

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
            }
        } else {
            const currentPlayer = gameInstance.playerTurn();
            const move = new Move(currentPlayer, row, col);
            updateMoves(move);
            setLastMove(selectedMove);
            resetSelectedButton();
            updateAvailableMoves(false);
        }
    }

    const resetSelectedButton = () => {
        setDisplayConfirm(false);
        setSelectedMove(null);
    }

    const updateAvailableMoves = (show: Boolean) => {
        const newGameArray: number[][] = show ? getAllValidMoves(gameArray) : hideValidMoves(gameArray);
        setGameArray(newGameArray);
    }

    const resetBoard = gameInstance.gameType === GameType.Online ? null : () => {
        const toastAction: ToastAction = {
            label: 'OK',
            callback: () => {
                setLastMove(null);
                resetSelectedButton();
                setWinnerDetails(null);
                setComputerTurn(false);
                const newGameInstance = resetGameInstance(gameInstance);
                setGameInstance(newGameInstance);
            }
        }
        addToast('Confirm Reset?', [toastAction]);
    }

    const onPressYes = () => {
        if (!selectedMove) {
            addToast('Internal error occurred');
            console.error('Selected move not set before confirm move');
            return;
        }
        executeMove(selectedMove.row, selectedMove.column)
    }

    const onPressNo = () => {
        resetSelectedButton();
    }

    return (
        <CustomHeaderView header={header}>
            <ThemedView style={styles.gameBoard}>
                <ThemedView style={styles.winnerView}>
                    { (!gameInstance.winner && 
                        !selectedMove && 
                        !(
                            gameInstance.gameType === GameType.Online && 
                            userRef.current && 
                            gameInstance.turnUsername() !== userRef.current.username
                        )
                    ) ? (
                        gameArray.some(row => row.includes(3)) ?
                        <GeneralButton title='Hide Valid Moves' onPress={() => updateAvailableMoves(false)} />
                        :
                        <GeneralButton title='Show Valid Moves' onPress={() => updateAvailableMoves(true)} />
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
                        (
                            gameInstance.gameType === GameType.Online && 
                            !!userRef.current && 
                            gameInstance.turnUsername() !== userRef.current.username
                        )) 
                    }
                    onCellClick={handleCellClick} 
                />
            </ThemedView>
            { displayConfirm &&
            <ConfirmView onPressYes={onPressYes} onPressNo={onPressNo} />
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
        marginBottom: 50
    },
})