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


export const AuthService = {
    async auth(fields: AuthFields, type: AuthType): Promise<User> {
        const body = type === AuthType.Login ? (new LoginDTO(fields)).jsonify() : (new RegisterDTO(fields)).jsonify()
        const headers = {
            ...HEADERS().JSON
        }
        try {
            const data = await networkRequest(
                URL_EXT.LOGIN, 
                RequestMethod.POST, 
                headers, 
                body
            )
            if (type === AuthType.Login) {
                const loginResponse: LoginResponseDTO = new LoginResponseDTO(data);
                return loginResponse.user
            } else {
                const registerResponse: RegisterResponseDTO = new RegisterResponseDTO(data);
                return registerResponse.user
            }
        } catch (error) {
            console.error("Authservice", error);
            throw(error);
        }
    },

    async logout(token: string) {
        try {
            const headers = {
                ...HEADERS(token).AUTH
            }
            await networkRequest(URL_EXT.LOGOUT, RequestMethod.POST, headers);
            return true;
        } catch (error) {
            console.error("Error during logout:", error);
            throw(error);
        }
    }
      
}