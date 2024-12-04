import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useLoading } from "@/contexts/LoadingContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { useToast } from "@/contexts/ToastContext";
import { useUser } from "@/contexts/UserContext";
import { ComputerPointsLeader } from "@/features/leaderboard/ComputerPointsLeader";
import { LeaderboardService } from "@/features/leaderboard/LeaderboardService";
import { OnlineRatingLeader } from "@/features/leaderboard/OnlineRatingLeader";
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions } from "react-native";

export default function Leaderboard() {
    const { setLoading } = useLoading();
    const { addToast } = useToast();
    const { routeBack } = useRouteTo();
    const { user } = useUser()
    const [computerLeaderboard, setComputerLeaderboard] = useState<ComputerPointsLeader[]>([]);
    const [ratingLeaderboard, setRatingLeaderboard] = useState<OnlineRatingLeader[]>([]);
    const [selectedTab, setSelectedTab] = useState<"computer" | "rating">("computer");

    useEffect(() => {
        const populateLeaderboards = async () => {
            setLoading(true);
            try {
                const { computerPointsLeaderboard, onlineRatingLeaderboard } = await LeaderboardService.getLeaderboards();
                setComputerLeaderboard(computerPointsLeaderboard);
                setRatingLeaderboard(onlineRatingLeaderboard);
                console.log(computerPointsLeaderboard)
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

    const renderLeaderboardItem = (item: ComputerPointsLeader | OnlineRatingLeader, index: number) => (
        <ThemedView style={styles.leaderboardItem}>
            <ThemedText style={styles.rank}>{index + 1}</ThemedText>
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

                {/*{ user.username? 
                
                }*/}

                { selectedTab === "computer" ? 
                <FlatList
                    data={computerLeaderboard}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => renderLeaderboardItem(item, index)}
                    contentContainerStyle={styles.listContainer}
                />
                :
                <FlatList
                    data={ratingLeaderboard}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => renderLeaderboardItem(item, index)}
                    contentContainerStyle={styles.listContainer}
                />
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
    listContainer: {
        paddingBottom: 16,
    },
    leaderboardItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
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
