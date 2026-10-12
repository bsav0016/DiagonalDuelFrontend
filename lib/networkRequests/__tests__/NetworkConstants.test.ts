import { PRODUCTION_URL, resolveApiUrl } from "../NetworkConstants";

describe("resolveApiUrl", () => {
    it("uses the production server when no URL is configured", () => {
        expect(resolveApiUrl(undefined)).toBe(PRODUCTION_URL + "api/");
        expect(resolveApiUrl("")).toBe(PRODUCTION_URL + "api/");
        expect(resolveApiUrl("   ")).toBe(PRODUCTION_URL + "api/");
    });

    it("uses the configured URL and appends the api path", () => {
        expect(resolveApiUrl("http://192.168.0.10:8000/")).toBe("http://192.168.0.10:8000/api/");
    });

    it("adds the missing trailing slash", () => {
        expect(resolveApiUrl("http://localhost:8000")).toBe("http://localhost:8000/api/");
    });
});
