import { Share } from "react-native";
import * as Linking from "expo-linking";
import { Routes } from "@/app/(screens)/Routes";

// The link opens the app on the join screen with the code filled in (the app's own scheme, see app.json).
export function inviteLink(code: string): string {
    return Linking.createURL(Routes.JoinChallenge, { queryParams: { code } });
}

// What gets sent to the friend. Text apps do not always make the link tappable, so the code comes with it.
export function inviteMessage(code: string, days: number): string {
    return (
        `Play Diagonal Duel with me! Each move gets ${days} ${days === 1 ? "day" : "days"}.\n\n` +
        `Open this link on your phone: ${inviteLink(code)}\n\n` +
        `Or in the app, go to Play Online > Join with a Code and enter: ${code}`
    );
}

// Opens the phone's share sheet. Resolves whether or not the person went through with it.
export async function shareInvite(code: string, days: number): Promise<void> {
    await Share.share({ message: inviteMessage(code, days) });
}
