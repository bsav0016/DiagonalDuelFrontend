import { ComputerMove } from "./models/ComputerMove"

export function prioritizeCenter(row: number, col: number): number {
    return (3 - Math.abs(3 - row)) + (3 - Math.abs(3 - col))
}

const twoPresent = 10
const threePresent = 200
const fourPresent = 999999999

const blankMoveAvailable = 3

export function scoreGroupOfFour(
    gameBoard: number[][],
    row: number,
    col: number,
    cell: number,
    availableMoveSet: ComputerMove[]
): number {
    let score = 0;

    if (col <= 4) {
        score += scoreDirection(gameBoard, row, col, 0, 1, cell, availableMoveSet);
    }
    if (row <= 4) {
        score += scoreDirection(gameBoard, row, col, 1, 0, cell, availableMoveSet);
    }
    if (row <= 4 && col <= 4) {
        score += scoreDirection(gameBoard, row, col, 1, 1, cell, availableMoveSet);
    }
    if (row <=4 && col >= 3) {
        score += scoreDirection(gameBoard, row, col, 1, -1, cell, availableMoveSet);
    }

    return score;
}


function scoreDirection (
    gameBoard: number[][], 
    startRow: number, 
    startCol: number, 
    dRow: number, 
    dCol: number,
    cell: number,
    availableMoves: ComputerMove[]
) {
    let count = 1
    let blankAvailable = 0
    for (let k = 1; k < 4; k++) {
        const row = startRow + dRow * k
        const col = startCol + dCol * k
        const checkedCell = gameBoard[row][col]
        if (checkedCell === 0) {
            const move = { row: row, col: col };
            if (availableMoves.includes(move)) {
                blankAvailable += 1
            }
        }
        else if (checkedCell === cell) {
            count += 1
        }
        else {
            return 0
        }
    }

    const score = blankAvailable * blankMoveAvailable

    if (count === 2) {
        return score + twoPresent
    }
    else if (count === 3) {
        return score + threePresent
    }
    else if (count === 1) {
        return score
    }
    else {
        return fourPresent
    }
}

export function scoreGroupOfFive(
    gameBoard: number[][], 
    row: number, 
    col: number, 
    playerNumber: number,
    availableMoves: ComputerMove[]
): number {
    let score = 0;

    if (col <= 3) {
        score += scoreDirectionFive(gameBoard, row, col, 0, 1, playerNumber, availableMoves);
    }
    if (row <= 3) {
        score += scoreDirectionFive(gameBoard, row, col, 1, 0, playerNumber, availableMoves);
    }
    if (row <= 3 && col <= 3) {
        score += scoreDirectionFive(gameBoard, row, col, 1, 1, playerNumber, availableMoves);
    }
    if (row <=3 && col >= 3) {
        score += scoreDirectionFive(gameBoard, row, col, 1, -1, playerNumber, availableMoves);
    }

    return score;   
}

const twoOfFive = twoPresent * 2
const threeOfFive = threePresent * 4

const edgesAvailableMultiplier = {
    one: 1.2,
    two: 2
}

function scoreDirectionFive(
    gameBoard: number[][],
    startRow: number,
    startCol: number,
    dRow: number,
    dCol: number,
    playerNumber: number,
    availableMoves: ComputerMove[]
): number {
    if (gameBoard[startRow + dRow * 4][startCol + dCol * 4] !== 0) {
        return 0
    }
    let firstNoticed: number | null = null;
    let count = 0;

    for (let k = 1; k < 4; k++) {
        const row = startRow + dRow * k
        const col = startCol + dCol * k
        const checkedCell = gameBoard[row][col]
        if (checkedCell === 0) {
            continue
        }
        else if (firstNoticed) {
            if (checkedCell === firstNoticed) {
                count += 1
            } else {
                return 0
            }
        }
        else {
            firstNoticed = checkedCell;
            count = 1
        }
    }

    if (count === 0 || count === 1) {
        return 0
    }

    const multiplier = firstNoticed === playerNumber ? 1 : -1
    let score = count === 2 ? twoOfFive : threeOfFive
    let edgesAvailable = 0
    if (availableMoves.includes({ row: startRow, col: startCol })) {
        edgesAvailable += 1
    }
    if (availableMoves.includes({ row: startRow + 4*dRow, col: startCol + 4*dCol })) {
        edgesAvailable += 1
    }

    if (edgesAvailable === 1) {
        score *= edgesAvailableMultiplier.one
    }
    else if (edgesAvailable === 2) {
        score *= edgesAvailableMultiplier.two
    }

    return score * multiplier
}