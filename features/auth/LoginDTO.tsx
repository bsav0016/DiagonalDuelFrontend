export class LoginDTO {
    username: string;
    password: string;

    constructor(username: string, password: string) {
        this.username = username
        this.password = password
    }

    jsonify() {
        return JSON.stringify({
            username: this.username,
            password: this.password
        })
    }
}