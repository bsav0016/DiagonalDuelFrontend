import React from "react";
import { StyleSheet } from "react-native";
import { useRouteTo } from "@/contexts/RouteContext";
import { Routes } from "@/enums/Routes";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import GeneralButton from "@/components/GeneralButton";

export default function HomeScreen() {
  const { routeTo } = useRouteTo();

  return (
    <ThemedView style={styles.homeView}>
      <ThemedText>
        Diagonal Duel
      </ThemedText>
      <GeneralButton title="Play Computer" onPress={() => routeTo(Routes.PlayComputer)} />
      <GeneralButton title="Play Online" onPress={() => routeTo(Routes.PlayOnline)} />
      <GeneralButton title="Support" onPress={() => routeTo(Routes.Support)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  homeView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  homeViewButton: {
    margin: 10
  }
})