export class NetworkError extends Error {
    status?: number;
    details?: any;
  
    constructor(message: string, status?: number, details?: any) {
        super(message);
        this.name = "NetworkError";
        this.status = status;
        this.details = details;
    }
}
  