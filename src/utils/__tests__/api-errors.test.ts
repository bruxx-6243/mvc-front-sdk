import { expect, test, describe } from "bun:test";
import ApiError from "@/utils/api-errors";

describe("ApiError", () => {
  test("should create an ApiError instance with correct properties", () => {
    const error = new ApiError("Test error", 404, { detail: "Not found" });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(404);
    expect(error.body).toEqual({ detail: "Not found" });
    expect(error.name).toBe("ApiError");
  });

  test("should create an ApiError with null response", () => {
    const error = new ApiError("Network error", 0, undefined, null);

    expect(error.message).toBe("Network error");
    expect(error.statusCode).toBe(0);
    expect(error.body).toBeUndefined();
    expect(error.response).toBeNull();
  });

  test("should create an ApiError with Response object", () => {
    const mockResponse = new Response("Error", { status: 500 });
    const error = new ApiError("Server error", 500, undefined, mockResponse);

    expect(error.response).toBe(mockResponse);
    expect(error.statusCode).toBe(500);
  });

  test("isUnAuthenticated should return true for 401 status code", () => {
    const error = new ApiError("Unauthorized", 401, undefined);
    expect(error.isUnAuthenticated()).toBe(true);
  });

  test("isUnAuthenticated should return false for non-401 status codes", () => {
    const error404 = new ApiError("Not found", 404, undefined);
    const error500 = new ApiError("Server error", 500, undefined);
    const error200 = new ApiError("Success", 200, undefined);

    expect(error404.isUnAuthenticated()).toBe(false);
    expect(error500.isUnAuthenticated()).toBe(false);
    expect(error200.isUnAuthenticated()).toBe(false);
  });

  test("getErrorMessage should return the error message", () => {
    const error = new ApiError("Custom error message", 400, undefined);
    expect(error.getErrorMessage()).toBe("Custom error message");
  });

  test("should handle undefined body", () => {
    const error = new ApiError("Error", 500, undefined);
    expect(error.body).toBeUndefined();
  });

  test("should handle complex body objects", () => {
    const complexBody = {
      errors: ["Error 1", "Error 2"],
      timestamp: "2024-01-01",
      path: "/api/users",
    };
    const error = new ApiError("Validation failed", 422, complexBody);

    expect(error.body).toEqual(complexBody);
  });
});
