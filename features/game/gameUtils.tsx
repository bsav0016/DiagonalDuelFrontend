export function validateMove(gameBoard: number[][], r: number, c: number) {
    if (gameBoard[r][c] !== 0) {
        return false;
    }
    else if (r === 0) {
        return true;
    }
    else if (c === 0) {
        return true;
    }
    else if (
        gameBoard[r-1][c-1] === 0 && 
        gameBoard[r-1][c] === 0 &&
        gameBoard[r][c-1] === 0
    ) {
        return false;
    }
    else {
        return true;
    }
}

export function getAllValidMoves(gameBoard: number[][]) {
    
}