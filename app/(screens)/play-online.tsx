import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useRouteTo } from "@/contexts/RouteContext";
import { useAuth } from "@/features/auth/AuthContext";
import { Routes } from "./Routes";

export default function PlayOnline () {
    const { routeReplace } = useRouteTo();
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            routeReplace(Routes.Login)
        }
    }, [])

    return (
        <CustomHeaderView header="Play Online" goBack={() => routeReplace(Routes.HomeScreen)}>
            <ThemedView style={styles.playComputerView}>
                <ThemedText>
                    Play Online
                </ThemedText>
            </ThemedView>
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    playComputerView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    }
  })