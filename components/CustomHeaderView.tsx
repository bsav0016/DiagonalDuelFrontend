import React, { ReactNode } from "react";
import { StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { useRouteTo } from "@/contexts/RouteContext";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { Routes } from "@/app/(screens)/Routes";


interface CustomHeaderProps {
    header: string;
    children: ReactNode;
    canGoBack?: Boolean;
    goBack?: () => void,
    style?: StyleProp<ViewStyle>;
    goProfile?: Boolean;
}

export function CustomHeaderView({ 
    header, 
    children, 
    canGoBack=true,
    goBack,
    style,
    goProfile=false
}: CustomHeaderProps) {
    const router = useRouter();
    const { routeTo } = useRouteTo();

    const handleBackPress = goBack || router.back

    return (
        <ThemedView style={[styles.screenView, style]}>
            <ThemedView style={styles.headerView}>
                {canGoBack &&
                    <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={30} color={Colors.button.text} />
                        <ThemedText style={styles.backText}>Back</ThemedText>
                    </TouchableOpacity>
                }

                <ThemedText style={[styles.headerText, canGoBack && styles.headerTextWithBack]}>
                    {header}
                </ThemedText>

                {goProfile &&
                    <TouchableOpacity onPress={() => routeTo(Routes.Profile)} style={styles.profileButton}>
                        <ThemedText style={styles.backText}>Profile</ThemedText>
                        <Ionicons name="person" size={15} color={Colors.button.text} />
                    </TouchableOpacity>
                }
            </ThemedView>
            <ThemedView style={styles.contentView}>
                {children}
            </ThemedView>
        </ThemedView>
    )
}

const fontSize: number = 20;

const styles = StyleSheet.create({
    screenView: {
        flex: 1,
        flexDirection: 'column'
    },

    headerView: {
        width: '100%',
        height: 60,
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },

    backButton: {
        position: 'absolute',
        left: 10,
        top: 10,
        backgroundColor: Colors.button.background,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        width: 'auto',
        height: 40,
        paddingRight: 5,
        borderRadius: 5
    },

    profileButton: {
        position: 'absolute',
        right: 10,
        top: 10,
        backgroundColor: Colors.button.background,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        width: 'auto',
        height: 40,
        paddingHorizontal: 5,
        borderRadius: 5
    },

    backText: {
        fontSize: 14,
        color: Colors.button.text
    },

    headerTextWithBack: {
        marginHorizontal: 80, 
    },

    headerText: {
        flex: 1,
        textAlign: "center",
        fontSize: fontSize,
        fontWeight: 'bold'
    },

    contentView: {
        flex: 1
    }
})