import { CustomHeaderView } from "@/components/CustomHeaderView";
import { GeneralButton } from "@/components/GeneralButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
import { User } from "@/features/auth/User";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

export default function Profile() {
    const { logout } = useAuth();
    const { userRef } = useUser();

    const [wins, setWins] = useState<number>(0);
    const [losses, setLosses] = useState<number>(0);
    
    useEffect(() => {
            if (userRef.current instanceof User) {
                const result = userRef.current.getWinsAndLosses();
                setWins(result.wins);
                setLosses(result.losses);
            }
    }, [userRef.current])

    const profileFields = [
        { title: "Username", value: userRef.current?.username },
        { title: "Email", value: userRef.current?.email },
        { title: "Online Rating", value: userRef.current?.onlineRating },
        { title: "Online W-L", value: `${wins}-${losses}`},
        { title: "Computer Points", value: userRef.current?.computerPoints },
    ]

    return (
        <CustomHeaderView header="Profile">
            <ThemedView style={styles.profileView}>
                {profileFields.map((field) => (
                    <ThemedText key={field.title}>{field.title}: {field.value}</ThemedText>
                ))}

                <GeneralButton title="Logout" onPress={logout} />
            </ThemedView>
        </CustomHeaderView>
    )
}

const styles = StyleSheet.create({
    profileView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10
    }
})