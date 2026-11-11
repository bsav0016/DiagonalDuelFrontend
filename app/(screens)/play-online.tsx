import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { StyleSheet, TouchableOpacity, ScrollView, View, Text } from "react-native";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useRouteTo } from "@/contexts/RouteContext";
import { useUser } from "@/contexts/UserContext";
import { ToastAction, useToast } from "@/contexts/ToastContext";
import { useGamePoll } from "@/contexts/GamePollContext";
import { useLoading } from "@/contexts/LoadingContext";
import { useGameService } from "@/hooks/useGameService";
import { ChallengeList } from "@/components/ChallengeList";
import { Challenge } from "@/features/challenges/Challenge";
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
    const { pollUserGames, createMatchmaking, cancelMatchmaking, enablePushNotifications } = useGamePoll();
    const [yourTurnGames, setYourTurnGames] = useState<Game[]>([]);
    const [theirTurnGames, setTheirTurnGames] = useState<Game[]>([]);
    const [completedGames, setCompletedGames] = useState<Game[]>([]);
    const { setLoading } = useLoading();
    const { getChallenges, acceptChallenge, declineChallenge, cancelChallenge } = useGameService();
    const [incomingChallenges, setIncomingChallenges] = useState<Challenge[]>([]);
    const [outgoingChallenges, setOutgoingChallenges] = useState<Challenge[]>([]);
    const signedIn = user !== null;

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

    // The hook hands out new functions every render; the ref lets the callback below stay the same one.
    const getChallengesRef = useRef(getChallenges);
    useEffect(() => { getChallengesRef.current = getChallenges; });

    const refreshChallenges = useCallback(async () => {
        try {
            const challenges = await getChallengesRef.current();
            setIncomingChallenges(challenges.incoming);
            setOutgoingChallenges(challenges.outgoing);
        } catch (error) {
            console.error("Error fetching challenges:", error);
        }
    }, []);

    // Challenges are checked when the screen opens and then every 15 seconds, like the game list.
    useFocusEffect(
        React.useCallback(() => {
            if (!signedIn) return;
            refreshChallenges();
            const polling = setInterval(refreshChallenges, 15000);
            return () => clearInterval(polling);
        }, [signedIn, refreshChallenges])
    );

    const answerChallenge = async (action: () => Promise<void>, failure: string) => {
        setLoading(true);
        try {
            await action();
        } catch (error) {
            addToast(error instanceof Error ? error.message : failure);
        } finally {
            setLoading(false);
            refreshChallenges();
        }
    };

    const onAcceptChallenge = (challenge: Challenge) => answerChallenge(async () => {
        const game = await acceptChallenge(challenge.id);
        await pollUserGames();
        goToGame(game);
    }, "Could not accept the challenge");

    const onDeclineChallenge = (challenge: Challenge) =>
        answerChallenge(() => declineChallenge(challenge.id), "Could not decline the challenge");

    const onCancelChallenge = (challenge: Challenge) =>
        answerChallenge(() => cancelChallenge(challenge.id), "Could not cancel the challenge");

    interface IndividualGameProps {
        game: Game;
    }

    const IndividualGame = ({game}: IndividualGameProps) => {
        const opponentUsername: string =
            game.player1.username === user?.username
            ? game.player2.username
            : game.player1.username;

        const opponentRating: number =
            game.player1.username === user?.username
            ? game.player2.rating
            : game.player1.rating

        const timeDiff: number = game.moveTime
            ? game.moveTime - (Date.now() - (game.lastUpdated ? new Date(game.lastUpdated).getTime() : 0))
            : 0;

        const timeRemaining: number = timeDiff / 1000;
        return (
            <ThemedView style={[
                styles.gameView,
                game.winner ?
                    (user?.username && game.winner.split(' ')[0] === (user.username)
                    ? { backgroundColor: Colors.onlinePlay.win }
                    : { backgroundColor: Colors.onlinePlay.loss })
                : { backgroundColor: Colors.onlinePlay.general },
                { borderColor: textColor }
            ]}>
                <TouchableOpacity onPress={() => goToGame(game)} style={styles.gameButton}>
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <ThemedText style={{ textAlign: 'left', color: game.winner ? 'black' : 'white' }}>
                            {`${opponentUsername} (${opponentRating})`}
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

    const createNewGame = async () => {
        // Starting a game is when notifications become useful, so this is when we ask (the system only prompts once).
        await enablePushNotifications().catch(() => {});
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
        <CustomHeaderView header="Play Online" goBack={() => routeReplace(Routes.HomeScreen)} goProfile={true}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <ThemedView style={styles.playOnlineView}>
                    <ThemedView>
                        <ThemedText type='subtitle' style={styles.gamesHeaderText}>Matchmaking</ThemedText>
                        <GeneralButton title='New Online Game' onPress={createNewGame} />
                        { user?.matchmaking && user.matchmaking.length > 0 ?
                            ( user?.matchmaking.map((days) => (
                                <ThemedView style={styles.matchmakingView} key={days}>
                                    <ThemedText style={styles.matchmakingText}>
                                        {`Waiting for ${days}-day turn game...`}
                                    </ThemedText>
                                    <TouchableOpacity onPress={() => cancelMatchmaking(days)}>
                                        <Text style={styles.matchmakingCancel}>Cancel</Text>
                                    </TouchableOpacity>
                                </ThemedView>
                            )))
                            :
                            (
                                <ThemedText style={styles.noGamesText}>No active matchmaking</ThemedText>
                            )
                        }
                    </ThemedView>
                    <ThemedView>
                        <ThemedText type='subtitle' style={styles.gamesHeaderText}>Friends</ThemedText>
                        <GeneralButton title='Challenge a Friend' onPress={() => routeTo(Routes.NewChallenge)} />
                        <ChallengeList
                            incoming={incomingChallenges}
                            outgoing={outgoingChallenges}
                            onAccept={onAcceptChallenge}
                            onDecline={onDeclineChallenge}
                            onCancel={onCancelChallenge}
                        />
                    </ThemedView>
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

    playOnlineView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 50,
      gap: 40
    },

    matchmakingView: {
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10
    },

    matchmakingText: {
        fontSize: 16
    },

    matchmakingCancel: {
        color: 'red',
        fontSize: 16,
        textDecorationLine: 'underline'
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
        textDecorationLine: 'underline'
    },

    noGamesText: {
        marginBottom: 15
    }
})