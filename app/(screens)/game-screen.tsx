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
import { checkWinner, DRAW_TEXT, getAllValidMoves, hideValidMoves, isDraw, resetGameInstance, validateMove, WinnerInterface } from "@/features/game/gameUtils";
import { GeneralButton } from "@/components/GeneralButton";
import { Move } from "@/features/game/models/Move";
import { GameType } from "@/features/game/models/GameType";
import { Player } from "@/features/game/models/Player";
import { useGameService } from "@/hooks/useGameService";
import { GameAI } from "@/features/game/models/GameAI";
import { ConfirmView } from "@/features/game/components/ConfirmView";
import { PlayerChips } from "@/features/game/components/PlayerChips";
import { ComputerGameTracker, humanMovedFirst, movesForServer } from "@/features/game/computerScore";


/** What to tell the player about a verified win: the points, and whether the daily point limit held some back. */
function winMessage(points: number, capped: boolean): string {
    if (!capped) return points > 0 ? `Win verified: +${points} points` : 'Win verified';
    return points > 0
        ? `Win verified: +${points} points. That is today's point limit, so more wins count again tomorrow.`
        : "Win verified, but you've reached today's point limit, so no points were added. Wins count again tomorrow.";
}

export default function GameScreen () {
    const { routeTo } = useRouteTo();
    const { addToast } = useToast();

    const params = useLocalSearchParams();
    const gameParam = params.game as string | undefined;
    const parsedGame = gameParam ? JSON.parse(decodeURIComponent(gameParam)) : null;

    useEffect(() => {
        if (!parsedGame) {
            addToast('Could not load game');
            routeTo(Routes.HomeScreen);
        }
    }, []);

    if (!parsedGame) {
        return null;
    }

    return <GameScreenContent parsedGame={parsedGame} />;
}

