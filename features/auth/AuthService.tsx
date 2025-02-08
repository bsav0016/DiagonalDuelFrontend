import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { LoginDTO } from "@/features/auth/dtos/LoginDTO";
import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";
import { LoginResponseDTO } from "./dtos/LoginResponseDTO";
import { AuthFields } from "./AuthFields";
import { AuthType } from "./AuthType";
import { RegisterDTO } from "./dtos/RegisterDTO";
import { RegisterResponseDTO } from "./dtos/RegisterResponseDTO";
import { User } from "./User";
import { NetworkError } from "@/lib/networkRequests/NetworkError";

interface AuthResponseFields {
    user: User;
    refresh: string;
    access: string;
}

export const AuthService = {
    async auth(fields: AuthFields, type: AuthType): Promise<AuthResponseFields> {
        const body = type === AuthType.Login ? (new LoginDTO(fields)).jsonify() : (new RegisterDTO(fields)).jsonify()
        const headers = {
            ...HEADERS().JSON
        }
        const urlExt = type === AuthType.Login ? URL_EXT.LOGIN : URL_EXT.REGISTER
        try {
            const response = await networkRequest(
                urlExt, 
                RequestMethod.POST, 
                headers, 
                body
            )
            const data = response.data
            if (!data.refresh_token || !data.access_token) {
                throw new NetworkError("Tokens not provided");
            }
            let user: User;
            if (type === AuthType.Login) {
                const loginResponse: LoginResponseDTO = new LoginResponseDTO(data);
                user = loginResponse.user
            } else {
                const registerResponse: RegisterResponseDTO = new RegisterResponseDTO(data);
                user = registerResponse.user
            }
            return { user: user, refresh: data.refresh_token, access: data.access_token } //TODO: This could use a DTO
        } catch (error) {
            throw(error);
        }
    },

    async logout(token: string) {
        try {
            const headers = {
                ...HEADERS(token).AUTH
            }
            await networkRequest(
                URL_EXT.LOGOUT, 
                RequestMethod.POST, 
                headers
            );
            return true;
        } catch (error) {
            console.error("Error during logout:", error);
            throw(error);
        }
    }
      
}