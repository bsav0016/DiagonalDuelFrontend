import React from "react";
import { StyleSheet, View } from "react-native";
import { useRouteTo } from "@/contexts/RouteContext";
import { Routes } from "@/app/(screens)/Routes";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { GeneralButton } from "@/components/GeneralButton";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Colors } from "@/constants/Colors";


function Logo() {
  const dots = [Colors.board.player2, Colors.board.empty, Colors.board.empty, Colors.board.player1];

  return (
    <View style={styles.logo}>
      {dots.map((color, index) => (
        <View key={index} style={[styles.logoDot, { backgroundColor: color }]} />
      ))}
    </View>
  );
}


export default function HomeScreen() {
  const { routeTo } = useRouteTo();
  const muted = useThemeColor({}, 'muted');

  const homeButtons = [
    { title: "Play Computer", route: Routes.PlayComputer, variant: 'primary' as const },
    { title: "Play Online", route: Routes.PlayOnline, variant: 'primary' as const },
    { title: "How to Play", route: Routes.HowToPlay, variant: 'secondary' as const },
    { title: "Leaderboard", route: Routes.Leaderboard, variant: 'secondary' as const },
    { title: "Support", route: Routes.Support, variant: 'secondary' as const }
  ]

  return (
    <ThemedView style={styles.homeView}>
      <ThemedView style={styles.titleContainer}>
        <Logo />
        <ThemedText type='title'>
          Diagonal Duel
        </ThemedText>
        <ThemedText style={[styles.tagline, { color: muted }]}>
          A two-player strategy game
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.homeButtonView}>
        {homeButtons.map((homeButton) => (
          <GeneralButton
            key={homeButton.title}
            title={homeButton.title}
            onPress={() => routeTo(homeButton.route)}
            autoWidth={false}
            variant={homeButton.variant}
          />
        ))
        }
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  homeView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  tagline: {
    fontSize: 17,
    textAlign: 'center',
  },

  logo: {
    width: 110,
    height: 110,
    marginBottom: 28,
    padding: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'space-between',
    justifyContent: 'space-between',
    backgroundColor: Colors.board.background,
    borderRadius: 16,
    transform: [{ rotate: '45deg' }],
    shadowColor: '#1c2a6b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },

  logoDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  homeButtonView: {
    width: '70%',
    alignItems: 'center',
    gap: 6,
  },
})