function GameScreenContent ({ parsedGame }: { parsedGame: any }) {
    const { routeBack, routeReplace } = useRouteTo();
    const { addToast } = useToast();
    const { user, userRef, setUser, updateUserComputerScore } = useUser();
    const { setLoading } = useLoading();
    const { makeMove, resign, requestRematch, updateComputerScore, startComputerGame, finishComputerGame } = useGameService();
    const { pollUserGames } = useGamePoll();

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
    const [displayConfirm, setDisplayConfirm] = useState<boolean>(false);
    const [winnerDetails, setWinnerDetails] = useState<WinnerInterface | null>(checkWinner(gameArray));
    const [isComputerProcessing, setIsComputerProcessing] = useState(false);
    const [gameAI, setGameAI] = useState<GameAI | null>(null);
    const [computerTurn, setComputerTurn] = useState(false);

    // A win against the computer only earns points once the server has checked the game, so a signed-in player's
    // computer game is registered with the server when it starts and the moves are sent when it is won.
    const [tracker] = useState(() => new ComputerGameTracker({
        startGame: startComputerGame, finishGame: finishComputerGame, legacyScore: updateComputerScore,
    }));
    useEffect(() => {
        tracker.setDeps({ startGame: startComputerGame, finishGame: finishComputerGame, legacyScore: updateComputerScore });
    });
    // Counts the games played on this screen (the Reset Board button starts another), so each is registered once.
    const [gameRound, setGameRound] = useState(0);
    useEffect(() => {
        const computer = gameInstance.computerPlayer();
        // Level 0 earns nothing, and a player who is not signed in has no leaderboard entry.
        if (gameInstance.gameType === GameType.Computer && computer?.computerLevel && userRef.current) {
            tracker.begin(computer.computerLevel, humanMovedFirst(gameInstance.player1));
        }
        return () => tracker.end();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only a new game round registers a new server game
    }, [gameRound]);

    const reportWin = async (level: number, moves: Move[]) => {
        const outcome = await tracker.recordWin(level, movesForServer(moves));
        switch (outcome.kind) {
            case 'credited': {
                const current = userRef.current;
                if (current) {
                    setUser(current.with({ computerPoints: outcome.total ?? current.computerPoints + outcome.points }));
                }
                addToast(winMessage(outcome.points, outcome.capped));
                break;
            }
            case 'legacy':
                updateUserComputerScore(level);
                break;
            case 'refused':
                addToast("This win could not be verified, so no points were added.");
                break;
            case 'failed':
                addToast("Couldn't record your win. Check your connection.", [
                    { label: 'Try again', callback: () => { void reportWin(level, moves); } },
                ]);
                break;
            case 'untracked':
                addToast("This game didn't count towards the leaderboard because you were offline when it started.");
                break;
        }
    };
    

    const canResign = gameInstance.gameType === GameType.Online && !gameInstance.winner && !!user;
    const opponentName = gameInstance.player1.username === user?.username
        ? gameInstance.player2.username
        : gameInstance.player1.username;

    const [rematchSent, setRematchSent] = useState<boolean>(false);
    const canRematch = gameInstance.gameType === GameType.Online && !!gameInstance.winner && !!user && !rematchSent;

    const timeDiff: number = gameInstance.moveTime
            ? gameInstance.moveTime - (Date.now() - (gameInstance.lastUpdated ? new Date(gameInstance.lastUpdated).getTime() : 0))
            : 0;

    const timeRemaining: number = timeDiff / 1000;
    const lastUpdated = gameInstance.lastUpdated ? gameInstance.lastUpdated : new Date();


    useEffect(() => {
        if (gameInstance.gameType === GameType.Online && !user) {
            routeReplace(Routes.Login);
        }
    }, [user]);

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
                        void reportWin(computerPlayer.computerLevel, gameInstance.moves);
                    }
                }
                setWinnerDetails(winner);
            } else if (isDraw(newGameArray)) {
                updateWinner(DRAW_TEXT);
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
            if (!winner && !isDraw(newGameArray)) {
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

    // The toast adds its own Cancel, so this only has to say what resigning costs.
    const confirmResign = () => {
        addToast(`Resign this game? ${opponentName} wins and your rating drops.`, [{ label: 'Resign', callback: executeResign }]);
    }

    const executeResign = async () => {
        setLoading(true);
        try {
            if (!gameInstance.gameId) {
                throw new Error("No game ID");
            }
            await resign(gameInstance.gameId);
            await pollUserGames();
            routeBack();
        } catch (error) {
            console.error(error);
            addToast("Could not resign. The game may already be over, or you are offline.");
            // The server may have moved on (a timeout, or the opponent's move), so show the latest.
            pollUserGames().catch(() => {});
        } finally {
            setLoading(false);
        }
    }

    // Asks the opponent of this finished game to play again; the server picks who moves first.
    const sendRematch = async () => {
        if (!gameInstance.gameId) return;
        setLoading(true);
        try {
            await requestRematch(gameInstance.gameId);
            setRematchSent(true);
            addToast(`Rematch request sent to ${opponentName}`);
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Could not send the rematch request");
        } finally {
            setLoading(false);
        }
    }

    const resetSelectedButton = () => {
        setDisplayConfirm(false);
        setSelectedMove(null);
    }

    const updateAvailableMoves = (show: boolean) => {
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
                setGameRound((round) => round + 1);
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
                <PlayerChips
                    player1Name={gameInstance.player1.username}
                    player2Name={gameInstance.player2.username}
                    activePlayer={gameInstance.winner || isDraw(gameArray) ? null : (gameInstance.moves.length % 2 === 0 ? 1 : 2)}
                />
                <ThemedView style={styles.winnerView}>
                    { (!gameInstance.winner && 
                        !selectedMove && 
                        !(
                            gameInstance.gameType === GameType.Online && 
                            user && 
                            gameInstance.turnUsername() !== user.username
                        )
                    ) ? (
                        gameArray.some(row => row.includes(3)) ?
                        <GeneralButton title='Hide Valid Moves' onPress={() => updateAvailableMoves(false)} variant='secondary' fontSize={17} />
                        :
                        <GeneralButton title='Show Valid Moves' onPress={() => updateAvailableMoves(true)} variant='secondary' fontSize={17} />
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
                    timeExpired={timeExpired}
                    disabled={
                        (gameInstance.isComputerTurn() || 
                        !!gameInstance.winner || 
                        (
                            gameInstance.gameType === GameType.Online && 
                            !!user && 
                            gameInstance.turnUsername() !== user.username
                        )) 
                    }
                    onCellClick={handleCellClick} 
                />
                { resetBoard &&
                    <GeneralButton title='Reset Board' onPress={resetBoard} variant='secondary' fontSize={16} />
                }
                { canResign &&
                    <GeneralButton title='Resign' onPress={confirmResign} variant='secondary' fontSize={16} />
                }
                { canRematch &&
                    <GeneralButton title='Rematch' onPress={sendRematch} variant='secondary' fontSize={16} />
                }
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
        height: 60,
        marginTop: 16,
        marginBottom: 24
    },
})