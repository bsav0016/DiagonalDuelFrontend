import { CustomHeaderView } from "@/components/CustomHeaderView";
import { GeneralButton } from "@/components/GeneralButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
import { User } from "@/features/auth/User";
import React, { useEffect, useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import { useToast } from "@/contexts/ToastContext";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function Profile() {
    const { logout, deleteAccount } = useAuth();
    const { userRef } = useUser();
    const { addToast } = useToast();
    const text = useThemeColor({}, 'text');
    const border = useThemeColor({}, 'border');
    const surface = useThemeColor({}, 'surface');

    const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [deleting, setDeleting] = useState<boolean>(false);

    const cancelDelete = () => {
        setConfirmingDelete(false);
        setPassword('');
    };

    const confirmDelete = async () => {
        if (!password) {
            addToast('Enter your password to delete your account');
            return;
        }
        setDeleting(true);
        try {
            const deleted = await deleteAccount(password);
            if (!deleted) {
                addToast('Incorrect password');
            }
        } catch {
            addToast('Could not delete your account. Log out, log back in and try again.');
        } finally {
            setDeleting(false);
        }
    };

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

                {confirmingDelete ? (
                    <ThemedView style={styles.deleteBox}>
                        <ThemedText style={styles.deleteWarning}>
                            This permanently deletes your account, rating and computer points. Games in progress end as a forfeit. This cannot be undone.
                        </ThemedText>
                        <TextInput
                            style={[styles.passwordInput, { color: text, borderColor: border, backgroundColor: surface }]}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Confirm your password"
                            placeholderTextColor="#9ca3af"
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <GeneralButton title={deleting ? "Deleting..." : "Delete my account"} onPress={confirmDelete} disabled={deleting} />
                        <GeneralButton title="Cancel" onPress={cancelDelete} variant="secondary" disabled={deleting} />
                    </ThemedView>
                ) : (
                    <GeneralButton title="Delete Account" onPress={() => setConfirmingDelete(true)} variant="secondary" />
                )}
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
    },

    deleteBox: {
        width: '85%',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
    },

    deleteWarning: {
        fontSize: 14,
        textAlign: 'center',
    },

    passwordInput: {
        width: '100%',
        height: 48,
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 14,
        fontSize: 16,
    }
})