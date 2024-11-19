import { Player } from './Player';

export class Move {
    player: Player;
    row: number;
    column: number;
    
    constructor(player: Player, row: number, column: number) {
        this.player = player;
        this.row = row;
        this.column = column;
    }
}