import { ComputerMove } from "./models/ComputerMove"

/*export function positionScore(row: number, col: number): number {
    return (3 - Math.abs(3 - row)) + (3 - Math.abs(3 - col))
}


export function inARow(
    gameBoard: number[][], 
    row: number, 
    col: number, 
    cell: number, 
    distance: number, 
    weight: number
) {
    let score: number = 0
    const lowThres = distance - 2
    const highThres = 9 - distance
    if (col > lowThres && checkDirection(gameBoard, row, col, 0, -1, cell, distance)) {
        score += weight
    }
    if (col < highThres && checkDirection(gameBoard, row, col, 0, 1, cell, distance)) {
        score += weight
    }

    if (row > lowThres) {
        if (checkDirection(gameBoard, row, col, -1, 0, cell, distance)) {
            score += weight
        }
        if (col > lowThres && checkDirection(gameBoard, row, col, -1, -1, cell, distance)) {
            score += weight
        }
        if (col < highThres && checkDirection(gameBoard, row, col, -1, 1, cell, distance)) {
            score += weight
        }
    }

    if (row < highThres) {
        if (checkDirection(gameBoard, row, col, 1, 0, cell, distance)) {
            score += weight
        }
        if (col > lowThres && checkDirection(gameBoard, row, col, 1, -1, cell, distance)) {
            score += weight
        }
        if (col < highThres && checkDirection(gameBoard, row, col, 1, 1, cell, distance)) {
            score += weight
        }
    }

    return score
}


const checkDirection = (
    gameBoard: number[][], 
    i: number, 
    j: number, 
    di: number, 
    dj: number, 
    cell: number, 
    distance: number
): boolean => {
    for (let k = 1; k < distance; k++) {
        const row = i + di * k;
        const col = j + dj * k;

        if (gameBoard[row][col] !== cell) {
            return false;
        }
    }
    return true;
};*/

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
            const moveKey = { row: row, col: col };
            if (availableMoves.includes(moveKey)) {
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