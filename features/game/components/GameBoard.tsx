import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import React from "react";
import { StyleSheet, View, TouchableOpacity, Text, Dimensions } from "react-native";
import { Move } from "../models/Move";
import { ThemedText } from "@/components/ThemedText";
import { formatTime } from "@/lib/TimeFormatUtil";
import { GeneralButton } from "@/components/GeneralButton";

interface GameBoardProps {
    gameArray: number[][];
    selectedMove: Move | null;
    lastMove: Move | null;
    time: number | null;
    disabled: boolean;
    onCellClick: (row: number, col: number) => void;
    resetClicked: (() => void) | null;
}

export function GameBoard({ 
    gameArray,
    selectedMove,
    lastMove,
    time,
    disabled, 
    onCellClick,
    resetClicked
}: GameBoardProps) {
    const color = useThemeColor({}, 'text');
    const backgroundColor = useThemeColor({}, 'background');

    return (
        <ThemedView style={styles.boardContainer}>
            <ThemedView style={styles.board}>
                {gameArray.map((row, rowIndex) => (
                    <ThemedView key={rowIndex} style={styles.row}>
                        {row.map((cell, colIndex) => (
                            <TouchableOpacity
                                key={colIndex}
                                style={[
                                    styles.cell,
                                    cell === 1
                                    ? styles.player1
                                    : cell === 2
                                    ? styles.player2
                                    : cell === 3
                                    ? styles.available
                                    : { backgroundColor: color},
                                ]}
                                onPress={() => onCellClick(rowIndex, colIndex)}
                                disabled={disabled}
                            >
                                { ((rowIndex === selectedMove?.row && colIndex === selectedMove?.column) ||
                                    (rowIndex === lastMove?.row && colIndex === lastMove?.column && !selectedMove)) &&
                                    <View style={[styles.highlightedCell, { borderColor: backgroundColor }]}/>
                                }
                            </TouchableOpacity>
                        ))}
                    </ThemedView>
                ))}
            
            </ThemedView>
            { time &&
                <ThemedView style={styles.time}>
                    <ThemedText>
                        Time:
                    </ThemedText>
                    <ThemedText>
                        {formatTime(time)}
                    </ThemedText>
                </ThemedView>
            }
            { resetClicked &&
                <ThemedView style={[styles.time, {marginRight: 60}]}>
                    <GeneralButton 
                        title='Reset Board' 
                        onPress={resetClicked}
                        fontSize={16} 
                    />
                </ThemedView>

            }
        </ThemedView>
    );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
    boardContainer: {
        marginVertical: width * 0.2,
    },

    board: {
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: 'blue',
        transform: [{ rotate: "-135deg" }],
        maxWidth: '68%',
        aspectRatio: 1,
    },

    row: {
        flexDirection: "row",
        backgroundColor: 'none'
    },

    cell: {
        flex: 1,
        borderRadius: '50%',
        aspectRatio: 1,
        margin: 4,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#ccc",
    },

    highlightedCell: {
        height: '100%',
        width: '100%',
        borderRadius: '50%',
        borderWidth: 3,
    },

    player1: {
        backgroundColor: "#f0f",
    },

    player2: {
        backgroundColor: "#0ff",
    },

    available: {
        backgroundColor: 'green',
    },

    time: {
        position: 'absolute',
        top: '-20%',
        left: '56%',
        width: '25%',
        zIndex: 1,
    },
});
