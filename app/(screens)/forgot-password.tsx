import React, { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { GeneralButton } from "@/components/GeneralButton";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/contexts/ToastContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Colors } from "@/constants/Colors";
import { AuthService } from "@/features/auth/AuthService";
import { Routes } from "./Routes";

enum Step {
    Email,
    Code,
}

export default function ForgotPasswordScreen() {
    const { addToast } = useToast();
    const { routeReplace } = useRouteTo();
    const color = useThemeColor({}, 'text');
    const [step, setStep] = useState<Step>(Step.Email);
    const [email, setEmail] = useState<string>("");
    const [code, setCode] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [processing, setProcessing] = useState<boolean>(false);

    const inputStyle = [styles.textInput, { color: color, borderColor: color }];

    const sendCode = async () => {
        if (!email.trim()) {
            addToast("Enter your email address");
            return;
        }
        setProcessing(true);
        try {
            await AuthService.requestPasswordReset(email);
            addToast("If an account uses that address, a code has been emailed to it");
            setStep(Step.Code);
        } catch (error) {
            addToast(error instanceof Error ? error.message : "Unknown error");
        } finally {
            setProcessing(false);
        }
    };

    const resetPassword = async () => {
        if (!code.trim() || !password) {
            addToast("Enter the code and a new password");
            return;
        }
        if (password !== confirmPassword) {
            addToast("Passwords do not match");
            return;
        }
        setProcessing(true);
        try {
            await AuthService.confirmPasswordReset(email, code, password);
            addToast("Password changed. Sign in with the new password");
            routeReplace(Routes.Login);
        } catch (error) {
            // The server's message says why: a weak password, or a wrong or expired code.
            addToast(error instanceof Error ? error.message : "Unknown error");
        } finally {
            setProcessing(false);
        }
    };

    const goBack = () => {
        if (step === Step.Code) {
            setStep(Step.Email);
        } else {
            routeReplace(Routes.Login);
        }
    };

    return (
        <CustomHeaderView header="Reset Password" goBack={goBack}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
                >
                    <ThemedView style={styles.formView}>
                        {step === Step.Email ? (
                            <>
                                <ThemedText style={styles.help}>
                                    Enter the email address on your account and we will send you a reset code.
                                </ThemedText>
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Email"
                                    placeholderTextColor={color}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="email-address"
                                    returnKeyType="done"
                                    onSubmitEditing={() => Keyboard.dismiss()}
                                    style={inputStyle}
                                />
                                {processing ? <LoadingSpinner /> : <GeneralButton title="Send Code" onPress={sendCode} />}
                            </>
                        ) : (
                            <>
                                <ThemedText style={styles.help}>
                                    Enter the code we emailed to {email.trim()} and choose a new password.
                                </ThemedText>
                                <TextInput
                                    value={code}
                                    onChangeText={setCode}
                                    placeholder="Code"
                                    placeholderTextColor={color}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="number-pad"
                                    style={inputStyle}
                                />
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="New password"
                                    placeholderTextColor={color}
                                    secureTextEntry
                                    textContentType="oneTimeCode"
                                    style={inputStyle}
                                />
                                <TextInput
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Confirm new password"
                                    placeholderTextColor={color}
                                    secureTextEntry
                                    textContentType="oneTimeCode"
                                    returnKeyType="done"
                                    onSubmitEditing={() => Keyboard.dismiss()}
                                    style={inputStyle}
                                />
                                {processing ? <LoadingSpinner /> : <GeneralButton title="Reset Password" onPress={resetPassword} />}
                                <TouchableOpacity onPress={sendCode} disabled={processing}>
                                    <ThemedText style={[styles.link, { color: Colors.button.background }]}>
                                        Send a new code
                                    </ThemedText>
                                </TouchableOpacity>
                            </>
                        )}
                    </ThemedView>
                </KeyboardAvoidingView>
            </ScrollView>
        </CustomHeaderView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },

    formView: {
        alignItems: 'center',
        paddingHorizontal: 30,
        gap: 12,
        marginBottom: 60,
    },

    help: {
        textAlign: 'center',
    },

    textInput: {
        width: '100%',
        borderWidth: 1,
        borderRadius: 3,
        padding: 6,
        fontSize: 20,
    },

    link: {
        textDecorationLine: 'underline',
    },
});
