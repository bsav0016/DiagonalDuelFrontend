import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { LoginDTO } from "@/features/auth/LoginDTO";
import { HEADERS, URL_EXT } from "@/lib/networkRequests/NetworkConstants";
import { NetworkError } from "@/lib/networkRequests/NetworkError";
import { networkRequest } from "@/lib/networkRequests/NetworkRequest";


export const AuthService = {
    async login(loginDTO: LoginDTO) {
        const headers = {
            ...HEADERS().JSON
        }
        try {
            const data = await networkRequest(
                URL_EXT.LOGIN, 
                RequestMethod.POST, 
                headers, 
                loginDTO.jsonify()
            )
            const token = data.token
            if (!token) {
                throw new NetworkError("Token not provided in response", data?.status, data);
            }
            return token
        } catch (error) {
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