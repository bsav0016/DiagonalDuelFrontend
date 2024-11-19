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
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!ACCEPTABLE_STATUS_CODES.includes(response.status)) {
    const errorResponse = await response.json().catch(() => ({}));
    const message = errorResponse.error || errorResponse.detail || "Unknown error occurred";
    throw new NetworkError(message, response.status, errorResponse);
  }

  return await response.json();
};
