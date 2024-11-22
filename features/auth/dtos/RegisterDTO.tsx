import { AuthFields } from "../AuthFields";

export class RegisterDTO {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;

    constructor(
        fields: AuthFields
    ) {
        this.username = fields.username
        this.email = fields.email || ''
        this.password = fields.password
        this.confirmPassword = fields.confirmPassword || ''
    }

    jsonify() {
        if (!(this.password === this.confirmPassword)) {
            throw new Error("Password's don't match");
        }
        return JSON.stringify({
            username: this.username,
            email: this.email,
            password: this.password
        })
    }
}