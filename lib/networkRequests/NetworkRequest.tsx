import { DB_URL, ACCEPTABLE_STATUS_CODES } from "./NetworkConstants";
import { RequestMethod } from "@/lib/networkRequests/RequestMethod";
import { NetworkError } from "@/lib/networkRequests/NetworkError";

export const networkRequest = async (
  urlExtension: string,
  method: RequestMethod,
  headers: Record<string, string>,
  body?: any,
): Promise<any> => {
  console.log(body)
  const response = await fetch(`${DB_URL}${urlExtension}`, {
    method: method,
    headers: headers,
    body: body ? body : undefined,
  });

  if (!ACCEPTABLE_STATUS_CODES.includes(response.status)) {
    const errorResponse = await response.json().catch(() => ({}));
    const message = errorResponse.error || errorResponse.detail || "Unknown error occurred";
    throw new NetworkError(message, response.status, errorResponse);
  }

  const data = await response.json();
  return data;
};
