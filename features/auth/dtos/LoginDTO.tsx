import { AuthFields } from "../AuthFields";

export class LoginDTO {
    username: string;
    password: string;

    constructor(fields: AuthFields) {
        this.username = fields.username
        this.password = fields.password
    }

    jsonify() {
        return JSON.stringify({
            username: this.username,
            password: this.password
        })
    }
}