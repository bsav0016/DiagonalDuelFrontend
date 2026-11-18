import { Share } from "react-native";

// The address of the invite page on the website (site/join.html). Anyone can open it: it shows the code and a button that
// opens the app on the join screen, and a link to the App Store for a friend who does not have the game yet. (A link that
// used the app's own scheme did nothing for a friend without the app, so the message sends this one.)
export const SITE_URL = "https://bsav0016.github.io/DiagonalDuelFrontend";

export function inviteLink(code: string): string {
    return `${SITE_URL}/join.html?code=${encodeURIComponent(code)}`;
}

// What gets sent to the friend. Text apps do not always make the link tappable, so the code comes with it.
export function inviteMessage(code: string, days: number): string {
    return (
        `Play Diagonal Duel with me! Each move gets ${days} ${days === 1 ? "day" : "days"}.\n\n` +
        `Tap to join (it also shows where to get the free app): ${inviteLink(code)}\n\n` +
        `Or in the app, go to Play Online > Join with a Code and enter: ${code}`
    );
}

// Opens the phone's share sheet. Resolves whether or not the person went through with it.
export async function shareInvite(code: string, days: number): Promise<void> {
    await Share.share({ message: inviteMessage(code, days) });
}
