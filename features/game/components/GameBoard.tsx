import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import React from "react";
import { StyleSheet, View, TouchableOpacity, Dimensions } from "react-native";
import { Move } from "../models/Move";
import { ThemedText } from "@/components/ThemedText";
import Svg, { Line } from 'react-native-svg';
import { GeneralButton } from "@/components/GeneralButton";
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
    resetClicked: (() => void) | null;
    timeExpired: (() => Promise<void>) | null;
}

export function GameBoard({ 
    gameArray,
    selectedMove,
    lastMove,
    time,
    winnerDetails,
    disabled,
    onCellClick,
    resetClicked,
    timeExpired
}: GameBoardProps) {
    const textColor = useThemeColor({}, 'text');
    const boardColors = Colors.board

    return (
        <ThemedView style={styles.boardContainer}>
            <ThemedView style={[styles.board, { backgroundColor: boardColors.background }]}>
                {gameArray.map((row, rowIndex) => (
                    <ThemedView key={rowIndex} style={styles.row}>
                        {row.map((cell, colIndex) => (
                            <TouchableOpacity
                                key={colIndex}
                                style={[
                                    styles.cell,
                                    { borderColor: boardColors.borderColor },
                                    cell === 1
                                    ? { backgroundColor: boardColors.player1 }
                                    : cell === 2
                                    ? { backgroundColor: boardColors.player2 }
                                    : cell === 3
                                    ? { backgroundColor: boardColors.valid }
                                    : { backgroundColor: boardColors.empty },
                                ]}
                                onPress={() => onCellClick(rowIndex, colIndex)}
                                disabled={disabled}
                            >
                                { ((rowIndex === selectedMove?.row && colIndex === selectedMove?.column) ||
                                    (rowIndex === lastMove?.row && colIndex === lastMove?.column && !selectedMove)) &&
                                    <View style={[styles.highlightedCell, { borderColor: 'black' }]}/>
                                }
                            </TouchableOpacity>
                        ))}
                    </ThemedView>
                ))}

                {winnerDetails && (
                    <Svg height={width * 0.68} width={width * 0.68} style={styles.svgContainer}>
                        <Line 
                            x1={(winnerDetails.startCol + 0.5) * (width * 0.68 / 8)} 
                            y1={(winnerDetails.startRow + 0.5) * (width * 0.68 / 8)} 
                            x2={(winnerDetails.endCol + 0.5) * (width * 0.68 / 8)} 
                            y2={(winnerDetails.endRow + 0.5) * (width * 0.68 / 8)} 
                            stroke="black" 
                            strokeWidth="3" 
                        />
                    </Svg>
                )}
            
            </ThemedView>
            { time &&
                <ThemedView style={styles.time}>
                    <ThemedText>
                        Time:
                    </ThemedText>
                    <CountdownTimer timeRemaining={time} whenZero={timeExpired} color={textColor}/>
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
        borderWidth: 1.5,
    },

    highlightedCell: {
        height: '100%',
        width: '100%',
        borderRadius: '50%',
        borderWidth: 3,
    },

    time: {
        position: 'absolute',
        top: '-20%',
        left: '56%',
        width: '25%',
        zIndex: 1,
    },

    svgContainer: {
        position: 'absolute',
        top: '0%',
        left: '0%',
        zIndex: 2,
    }
});
