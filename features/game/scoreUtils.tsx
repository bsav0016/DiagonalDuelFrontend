export function positionScore(row: number, col: number): number {
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
};