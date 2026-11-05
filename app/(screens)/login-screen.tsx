import React, { useRef, useState } from "react";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { Routes } from "./Routes";
import { ThemedText } from "@/components/ThemedText";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { AuthFields } from "@/features/auth/AuthFields";
import { AuthType } from "@/features/auth/AuthType";
import { GeneralButton } from "@/components/GeneralButton";
import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";
import { LoadingSpinner } from "@/components/LoadingSpinner";
type TextInputRef = React.ComponentRef<typeof TextInput>;


interface Field<T> {
    field: keyof T;
    text: string;
    value: string | undefined;
}

export default function LoginScreen() {
    const { auth } = useAuth();
    const { addToast } = useToast();
    const { routeTo, routeReplace } = useRouteTo();
    const color = useThemeColor({}, 'text');
    const [formFields, setFormFields] = useState<AuthFields>({
        username: "",
        password: "",
        email: undefined,
        confirmPassword: undefined,
    });
    const [type, setType] = useState<AuthType>(AuthType.Login);
    const [processing, setProcessing] = useState<boolean>(false);

    // The text inputs by field name, filled in by each input's callback ref.
    const inputs = useRef<Partial<Record<keyof AuthFields, TextInputRef | null>>>({});

    const focusNextField = (field: keyof AuthFields) => {
        inputs.current[field]?.focus();
    };

    const updateFormField = (fieldName: keyof AuthFields, value: string) => {
        setFormFields((prevFields) => ({
            ...prevFields,
            [fieldName]: value,
        }));
    };

    const loginFields: Field<AuthFields>[] = [
        { field: "username", text: "Username", value: formFields.username },
        { field: "password", text: "Password", value: formFields.password },
    ];

    const registerFields: Field<AuthFields>[] = [
        ...loginFields,
        { field: "confirmPassword", text: "Confirm Password", value: formFields.confirmPassword },
        { field: "email", text: "Email", value: formFields.email },
    ];

    const authUser = async () => {
        setProcessing(true);
        try {
            const response = await auth(formFields, type);
            if (response) {
                routeTo(Routes.PlayOnline);
            } else {
                addToast("Invalid username and password");
            }
        } catch (error) {
            let errorMessage: string;
            if (error === "Username already taken") {
                errorMessage = "Username already taken";
            }
            else if (error === "Email already taken") {
                errorMessage = "Email already taken";
            }
            else if (error === "Enter a valid email") {
                errorMessage = "Enter a valid email";
            }
            else {
                errorMessage = error instanceof Error ? error.message : "Unknown error"
            }
            addToast(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    const switchType = () => {
        if (type === AuthType.Login) {
            setType(AuthType.Register);
        } else {
            setType(AuthType.Login);
        }
    }

    const displayedFields: Field<AuthFields>[] = type === AuthType.Login ? loginFields : registerFields;
    const header: string = type === AuthType.Login ? "Login" : "Register"
    const bottomText: string = type === AuthType.Login ? "New User?" : "Already Have an Account?"
    const bottomButtom: string = type === AuthType.Login ? "Register Here" : "Login Here"

    return (
        <CustomHeaderView header={header} goBack={() => routeReplace(Routes.HomeScreen)}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                    <ThemedView style={styles.authView}>
                        <ThemedView style={styles.formView}>
                            {displayedFields.map((field, index) => {
                                const isLastField = index === displayedFields.length - 1;
                                return (
                                    <ThemedView key={field.field} style={styles.fieldView}>
                                        <ThemedView style={styles.textView}>
                                            <ThemedText>{`${field.text}: `}</ThemedText>
                                        </ThemedView>
                                        <TextInput
                                            ref={(node) => { inputs.current[field.field] = node; }}
                                            value={field.value}
                                            onChangeText={(value) => updateFormField(field.field, value)}
                                            secureTextEntry={field.field.toLowerCase().includes("password")}
                                            style={[
                                                styles.textInput,
                                                { color: color, borderColor: color }
                                            ]}
                                            textContentType={"oneTimeCode"}
                                            keyboardType={field.field === "email" ? "email-address" : "default"}
                                            returnKeyType={isLastField ? 'done' : 'next'}
                                            onSubmitEditing={() => {
                                                if (isLastField) {
                                                    Keyboard.dismiss();
                                                } else {
                                                    focusNextField(displayedFields[index + 1].field);
                                                }
                                            }}
                                        />
                                    </ThemedView>
                                );
                            })}
                            { processing ? 
                            <LoadingSpinner />
                            :
                            <GeneralButton title={header} onPress={authUser} />
                            }
                            {type === AuthType.Login && (
                                <TouchableOpacity onPress={() => routeTo(Routes.ForgotPassword)}>
                                    <ThemedText style={[styles.switchButton, { color: Colors.button.background }]}>
                                        Forgot password?
                                    </ThemedText>
                                </TouchableOpacity>
                            )}
                        </ThemedView>
                        <ThemedView style={styles.switchView}>
                            <ThemedText>{bottomText}</ThemedText>
                            <TouchableOpacity onPress={switchType}>
                                <ThemedText style={[styles.switchButton, { color: Colors.button.background }]}>
                                    {bottomButtom}
                                </ThemedText>
                            </TouchableOpacity>
                        </ThemedView>
                    </ThemedView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
            </ScrollView>
        </CustomHeaderView>
    );    
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    authView: {
        flex: 1,
        justifyContent: 'center',
        marginBottom: 60
    },

    formView: {
        alignItems: 'center',
        paddingHorizontal: 30,
        gap: 10,
    },

    fieldView: {
        flexDirection: 'row',
        alignItems: 'flex-end'
    },

    textView: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        textAlign:'right'
    },

    textInput: {
        flex: 1.75,
        borderWidth: 1,
        borderRadius: 3,
        padding: 3,
        fontSize: 20,
        height: 30,
        width: '30%',
    },

    switchView: {
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 5,
        marginTop: 20
    },

    switchButton: {
        textDecorationLine: 'underline'
    },
})