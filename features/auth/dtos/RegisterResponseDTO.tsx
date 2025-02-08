import { User } from "../User";

export class RegisterResponseDTO {
    user: User;

    constructor(data: any) {
        if (!data.user || !data.user.username || !data.user.email) {
            throw new Error("Did not get username or email");
        }

        this.user = new User(
            data.user.username,
            data.user.email,
            [],
            [],
            0,
            1000
        )
    }
}