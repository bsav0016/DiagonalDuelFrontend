import { useThemeColor } from "@/hooks/useThemeColor";
import React from "react";
import { StyleSheet, View, TouchableOpacity, Dimensions } from "react-native";
import { Move } from "../models/Move";
import { ThemedText } from "@/components/ThemedText";
import Svg, { Line } from 'react-native-svg';
import { CountdownTimer } from "@/components/CountdownTimer";
import { Colors } from "@/constants/Colors";
import { WinnerInterface } from "../gameUtils";

interface GameBoardProps {
    gameArray: number[][];
    selectedMove: Move | null;
    lastMove: Move | null;
    time: number | null;
    winnerDetails: WinnerInterface | null;
    disabled: boolean;
    onCellClick: (row: number, col: number) => void;
    timeExpired: (() => Promise<void>) | null;
}

const GRID = 8;
const { width } = Dimensions.get("window");
// The grid is a square rotated 45 degrees, so its on-screen footprint is the side times root 2.
// Size the square so that footprint fits the screen with a margin.
const BOARD_SIDE = Math.min(width, 520) * 0.66;
const FOOTPRINT = BOARD_SIDE * Math.SQRT2;
const PADDING = BOARD_SIDE * 0.035;
const PITCH = (BOARD_SIDE - PADDING * 2) / GRID;

export function GameBoard({
    gameArray,
    selectedMove,
    lastMove,
    time,
    winnerDetails,
    disabled,
    onCellClick,
    timeExpired
}: GameBoardProps) {
    const textColor = useThemeColor({}, 'text');
    const board = Colors.board;

    const cellCentre = (index: number) => PADDING + (index + 0.5) * PITCH;

    return (
        <View style={styles.boardContainer}>
            { time &&
                <View style={styles.time}>
                    <ThemedText>Time: </ThemedText>
                    <CountdownTimer timeRemaining={time} whenZero={timeExpired} color={textColor}/>
                </View>
            }
            <View style={styles.footprint}>
                <View style={styles.board}>
                    {gameArray.map((row, rowIndex) => (
                        <View key={rowIndex} style={styles.row}>
                            {row.map((cell, colIndex) => {
                                const isHighlighted =
                                    (rowIndex === selectedMove?.row && colIndex === selectedMove?.column) ||
                                    (rowIndex === lastMove?.row && colIndex === lastMove?.column && !selectedMove);
                                const piece = cell === 1 ? board.player1 : cell === 2 ? board.player2 : null;
                                const edge = cell === 1 ? board.player1Edge : cell === 2 ? board.player2Edge : board.emptyEdge;
                                return (
                                    <TouchableOpacity
                                        key={colIndex}
                                        style={[
                                            styles.cell,
                                            { backgroundColor: piece ?? board.empty, borderColor: edge },
                                            piece && styles.piece,
                                        ]}
                                        onPress={() => onCellClick(rowIndex, colIndex)}
                                        disabled={disabled}
                                    >
                                        {piece && <View style={styles.shine} />}
                                        {cell === 3 && <View style={[styles.validDot, { backgroundColor: board.valid }]} />}
                                        {isHighlighted && <View style={styles.highlightedCell} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}

                    {winnerDetails && (
                        <Svg height={BOARD_SIDE} width={BOARD_SIDE} style={styles.svgContainer} pointerEvents="none">
                            <Line
                                x1={cellCentre(winnerDetails.startCol)} y1={cellCentre(winnerDetails.startRow)}
                                x2={cellCentre(winnerDetails.endCol)} y2={cellCentre(winnerDetails.endRow)}
                                stroke="white" strokeWidth={PITCH * 0.16} strokeLinecap="round"
                            />
                        </Svg>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    boardContainer: {
        alignItems: 'center',
        marginVertical: 12,
    },

    time: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },

    // Layout box for the rotated board, so surrounding views are laid out around the diamond.
    footprint: {
        width: FOOTPRINT,
        height: FOOTPRINT,
        alignItems: 'center',
        justifyContent: 'center',
    },

    board: {
        width: BOARD_SIDE,
        height: BOARD_SIDE,
        padding: PADDING,
        borderRadius: BOARD_SIDE * 0.09,
        backgroundColor: Colors.board.background,
        transform: [{ rotate: "-135deg" }],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
        elevation: 8,
    },

    row: {
        flex: 1,
        flexDirection: "row",
    },

    cell: {
        flex: 1,
        margin: PITCH * 0.07,
        borderRadius: PITCH,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },

    piece: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 2,
        elevation: 3,
    },

    // Specular dot. The board is rotated -135 degrees, so local +x is screen up-left.
    shine: {
        position: 'absolute',
        width: '30%',
        height: '30%',
        borderRadius: PITCH,
        backgroundColor: 'rgba(255,255,255,0.4)',
        transform: [{ translateX: PITCH * 0.16 }],
    },

    validDot: {
        width: '32%',
        height: '32%',
        borderRadius: PITCH,
    },

    highlightedCell: {
        position: 'absolute',
        height: '100%',
        width: '100%',
        borderRadius: PITCH,
        borderWidth: 3,
        borderColor: 'white',
    },

    svgContainer: {
        position: 'absolute',
        top: PADDING * 0,
        left: 0,
    }
});
