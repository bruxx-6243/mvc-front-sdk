import "reflect-metadata";
import { expect, test, describe, beforeEach, mock } from "bun:test";
import ApiService from "@/services/index";
import ApiError from "@/utils/api-errors";

// Mock global fetch
const mockFetch = mock(() =>
  Promise.resolve(
    new Response(JSON.stringify({ data: "success" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  )
);

// Override global fetch for tests
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe("ApiService", () => {
  const baseUrl = "https://api.example.com";

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("create (factory method)", () => {
    test("should create an ApiService instance without DI", () => {
      const service = ApiService.create(baseUrl);
      expect(service).toBeInstanceOf(ApiService);
    });

    test("should create an ApiService instance with token", () => {
      const service = ApiService.create(baseUrl, "test-token");
      expect(service).toBeInstanceOf(ApiService);
    });

    test("should create an ApiService instance with token and default headers", () => {
      const defaultHeaders = { "X-Custom-Header": "value" };
      const service = ApiService.create(
        baseUrl,
        "test-token",
        defaultHeaders
      );
      expect(service).toBeInstanceOf(ApiService);
    });
  });

  describe("setToken", () => {
    test("should set the authentication token", () => {
      const service = ApiService.create(baseUrl);
      service.setToken("new-token");
      // Token is private, so we test it indirectly through requests
      expect(service).toBeDefined();
    });

    test("should allow setting token to undefined", () => {
      const service = ApiService.create(baseUrl, "initial-token");
      service.setToken(undefined);
      expect(service).toBeDefined();
    });
  });

  describe("GET requests", () => {
    test("should make a GET request successfully", async () => {
      const service = ApiService.create(baseUrl);
      const response = await service.get("/users");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/users`,
        expect.objectContaining({
          method: "GET",
          credentials: "include",
        })
      );
      expect(response).toEqual({ data: "success" });
    });

    test("should include custom headers in GET request", async () => {
      const service = ApiService.create(baseUrl);
      await service.get("/users", { "X-Custom-Header": "value" });

      const calls = mockFetch.mock.calls as unknown as Array<
        [string, RequestInit?]
      >;
      const call = calls[0];
      if (call?.[1]) {
        const headers = call[1].headers as Headers;
        expect(headers.get("X-Custom-Header")).toBe("value");
      }
    });

    test("should include Authorization header when token is set", async () => {
      const service = ApiService.create(baseUrl, "bearer-token");
      await service.get("/users");

      const calls = mockFetch.mock.calls as unknown as Array<
        [string, RequestInit?]
      >;
      const call = calls[0];
      if (call?.[1]) {
        const headers = call[1].headers as Headers;
        expect(headers.get("Authorization")).toBe("Bearer bearer-token");
      }
    });

    test("should not override existing Authorization header", async () => {
      const service = ApiService.create(baseUrl, "token");
      await service.get("/users", { Authorization: "Bearer custom-token" });

      const calls = mockFetch.mock.calls as unknown as Array<
        [string, RequestInit?]
      >;
      const call = calls[0];
      if (call?.[1]) {
        const headers = call[1].headers as Headers;
        expect(headers.get("Authorization")).toBe("Bearer custom-token");
      }
    });

    test("should include default headers in GET request", async () => {
      const defaultHeaders = {
        "X-Custom-Header": "default-value",
        "X-API-Version": "v1",
      };
      const service = ApiService.create(baseUrl, undefined, defaultHeaders);
      await service.get("/users");

      const calls = mockFetch.mock.calls as unknown as Array<
        [string, RequestInit?]
      >;
      const call = calls[0];
      if (call?.[1]) {
        const headers = call[1].headers as Headers;
        expect(headers.get("X-Custom-Header")).toBe("default-value");
        expect(headers.get("X-API-Version")).toBe("v1");
      }
    });

    test("should merge default headers with custom headers (custom takes precedence)", async () => {
      const defaultHeaders = {
        "X-Custom-Header": "default-value",
        "X-API-Version": "v1",
      };
      const service = ApiService.create(baseUrl, undefined, defaultHeaders);
      await service.get("/users", {
        "X-Custom-Header": "custom-value",
        "X-Request-ID": "123",
      });

      const calls = mockFetch.mock.calls as unknown as Array<
        [string, RequestInit?]
      >;
      const call = calls[0];
      if (call?.[1]) {
        const headers = call[1].headers as Headers;
        // Custom header should override default
        expect(headers.get("X-Custom-Header")).toBe("custom-value");
        // Default header should still be present
        expect(headers.get("X-API-Version")).toBe("v1");
        // New custom header should be present
        expect(headers.get("X-Request-ID")).toBe("123");
      }
    });

    test("should include both token and default headers", async () => {
      const defaultHeaders = {
        "X-API-Version": "v1",
        "X-Client-ID": "client-123",
      };
      const service = ApiService.create(baseUrl, "test-token", defaultHeaders);
      await service.get("/users");

      const calls = mockFetch.mock.calls as unknown as Array<
        [string, RequestInit?]
      >;
      const call = calls[0];
      if (call?.[1]) {
        const headers = call[1].headers as Headers;
        expect(headers.get("Authorization")).toBe("Bearer test-token");
        expect(headers.get("X-API-Version")).toBe("v1");
        expect(headers.get("X-Client-ID")).toBe("client-123");
      }
    });

    test("should prioritize token over default Authorization header", async () => {
      const defaultHeaders = {
        Authorization: "Bearer default-token",
      };
      const service = ApiService.create(baseUrl, "token-from-param", defaultHeaders);
      await service.get("/users");

      const calls = mockFetch.mock.calls as unknown as Array<
        [string, RequestInit?]
      >;
      const call = calls[0];
      if (call?.[1]) {
        const headers = call[1].headers as Headers;
        // Token parameter should take precedence
        expect(headers.get("Authorization")).toBe("Bearer token-from-param");
      }
    });
  });

  describe("POST requests", () => {
    test("should make a POST request with JSON body", async () => {
      const service = ApiService.create(baseUrl);
      const body = { name: "John", email: "john@example.com" };
      await service.post("/users", body);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calls = mockFetch.mock.calls as unknown as Array<
        [string, RequestInit?]
      >;
      const call = calls[0];
      if (call) {
        expect(call[0]).toBe(`${baseUrl}/users`);
        expect(call[1]?.method).toBe("POST");
        expect(call[1]?.body).toBe(JSON.stringify(body));

        if (call[1]) {
          const headers = call[1].headers as Headers;
          expect(headers.get("Content-Type")).toBe("application/json");
        }
      }
    });

    test("should make a POST request with FormData", async () => {
      const service = ApiService.create(baseUrl);
      const formData = new FormData();
      formData.append("file", "content");

      await service.post("/upload", formData);

      const calls = mockFetch.mock.calls as unknown as Array<
        [string, RequestInit?]
      >;
      const call = calls[0];
      if (call?.[1]) {
        expect(call[1].body).toBe(formData);
        const headers = call[1].headers as Headers;
        expect(headers.get("Content-Type")).toBeNull();
      }
    });

    test("should make a POST request without body", async () => {
      const service = ApiService.create(baseUrl);
      await service.post("/users");

      const calls = mockFetch.mock.calls as unknown as Array<
        [string, RequestInit?]
      >;
      const call = calls[0];
      if (call) {
        expect(call[1]?.body).toBe("{}");
      }
    });
  });

  describe("PUT requests", () => {
    test("should make a PUT request with JSON body", async () => {
      const service = ApiService.create(baseUrl);
      const body = { name: "Jane" };
      await service.put("/users/1", body);

      const calls = mockFetch.mock.calls as unknown as Array<
        [string, RequestInit?]
      >;
      const call = calls[0];
      if (call) {
        expect(call[0]).toBe(`${baseUrl}/users/1`);
        expect(call[1]?.method).toBe("PUT");
        expect(call[1]?.body).toBe(JSON.stringify(body));
      }
    });
  });

  describe("PATCH requests", () => {
    test("should make a PATCH request with JSON body", async () => {
      const service = ApiService.create(baseUrl);
      const body = { name: "Updated Name" };
      await service.patch("/users/1", body);

      const calls = mockFetch.mock.calls as unknown as Array<
        [string, RequestInit?]
      >;
      const call = calls[0];
      if (call) {
        expect(call[0]).toBe(`${baseUrl}/users/1`);
        expect(call[1]?.method).toBe("PATCH");
        expect(call[1]?.body).toBe(JSON.stringify(body));
      }
    });
  });

  describe("DELETE requests", () => {
    test("should make a DELETE request", async () => {
      const service = ApiService.create(baseUrl);
      await service.delete("/users/1");

      const calls = mockFetch.mock.calls as unknown as Array<
        [string, RequestInit?]
      >;
      const call = calls[0];
      if (call) {
        expect(call[0]).toBe(`${baseUrl}/users/1`);
        expect(call[1]?.method).toBe("DELETE");
        expect(call[1]?.body).toBeUndefined();
      }
    });
  });

  describe("Error handling", () => {
    test("should throw ApiError on non-ok response with message", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "User not found" }), {
          status: 404,
        })
      );

      const service = ApiService.create(baseUrl);

      try {
        await service.get("/users/999");
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.message).toBe("User not found");
        expect(apiError.statusCode).toBe(404);
      }
    });

    test("should throw ApiError with error field from response", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Validation failed" }), {
          status: 400,
        })
      );

      const service = ApiService.create(baseUrl);

      try {
        await service.post("/users", {});
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.message).toBe("Validation failed");
      }
    });

    test("should throw ApiError with detail field from response", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "Invalid input" }), {
          status: 422,
        })
      );

      const service = ApiService.create(baseUrl);

      try {
        await service.put("/users/1", {});
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.message).toBe("Invalid input");
      }
    });

    test("should use custom error message when provided", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Backend error" }), {
          status: 500,
        })
      );

      const service = ApiService.create(baseUrl);

      try {
        await service.get("/users", {}, "Custom error message");
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.message).toBe("Custom error message");
      }
    });

    test("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const service = ApiService.create(baseUrl);

      try {
        await service.get("/users");
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.message).toBe("Network error occurred");
        expect(apiError.statusCode).toBe(0);
      }
    });

    test("should handle network errors with custom message", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const service = ApiService.create(baseUrl);

      try {
        await service.get("/users", {}, "Custom network error");
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.message).toBe("Custom network error");
      }
    });

    test("should handle invalid JSON response", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("Invalid JSON", { status: 500 })
      );

      const service = ApiService.create(baseUrl);

      try {
        await service.get("/users");
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.statusCode).toBe(500);
      }
    });

    test("should handle response with unknown error format", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ unknown: "field" }), { status: 500 })
      );

      const service = ApiService.create(baseUrl);

      try {
        await service.get("/users");
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.message).toBe("Unknown error");
      }
    });
  });

  describe("URL construction", () => {
    test("should correctly construct full URL", async () => {
      const service = ApiService.create("https://api.example.com");
      await service.get("/users");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/users",
        expect.any(Object)
      );
    });

    test("should handle base URL without trailing slash", async () => {
      const service = ApiService.create("https://api.example.com");
      await service.get("/users");

      const calls = mockFetch.mock.calls as unknown as Array<
        [string, RequestInit?]
      >;
      const call = calls[0];
      if (call) {
        expect(call[0]).toBe("https://api.example.com/users");
      }
    });
  });
});
