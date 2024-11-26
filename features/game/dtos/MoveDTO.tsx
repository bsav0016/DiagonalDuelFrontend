export class MoveDTO {
    row: number;
    column: number;

    constructor(row: number, column: number) {
        this.row = row
        this.column = column
    }

    jsonify() {
        return JSON.stringify({
            row: this.row,
            column: this.column
        })
    }
}