import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useLoading } from "@/contexts/LoadingContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { useToast } from "@/contexts/ToastContext";
import { useUser } from "@/contexts/UserContext";
import { ComputerPointsLeader } from "@/features/leaderboard/models/ComputerPointsLeader";
import { LeaderboardService } from "@/features/leaderboard/LeaderboardService";
import { OnlineRatingLeader } from "@/features/leaderboard/models/OnlineRatingLeader";
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";

export default function Leaderboard() {
    const { setLoading } = useLoading();
    const { addToast } = useToast();
    const { routeBack } = useRouteTo();
    const { userRef } = useUser()

    const [computerLeaderboard, setComputerLeaderboard] = useState<ComputerPointsLeader[]>([]);
    const [ratingLeaderboard, setRatingLeaderboard] = useState<OnlineRatingLeader[]>([]);
    const [selectedTab, setSelectedTab] = useState<"computer" | "rating">("computer");

    const [userComputerLeader, setUserComputerLeader] = useState<ComputerPointsLeader | null>(null);
    const [userRatingLeader, setUserRatingLeader] = useState<OnlineRatingLeader | null>(null);

    useEffect(() => {
        const populateLeaderboards = async () => {
            setLoading(true);
            try {
                const { computerPointsLeaderboard, onlineRatingLeaderboard } = await LeaderboardService.getLeaderboards();
                setComputerLeaderboard(computerPointsLeaderboard);
                setRatingLeaderboard(onlineRatingLeaderboard);
            } catch (error) {
                console.error(error);
                addToast("Could not get leaderboard");
                routeBack();
            } finally {
                setLoading(false);
            }
        };

        populateLeaderboards();
    }, []);

    useEffect(() => {
        setUserComputerLeader(null);
        for (const leader of computerLeaderboard) {
            if (leader.username === userRef.current?.username) {
                setUserComputerLeader(leader);
            }
        }
    }, [computerLeaderboard]);

    useEffect(() => {
        setUserRatingLeader(null);
        for (const leader of ratingLeaderboard) {
            if (leader.username === userRef.current?.username) {
                setUserRatingLeader(leader);
            }
        }
    }, [ratingLeaderboard]);

    const renderLeaderboardItem = (item: ComputerPointsLeader | OnlineRatingLeader) => (
        <ThemedView style={[styles.leaderboardItem, item.username === userRef.current?.username && { backgroundColor: 'orange' }]}>
            <ThemedText style={styles.rank}>{item.rank}</ThemedText>
            <ThemedText style={styles.username}>{item.username}</ThemedText>
            <ThemedText style={styles.value}>    
                {item instanceof ComputerPointsLeader ? `${(item as ComputerPointsLeader).computerPoints}` : (item as OnlineRatingLeader).onlineRating}
            </ThemedText>
        </ThemedView>
    );

    return (
        <CustomHeaderView header="Leaderboard">
            <ThemedView style={styles.container}>
                <View style={styles.tabSelector}>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === "rating" && styles.selectedTab]}
                        onPress={() => setSelectedTab("rating")}
                    >
                        <Text style={[styles.tabText, selectedTab === "rating" && styles.selectedTabText]}>
                            Online Rating
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === "computer" && styles.selectedTab]}
                        onPress={() => setSelectedTab("computer")}
                    >
                        <Text style={[styles.tabText, selectedTab === "computer" && styles.selectedTabText]}>
                            Computer Points
                        </Text>
                    </TouchableOpacity>
                </View>

                { selectedTab === "computer" ? 
                    <View style={styles.listView}>
                        {   userComputerLeader &&
                            renderLeaderboardItem(userComputerLeader)                        
                        }
                        <FlatList
                            data={computerLeaderboard}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => renderLeaderboardItem(item)}
                            contentContainerStyle={styles.listContainer}
                        />
                    </View>
                :
                    <View style={styles.listView}>
                        {   userRatingLeader &&
                            renderLeaderboardItem(userRatingLeader)                        
                        }
                        <FlatList
                            data={ratingLeaderboard}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => renderLeaderboardItem(item)}
                            contentContainerStyle={styles.listContainer}
                        />
                    </View>
                    
                }
            </ThemedView>
        </CustomHeaderView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    tabSelector: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        padding: 10,
        alignItems: "center",
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    selectedTab: {
        borderBottomColor: "#3498db",
    },
    tabText: {
        fontSize: 16,
        color: "#666",
    },
    selectedTabText: {
        color: "#3498db",
        fontWeight: "bold",
    },
    listView: {
        flex: 1,
        display: 'flex'
    },
    listContainer: {
        paddingBottom: 16,
        flex: 1
    },
    leaderboardItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
    },
    rank: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#444",
    },
    username: {
        fontSize: 16,
        flex: 1,
        textAlign: "center",
        color: "#444",
    },
    value: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#444",
    },
});
