import { DB_URL, ACCEPTABLE_STATUS_CODES } from "./NetworkConstants";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { NetworkError } from "@/lib/networkRequests/NetworkError";

export const networkRequest = async (
  urlExtension: string,
  method: RequestMethod,
  headers?: Record<string, string>,
  body?: any,
): Promise<any> => {
  const response = await fetch(`${DB_URL}${urlExtension}`, {
    method: method,
    headers: headers ? headers : undefined,
    body: body ? body : undefined,
  });

  if (!ACCEPTABLE_STATUS_CODES.includes(response.status)) {
    const errorResponse = await response.json().catch(() => ({}));
    let message = "Unknown error occurred";
  
    if (errorResponse.error) {
      message = errorResponse.error;
    } else if (errorResponse.detail) {
      message = typeof errorResponse.detail === 'object' 
        ? JSON.stringify(errorResponse.detail) 
        : errorResponse.detail;
    }
    
    throw new NetworkError(message, response.status, errorResponse);
  }

  const data = await response.json();
  return { data: data, status: response.status };
};
