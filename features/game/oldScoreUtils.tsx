/*private winScore: number = 999999999999999;
    private chooseRandomMove(thisArray: number[]): number {
        let move: number = 0;
        let chooseMove: number = 0;
        while (chooseMove === 0) {
            move = Math.floor(Math.random() * 88);
            if (thisArray.includes(move)) {
                chooseMove = 1;
            }
        }
        return move;
    }
    
    private chooseBetterBestMove(board: number[][]): ComputerMove {
        let bestMove: ComputerMove = {row: 0, col: 0};
        let bestValue: number = -9999999;
        const availableMoves: ComputerMove[] = this.getValidMoves(board);
        let score = Number.MIN_SAFE_INTEGER;
        for (let move = 0; move < availableMoves.length; move++) {
            const row: number = availableMoves[move].row;
            const col: number = availableMoves[move].col;
            let tempBoard = [...board];
            tempBoard[row][col] = this.computerNumber;
            score = this.scoreBetterPosition(tempBoard);
            if (score > bestValue) {
                bestMove = availableMoves[move];
                bestValue = score;
            } else if (score === bestValue && Math.random() * 100 < 12) {
                bestMove = availableMoves[move];
            }
        }
        const blockFour: ComputerMove | null = this.blockFourRow(board);
        if (blockFour && Math.random() * 100 < 90) {
            bestMove = blockFour;
        }
        return bestMove;
    }
    
    private blockFourRow(board: number[][]): ComputerMove | null {
        let blockFour: ComputerMove | null = null;
        const availableMoves = this.getValidMoves(board);
        for (let r = 0; r <= 7; r++) {
            const rowArray: number[] = board[r];
            for (let c = 0; c <= 4; c++) {
                const window = [rowArray[c], rowArray[c + 1], rowArray[c + 2], rowArray[c + 3]];
                const howMany = window.filter(x => x === this.opponentNumber).length;
                const howManyEmpty = window.filter(x => x === 0).length;
                if (howMany === 3 && howManyEmpty === 1) {
                    for (let i = 0; i < 4; i++) {
                        const blockMove = {row: r, col: c};
                        if (rowArray[c + i] === 0 && availableMoves.includes(blockMove)) {
                            blockFour = blockMove;
                        }
                    }
                }
            }
        }
        return blockFour;
    }
    
    private evaluateWindow(window: number[]): number {
        let score = 0;
        const howMany = window.filter(x => x === this.computerNumber).length;
        const howManyOpp = window.filter(x => x === this.opponentNumber).length;
        const howManyEmpty = window.filter(x => x === 0).length;
        if (howMany === 4) {
            score += this.winScore;
        } else if (howMany === 3 && howManyEmpty === 1) {
            score += 25;
        } else if (howMany === 2 && howManyEmpty === 2) {
            score += 1;
        }
        if (howManyOpp === 4) {
            score -= 2 * this.winScore;
        } else if (howManyOpp === 3 && howManyEmpty === 1) {
            score -= 52;
        } else if (howManyOpp === 2 && howManyEmpty === 2) {
            score -= 2;
        }
        return score;
    }

    private evaluateWindow5(window5: number[]): number {
        let score = 0;
        const howMany = window5.filter(piece => piece === this.computerNumber).length;
        const howManyOpp = window5.filter(piece => piece === this.opponentNumber).length;
        const howManyEmpty = window5.filter(piece => piece === 0).length;
    
        if (howMany === 3 && howManyEmpty === 2) {
            score += 40;
        } else if (howMany === 2 && howManyEmpty === 3) {
            score += 11;
        } else if (howMany === 1 && howManyEmpty === 4) {
            score += 4;
        }
    
        if (howManyOpp === 3 && howManyEmpty === 2) {
            score -= 200;
        } else if (howManyOpp === 2 && howManyEmpty === 3) {
            score -= 15;
        } else if (howManyOpp === 4 && howManyEmpty === 1) {
            score -= 200;
        } else if (howManyOpp === 1 && howManyEmpty === 4) {
            score -= 6;
        }
    
        return score;
    }
    
    private evaluateWindow5Enhanced(window5: number[]): number {
        let score = 0;
    
        if (
            window5[1] === this.computerNumber && 
            window5[2] === this.computerNumber && 
            window5[3] === this.computerNumber
        ) {
            score += 300;
        } else if (
            window5[1] === this.opponentNumber && 
            window5[2] === this.opponentNumber && 
            window5[3] === this.opponentNumber
        ) {
            score -= 550;
        }
    
        return score;
    }
    
    private scorePosition(board: number[][]): number {
        let score = 0;
    
        // Score horizontal
        for (let r = 0; r <= 7; r++) {
            const rowArray = board[r];
            for (let c = 0; c <= 4; c++) {
                const window = [rowArray[c], rowArray[c + 1], rowArray[c + 2], rowArray[c + 3]];
                score += this.evaluateWindow(window);
            }
            for (let c = 0; c <= 3; c++) {
                const window5 = [rowArray[c], rowArray[c + 1], rowArray[c + 2], rowArray[c + 3], rowArray[c + 4]];
                score += this.evaluateWindow5(window5);
            }
        }
    
        // Score vertical
        for (let c = 0; c <= 7; c++) {
            const colArray = this.getColumn(board, c);
            for (let r = 0; r <= 4; r++) {
                const window = [colArray[r], colArray[r + 1], colArray[r + 2], colArray[r + 3]];
                score += this.evaluateWindow(window);
            }
            for (let r = 0; r <= 3; r++) {
                const window5 = [colArray[r], colArray[r + 1], colArray[r + 2], colArray[r + 3], colArray[r + 4]];
                score += this.evaluateWindow5(window5);
            }
        }
    
        // Score positive sloped diagonal
        for (let r = 0; r <= 4; r++) {
            for (let c = 0; c <= 4; c++) {
                const window = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]];
                score += this.evaluateWindow(window);
            }
        }
        for (let r = 0; r <= 3; r++) {
            for (let c = 0; c <= 3; c++) {
                const window5 = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3], board[r + 4][c + 4]];
                score += this.evaluateWindow5(window5);
            }
        }
    
        // Score negative sloped diagonal
        for (let r = 0; r <= 4; r++) {
            for (let c = 0; c <= 4; c++) {
                const window = [board[r + 3][c], board[r + 2][c + 1], board[r + 1][c + 2], board[r][c + 3]];
                score += this.evaluateWindow(window);
            }
        }
        for (let r = 0; r <= 3; r++) {
            for (let c = 0; c <= 3; c++) {
                const window5 = [board[r + 4][c], board[r + 3][c + 1], board[r + 2][c + 2], board[r + 1][c + 3], board[r][c + 4]];
                score += this.evaluateWindow5(window5);
            }
        }
    
        // Score centers
        for (let r = 0; r <= 7; r++) {
            for (let c = 0; c <= 7; c++) {
                if (board[r][c] === this.computerNumber) {
                    const subValue = Math.abs(r - 3) + Math.abs(c - 3);
                    score += 8 - subValue;
                }
                if (board[r][c] === this.opponentNumber) {
                    const subValue = Math.abs(r - 3) + Math.abs(c - 3);
                    score -= 8 - subValue;
                }
            }
        }
    
        return score;
    }
    
    // Helper function to extract a column from a 2D array
    private getColumn(board: number[][], colIndex: number): number[] {
        return board.map(row => row[colIndex]);
    }

    private scoreBetterPosition(board: number[][]): number {
        let score: number = 0;
    
        // Score horizontal
        for (let r = 0; r < 8; r++) {
            const rowArray: number[] = board[r];
            for (let c = 0; c < 5; c++) {
                const window: number[] = [rowArray[c], rowArray[c + 1], rowArray[c + 2], rowArray[c + 3]];
                score += this.evaluateWindow(window);
            }
            for (let c = 0; c < 4; c++) {
                const window5: number[] = [rowArray[c], rowArray[c + 1], rowArray[c + 2], rowArray[c + 3], rowArray[c + 4]];
                score += this.evaluateWindow5Enhanced(window5);
            }
        }
    
        // Score vertical
        for (let c = 0; c < 8; c++) {
            const colArray: number[] = board.map(row => row[c]);
            for (let r = 0; r < 5; r++) {
                const window: number[] = [colArray[r], colArray[r + 1], colArray[r + 2], colArray[r + 3]];
                score += this.evaluateWindow(window);
            }
            for (let r = 0; r < 4; r++) {
                const window5: number[] = [colArray[r], colArray[r + 1], colArray[r + 2], colArray[r + 3], colArray[r + 4]];
                score += this.evaluateWindow5Enhanced(window5);
            }
        }
    
        // Score positive sloped diagonal
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const window: number[] = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]];
                score += this.evaluateWindow(window);
            }
        }
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const window5: number[] = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3], board[r + 4][c + 4]];
                score += this.evaluateWindow5Enhanced(window5);
            }
        }
    
        // Score negative sloped diagonal
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const window: number[] = [board[r + 3][c], board[r + 2][c + 1], board[r + 1][c + 2], board[r][c + 3]];
                score += this.evaluateWindow(window);
            }
        }
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const window5: number[] = [board[r + 4][c], board[r + 3][c + 1], board[r + 2][c + 2], board[r + 1][c + 3], board[r][c + 4]];
                score += this.evaluateWindow5Enhanced(window5);
            }
        }
    
        // Score centers
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] === this.computerNumber) {
                    const subValue: number = Math.abs(r - 3.5) + Math.abs(c - 3.5);
                    score += 5 * (8 - Math.floor(subValue));
                }
                if (board[r][c] === this.opponentNumber) {
                    const subValue: number = Math.abs(r - 3.5) + Math.abs(c - 3.5);
                    score -= 5 * (8 - Math.floor(subValue));
                }
            }
        }
    
        // Score open options
        for (let r = 1; r < 7; r++) {
            for (let c = 1; c < 7; c++) {
                if (board[r][c] === this.computerNumber || board[r][c] === this.opponentNumber) {
                    const delta = board[r][c] === this.computerNumber ? 3 : -3;
                    const deltaZero = board[r][c] === this.computerNumber ? 1 : -1;
                    const directions = [
                        [1, 0], [-1, 0], [0, 1], [0, -1],
                        [1, 1], [-1, 1], [1, -1], [-1, -1]
                    ];
                    for (const [dr, dc] of directions) {
                        if (board[r + dr][c + dc] === board[r][c]) {
                            score += delta;
                        }
                        if (board[r + dr][c + dc] === 0) {
                            score += deltaZero;
                        }
                    }
                }
            }
        }
    
        return score;
    }*/