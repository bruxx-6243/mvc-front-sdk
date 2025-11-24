import "reflect-metadata";
import { expect, test, describe, beforeEach, mock } from "bun:test";
import BaseController from "@/core/base-controller";
import ApiError from "@/utils/api-errors";
import type { RequestBody } from "@/types";

const mockFetch = mock(() =>
  Promise.resolve(
    new Response(JSON.stringify({ data: "success" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  )
);

globalThis.fetch = mockFetch as unknown as typeof fetch;

class TestController extends BaseController {
  public async testGet(endpoint: string) {
    return this.apiService.get(endpoint);
  }

  public async testPost(endpoint: string, body?: RequestBody) {
    return this.apiService.post(endpoint, body);
  }

  public testGetApiUrl(endpoint: string): string {
    return this.getApiUrl(endpoint);
  }

  public testCreateURL(base: string, query: URLSearchParams): string {
    return this.createURL(base, query);
  }

  public testBuildSearchParams<T extends Record<string, unknown>>(
    params: T | undefined,
    options?: {
      rename?: Partial<Record<keyof T, string>>;
      transform?: Partial<Record<keyof T, (v: unknown) => string | undefined>>;
    }
  ): URLSearchParams {
    return this.buildSearchParams(params, options);
  }

  public testHandleError(error: unknown): never {
    return this.handleError(error);
  }
}

describe("BaseController", () => {
  const baseUrl = "https://api.example.com";

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("constructor", () => {
    test("should initialize with baseUrl", () => {
      const controller = new TestController(baseUrl);
      expect(controller).toBeInstanceOf(BaseController);
      expect(controller["apiBasePath"]).toBe(baseUrl);
    });

    test("should initialize with baseUrl and token", () => {
      const controller = new TestController(baseUrl, "test-token");
      expect(controller).toBeInstanceOf(BaseController);
    });

    test("should bind methods correctly", () => {
      const controller = new TestController(baseUrl);
      const boundMethod = controller.testGet;
      expect(boundMethod).toBeDefined();
      expect(typeof boundMethod).toBe("function");
    });
  });

  describe("getApiUrl", () => {
    test("should construct URL with endpoint starting with slash", () => {
      const controller = new TestController(baseUrl);
      const url = controller.testGetApiUrl("/users");
      expect(url).toBe(`${baseUrl}/users`);
    });

    test("should add leading slash to endpoint without slash", () => {
      const controller = new TestController(baseUrl);
      const url = controller.testGetApiUrl("users");
      expect(url).toBe(`${baseUrl}/users`);
    });

    test("should remove trailing slash from baseUrl", () => {
      const controller = new TestController(`${baseUrl}/`);
      const url = controller.testGetApiUrl("/users");
      expect(url).toBe(`${baseUrl}/users`);
    });

    test("should handle baseUrl with trailing slash and endpoint with leading slash", () => {
      const controller = new TestController(`${baseUrl}/`);
      const url = controller.testGetApiUrl("/users");
      expect(url).toBe(`${baseUrl}/users`);
    });

    test("should handle complex endpoints", () => {
      const controller = new TestController(baseUrl);
      const url = controller.testGetApiUrl("/users/123/posts");
      expect(url).toBe(`${baseUrl}/users/123/posts`);
    });
  });

  describe("createURL", () => {
    test("should create URL with query parameters", () => {
      const controller = new TestController(baseUrl);
      const query = new URLSearchParams({ page: "1", limit: "10" });
      const url = controller.testCreateURL(`${baseUrl}/users`, query);
      expect(url).toBe(`${baseUrl}/users?page=1&limit=10`);
    });

    test("should create URL without query parameters", () => {
      const controller = new TestController(baseUrl);
      const query = new URLSearchParams();
      const url = controller.testCreateURL(`${baseUrl}/users`, query);
      expect(url).toBe(`${baseUrl}/users`);
    });

    test("should handle empty query string", () => {
      const controller = new TestController(baseUrl);
      const query = new URLSearchParams();
      const url = controller.testCreateURL(`${baseUrl}/users`, query);
      expect(url).toBe(`${baseUrl}/users`);
    });
  });

  describe("buildSearchParams", () => {
    test("should build URLSearchParams from simple object", () => {
      const controller = new TestController(baseUrl);
      const params = { page: 1, limit: 10, name: "John" };
      const query = controller.testBuildSearchParams(params);

      expect(query.get("page")).toBe("1");
      expect(query.get("limit")).toBe("10");
      expect(query.get("name")).toBe("John");
    });

    test("should skip undefined values", () => {
      const controller = new TestController(baseUrl);
      const params = { page: 1, limit: undefined, name: "John" };
      const query = controller.testBuildSearchParams(params);

      expect(query.get("page")).toBe("1");
      expect(query.get("limit")).toBeNull();
      expect(query.get("name")).toBe("John");
    });

    test("should skip null values", () => {
      const controller = new TestController(baseUrl);
      const params = { page: 1, limit: null, name: "John" };
      const query = controller.testBuildSearchParams(params);

      expect(query.get("page")).toBe("1");
      expect(query.get("limit")).toBeNull();
      expect(query.get("name")).toBe("John");
    });

    test("should skip empty string values", () => {
      const controller = new TestController(baseUrl);
      const params = { page: 1, search: "", name: "John" };
      const query = controller.testBuildSearchParams(params);

      expect(query.get("page")).toBe("1");
      expect(query.get("search")).toBeNull();
      expect(query.get("name")).toBe("John");
    });

    test("should handle array values by joining with comma", () => {
      const controller = new TestController(baseUrl);
      const params = { tags: ["javascript", "typescript", "bun"] };
      const query = controller.testBuildSearchParams(params);

      expect(query.get("tags")).toBe("javascript,typescript,bun");
    });

    test("should stringify object values", () => {
      const controller = new TestController(baseUrl);
      const params = { filter: { status: "active", role: "admin" } };
      const query = controller.testBuildSearchParams(params);

      expect(query.get("filter")).toBe('{"status":"active","role":"admin"}');
    });

    test("should handle rename option", () => {
      const controller = new TestController(baseUrl);
      const params = { pageNumber: 1, pageSize: 10 };
      const query = controller.testBuildSearchParams(params, {
        rename: { pageNumber: "page", pageSize: "limit" },
      });

      expect(query.get("page")).toBe("1");
      expect(query.get("limit")).toBe("10");
      expect(query.get("pageNumber")).toBeNull();
      expect(query.get("pageSize")).toBeNull();
    });

    test("should handle transform option", () => {
      const controller = new TestController(baseUrl);
      const params = { date: new Date("2024-01-01") };
      const query = controller.testBuildSearchParams(params, {
        transform: {
          date: (v) => (v instanceof Date ? v.toISOString() : undefined),
        },
      });

      expect(query.get("date")).toBe("2024-01-01T00:00:00.000Z");
    });

    test("should skip transformed values that return undefined", () => {
      const controller = new TestController(baseUrl);
      const params = { value: "test" };
      const query = controller.testBuildSearchParams(params, {
        transform: {
          value: () => undefined,
        },
      });

      expect(query.get("value")).toBeNull();
    });

    test("should handle both rename and transform", () => {
      const controller = new TestController(baseUrl);
      const params = { startDate: new Date("2024-01-01") };
      const query = controller.testBuildSearchParams(params, {
        rename: { startDate: "from" },
        transform: {
          startDate: (v) => (v instanceof Date ? v.toISOString() : undefined),
        },
      });

      expect(query.get("from")).toBe("2024-01-01T00:00:00.000Z");
      expect(query.get("startDate")).toBeNull();
    });

    test("should return empty URLSearchParams for undefined params", () => {
      const controller = new TestController(baseUrl);
      const query = controller.testBuildSearchParams(undefined);

      expect(query.toString()).toBe("");
    });

    test("should handle boolean values", () => {
      const controller = new TestController(baseUrl);
      const params = { active: true, deleted: false };
      const query = controller.testBuildSearchParams(params);

      expect(query.get("active")).toBe("true");
      expect(query.get("deleted")).toBe("false");
    });

    test("should handle number values", () => {
      const controller = new TestController(baseUrl);
      const params = { count: 42, price: 99.99 };
      const query = controller.testBuildSearchParams(params);

      expect(query.get("count")).toBe("42");
      expect(query.get("price")).toBe("99.99");
    });
  });

  describe("handleError", () => {
    test("should throw Error with message from ApiError", () => {
      const controller = new TestController(baseUrl);
      const apiError = new ApiError("API Error", 404, undefined);

      try {
        controller.testHandleError(apiError);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("API Error");
        expect(error).not.toBeInstanceOf(ApiError);
      }
    });

    test("should re-throw non-ApiError errors", () => {
      const controller = new TestController(baseUrl);
      const regularError = new Error("Regular error");

      try {
        controller.testHandleError(regularError);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBe(regularError);
        expect((error as Error).message).toBe("Regular error");
      }
    });

    test("should handle string errors", () => {
      const controller = new TestController(baseUrl);

      try {
        controller.testHandleError("String error");
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBe("String error");
      }
    });
  });

  describe("apiService integration", () => {
    test("should use apiService for GET requests", async () => {
      const controller = new TestController(baseUrl);
      await controller.testGet("/users");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/users`,
        expect.any(Object)
      );
    });

    test("should use apiService for POST requests", async () => {
      const controller = new TestController(baseUrl);
      const body = { name: "John" };
      await controller.testPost("/users", body);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calls = mockFetch.mock.calls as unknown as Array<
        [string, RequestInit?]
      >;
      expect(calls.length).toBeGreaterThan(0);
      const call = calls[0];
      if (call) {
        expect(call[0]).toBe(`${baseUrl}/users`);
        expect(call[1]?.method).toBe("POST");
      }
    });

    test("should pass token to apiService when provided", async () => {
      const controller = new TestController(baseUrl, "test-token");
      await controller.testGet("/users");

      const calls = mockFetch.mock.calls as unknown as Array<
        [string, RequestInit?]
      >;
      expect(calls.length).toBeGreaterThan(0);
      const call = calls[0];
      if (call?.[1]) {
        const headers = call[1].headers as Headers;
        expect(headers.get("Authorization")).toBe("Bearer test-token");
      }
    });
  });
});
