import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Share, StyleSheet } from "react-native";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { GeneralButton } from "@/components/GeneralButton";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useToast } from "@/contexts/ToastContext";
import { GameBoard } from "@/features/game/components/GameBoard";
import { ConfirmView } from "@/features/game/components/ConfirmView";
import { checkWinner } from "@/features/game/gameUtils";
import { Move } from "@/features/game/models/Move";
import { Player } from "@/features/game/models/Player";
import { dayNumber, puzzleForDay, type Cell } from "@/features/puzzles/puzzleBank";
import { playMove, revealHint, startSession, tries } from "@/features/puzzles/puzzleSession";
import {
    currentStreak, EMPTY_PROGRESS, loadProgress, recordSolved, saveProgress, triesToday, type Progress,
} from "@/features/puzzles/progress";
import { puzzleShareMessage } from "@/features/puzzles/share";

const colourName = (player: 1 | 2) => (player === 1 ? "Red" : "Yellow");
const asMove = (cell: Cell | null) => (cell ? new Move(new Player(""), cell[0], cell[1]) : null);

export default function DailyPuzzleScreen() {
    const { addToast } = useToast();
    const muted = useThemeColor({}, 'muted');
    const today = useMemo(() => dayNumber(new Date()), []);
    const puzzle = useMemo(() => puzzleForDay(today), [today]);

    const [session, setSession] = useState(() => startSession(puzzle));
    const [selected, setSelected] = useState<Cell | null>(null);
    const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
    const [loaded, setLoaded] = useState(false);
    // Whether this visit counts: false when today's puzzle was already solved, so a replay never changes the result.
    const [counts, setCounts] = useState(true);
    const [justSolved, setJustSolved] = useState(false);

    useEffect(() => {
        let alive = true;
        loadProgress().then((p) => {
            if (!alive) return;
            setProgress(p);
            setCounts(triesToday(p, today) === null);
            setLoaded(true);
        });
        return () => { alive = false; };
    }, [today]);

    const solvedBefore = triesToday(progress, today);
    const winnerDetails = session.solved ? checkWinner(session.board) : null;

    const onCell = useCallback((row: number, col: number) => {
        if (session.solved) return;
        // Only squares that can be played are picked; the others are ignored.
        if (session.board[row][col] !== 0) return;
        setSelected([row, col]);
    }, [session]);

    const confirm = useCallback(async () => {
        if (!selected) return;
        const result = playMove(session, selected);
        setSelected(null);
        if (result.outcome === 'ignored') {
            addToast("You can't play there");
            return;
        }
        setSession(result.session);
        if (result.outcome === 'wrong') {
            addToast("That doesn't force a win. Try again");
        } else if (result.outcome === 'solved') {
            setJustSolved(true);
            if (counts) {
                const next = recordSolved(progress, today, tries(result.session));
                setProgress(next);
                await saveProgress(next);
            }
        }
    }, [selected, session, counts, progress, today, addToast]);

    const hint = useCallback(() => {
        const result = revealHint(session);
        setSession(result.session);
        setSelected(result.cell);
    }, [session]);

    const share = useCallback(async () => {
        const solvedTries = solvedBefore ?? tries(session);
        try {
            await Share.share({
                message: puzzleShareMessage({
                    puzzleId: puzzle.id, tries: solvedTries, streak: currentStreak(progress, today), platform: Platform.OS,
                }),
            });
        } catch {
            // The share sheet failing to open is not worth an error message.
        }
    }, [solvedBefore, session, puzzle.id, progress, today]);

    const streak = currentStreak(progress, today);
    const finished = session.solved;

    return (
        <CustomHeaderView header="Daily Puzzle">
            <ThemedView style={styles.content}>
                <ThemedText style={styles.title}>Puzzle #{puzzle.id}</ThemedText>
                {!finished ? (
                    <ThemedText style={[styles.prompt, { color: muted }]}>
                        {colourName(session.player)} to move. Win in {session.remaining}.
                    </ThemedText>
                ) : (
                    <ThemedText style={styles.prompt}>
                        {justSolved ? `Solved in ${tries(session)} ${tries(session) === 1 ? 'try' : 'tries'}!` : 'Solved'}
                    </ThemedText>
                )}
                {loaded && !finished && !counts && (
                    <ThemedText style={[styles.note, { color: muted }]}>
                        You solved today's puzzle in {solvedBefore} {solvedBefore === 1 ? 'try' : 'tries'}. This replay does not change your streak.
                    </ThemedText>
                )}

                <GameBoard
                    gameArray={session.board}
                    selectedMove={asMove(selected)}
                    lastMove={asMove(session.lastMove)}
                    time={null}
                    winnerDetails={winnerDetails}
                    disabled={finished}
                    onCellClick={onCell}
                    timeExpired={null}
                />

                {!finished && selected && <ConfirmView onPressYes={confirm} onPressNo={() => setSelected(null)} />}
                {!finished && !selected && (
                    <GeneralButton title="Show a hint (counts as a try)" onPress={hint} variant="secondary" fontSize={16} />
                )}

                {finished && (
                    <ThemedView style={styles.result}>
                        {justSolved && streak > 0 && (
                            <ThemedText style={styles.streak}>
                                {streak} day streak{progress.best > streak ? ` (best ${progress.best})` : ''}
                            </ThemedText>
                        )}
                        <ThemedText style={[styles.note, { color: muted }]}>
                            Come back tomorrow for the next puzzle.
                        </ThemedText>
                        <GeneralButton title="Share" onPress={share} fontSize={18} />
                    </ThemedView>
                )}
            </ThemedView>
        </CustomHeaderView>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },

    title: {
        fontSize: 22,
        fontWeight: '700',
    },

    prompt: {
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
    },

    note: {
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 24,
    },

    result: {
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },

    streak: {
        fontSize: 18,
        fontWeight: '700',
    },
});
