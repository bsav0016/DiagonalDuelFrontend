import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import React from "react";
import { StyleSheet, View, TouchableOpacity, Text, Dimensions } from "react-native";

interface GameBoardProps {
    gameArray: number[][];
    selectedRow: number | null;
    selectedCol: number | null;
    lastRow?: number | null;
    lastCol?: number | null;
    disabled: boolean;
    onCellClick: (row: number, col: number) => void;
}

export function GameBoard({ 
    gameArray,
    selectedRow,
    selectedCol,
    lastRow = null,
    lastCol = null, 
    disabled, 
    onCellClick 
}: GameBoardProps) {
    const color = useThemeColor({}, 'text');
    const backgroundColor = useThemeColor({}, 'background');

    return (
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
                                : { backgroundColor: color},
                            ]}
                            onPress={() => onCellClick(rowIndex, colIndex)}
                            disabled={disabled}
                        >
                            { ((rowIndex === selectedRow && colIndex === selectedCol) ||
                                (rowIndex === lastRow && colIndex === lastCol)) &&
                                <View style={[styles.highlightedCell, { borderColor: backgroundColor }]}/>
                            }
                        </TouchableOpacity>
                    ))}
                </ThemedView>
            ))}
        </ThemedView>
    );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
    board: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: 'blue',
        transform: [{ rotate: "-135deg" }],
        maxWidth: '68%',
        marginVertical: width * 0.2,
        aspectRatio: 1
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
        borderColor: 'black'
    },

    player1: {
        backgroundColor: "#f0f",
    },

    player2: {
        backgroundColor: "#0ff",
    },
});
