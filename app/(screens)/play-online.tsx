import React, { useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StyleSheet, TouchableOpacity, ScrollView, View } from "react-native";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useRouteTo } from "@/contexts/RouteContext";
import { useUser } from "@/contexts/UserContext";
import { ToastAction, useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useGamePoll } from "@/contexts/GamePollContext";
import { Routes } from "./Routes";
import { Game } from "@/features/game/models/Game";
import { GeneralButton } from "@/components/GeneralButton";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function PlayOnline () {
    const { routeTo, routeReplace } = useRouteTo();
    const { addToast } = useToast();
    const { user } = useUser();
    const { logout } = useAuth();
    const { pollUserGames, createMatchmaking, cancelMatchmaking } = useGamePoll();
    const [yourTurnGames, setYourTurnGames] = useState<Game[]>([]);
    const [theirTurnGames, setTheirTurnGames] = useState<Game[]>([]);
    const [completedGames, setCompletedGames] = useState<Game[]>([]);

    const textColor = useThemeColor({}, 'text');

    useFocusEffect(
        React.useCallback(() => {
            if (!user) {
                routeReplace(Routes.Login);
                return;
            }
    
            const yourTurn: Game[] = [];
            const theirTurn: Game[] = [];
            const completed: Game[] = [];
    
            for (const game of user.games) {
                if (game.winner) {
                    completed.push(game);
                } else if (
                    game.player1.username === user.username && game.moves.length % 2 === 0 ||
                    game.player2.username === user.username && game.moves.length % 2 === 1
                ) {
                    yourTurn.push(game);
                } else {
                    theirTurn.push(game);
                }
            }
    
            setYourTurnGames(yourTurn);
            setTheirTurnGames(theirTurn);
            setCompletedGames(completed);
        }, [user])
    );

    interface IndividualGameProps {
        game: Game;
    }

    const IndividualGame = ({game}: IndividualGameProps) => {
        const opponentUsername: string =
            game.player1.username === user?.username
            ? game.player2.username
            : game.player1.username;

        const timeDiff: number = game.moveTime
            ? game.moveTime - (Date.now() - (game.lastUpdated ? new Date(game.lastUpdated).getTime() : 0))
            : 0;

        const timeRemaining: number = timeDiff / 1000;
        return (
            <ThemedView style={[
                styles.gameView,
                game.winner ?
                    (user?.username && game.winner.split(' ')[0] == (user.username)
                    ? { backgroundColor: Colors.onlinePlay.win }
                    : { backgroundColor: Colors.onlinePlay.loss })
                : { backgroundColor: Colors.onlinePlay.general },
                { borderColor: textColor }
            ]}>
                <TouchableOpacity onPress={() => goToGame(game)} style={styles.gameButton}>
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <ThemedText style={{ textAlign: 'left', color: game.winner ? 'black' : 'white' }}>
                            {opponentUsername}
                        </ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                        { game.winner ?
                        <ThemedText style={{ textAlign: 'center', color: 'black' }}>{game.winner}</ThemedText>
                        :
                        <CountdownTimer 
                            timeRemaining={timeRemaining} 
                            alignRight={true} 
                            color={'white'}
                            whenZero={pollUserGames}
                        />
                        }
                    </View>
                </TouchableOpacity>
            </ThemedView>
        )
    }

    const goToGame = (game: Game) => {
        const serializedGame = encodeURIComponent(JSON.stringify(game));
        routeTo(Routes.Game, { 'game': serializedGame });
    }

    const gameLengths: number[] = [1, 3, 5, 7]

    const createNewGame = () => {
        let toastActions: ToastAction[] = []
        for (let index = 0; index < gameLengths.length; index++) {
            const label: string = `${gameLengths[index]} Days`
            const action = async () => {
                try {
                    await createMatchmaking(gameLengths[index]);
                } catch (error) {
                    console.log(error);
                    addToast("Oops, could not create game. You may already be searching for a game with this time limit")
                }
            }
            const newAction: ToastAction = {
                label: label,
                callback: action
            }
            toastActions.push(newAction);
        }
        addToast('Select Desired Move Time Limit', toastActions);
    }

    return (
        <CustomHeaderView header="Play Online" goBack={() => routeReplace(Routes.HomeScreen)}>
            <ThemedView style={{ alignItems: 'center'}}>
                { user?.isMatchmaking ? 
                <View>
                    <ThemedText>Looking for worthy opponent...</ThemedText>
                    <GeneralButton title="Cancel Matchmaking" onPress={cancelMatchmaking} />
                </View>
                :
                <GeneralButton title='New Online Game' onPress={createNewGame} />
                }
            </ThemedView>
            <ThemedView style={{ alignItems: 'center' }}>
                <GeneralButton title="Logout" onPress={logout} />
            </ThemedView>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} >
                <ThemedView style={styles.playComputerView}>
                    <ThemedView style={styles.gameSetView}>
                        <ThemedText type='subtitle' style={styles.gamesHeaderText}>Your Turn!</ThemedText>
                        { yourTurnGames.length === 0 &&
                        <ThemedText style={styles.noGamesText}>No games to display</ThemedText>
                        }
                        {yourTurnGames.map((game) => (
                            <IndividualGame game={game} key={game.gameId} />
                        ))}
                    </ThemedView>
                    <ThemedView style={styles.gameSetView}>
                        <ThemedText type='subtitle' style={styles.gamesHeaderText}>Their Turn</ThemedText>
                        { theirTurnGames.length === 0 &&
                        <ThemedText style={styles.noGamesText}>No games to display</ThemedText>
                        }
                        {theirTurnGames.map((game) => (
                            <IndividualGame game={game} key={game.gameId} />
                        ))}
                    </ThemedView>
                    <ThemedView style={styles.gameSetView}>
                        <ThemedText type='subtitle' style={styles.gamesHeaderText}>Completed</ThemedText>
                        { completedGames.length === 0 &&
                        <ThemedText style={styles.noGamesText}>No games to display</ThemedText>
                        }
                        {completedGames.map((game) => (
                            <IndividualGame game={game} key={game.gameId} />
                        ))}
                    </ThemedView>
                </ThemedView>
            </ScrollView>
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    createButtonView: {
        alignItems: 'center',
        marginTop: 20
    },

    playComputerView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 50
    },

    gameSetView: {
        flexDirection: 'column',
        textAlign: 'center'
    },

    gameView: {
        flexDirection: 'row',
        marginVertical: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        width: '80%',
        borderWidth: 1,
        borderRadius: 8,
    },

    gameButton: {
        flexDirection: 'row',
        width: '100%',
        gap: 10
    },

    gamesHeaderText: {
        textAlign: 'center',
    },

    noGamesText: {
        marginBottom: 15
    }
})