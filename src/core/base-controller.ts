import { container } from "tsyringe";
import ApiError from "@/utils/api-errors";
import ApiService, { BASE_URL, AUTH_TOKEN } from "@/services/index";

/**
 * Base controller class that provides API service integration and helper methods
 * for building MVC-style controllers.
 *
 * This class handles:
 * - Dependency injection setup for API service
 * - Automatic method binding to preserve `this` context
 * - URL construction and query parameter building
 * - Error handling utilities
 *
 * @example
 * ```typescript
 * class UserController extends BaseController {
 *   constructor() {
 *     super("https://api.example.com", "auth-token");
 *   }
 *
 *   async getUsers() {
 *     const url = this.getApiUrl("/users");
 *     return this.apiService.get<User[]>(url);
 *   }
 * }
 * ```
 */
export class BaseController {
  /**
   * The API service instance used for making HTTP requests.
   * Automatically configured with base URL and optional authentication token.
   */
  protected readonly apiService: ApiService;

  /**
   * The base URL path for API requests.
   * Used internally for constructing full API URLs.
   */
  protected readonly apiBasePath: string;

  /**
   * Creates a new BaseController instance.
   *
   * Sets up dependency injection container, initializes API service,
   * and automatically binds all methods to preserve `this` context.
   *
   * @param baseUrl - The base URL for API requests (e.g., "https://api.example.com")
   * @param token - Optional authentication token that will be included in all requests
   *                as `Authorization: Bearer <token>`
   *
   * @example
   * ```typescript
   * // Without authentication
   * const controller = new BaseController("https://api.example.com");
   *
   * // With authentication
   * const controller = new BaseController("https://api.example.com", "your-token");
   * ```
   */
  constructor(baseUrl: string, token?: string) {
    const scope = container.createChildContainer();

    scope.registerInstance(BASE_URL, baseUrl);

    if (token) {
      scope.registerInstance(AUTH_TOKEN, token);
    }

    this.apiService = scope.resolve(ApiService);
    this.apiBasePath = baseUrl;

    const methodNames = Object.getOwnPropertyNames(
      Object.getPrototypeOf(this)
    ).filter((methodName) => {
      return (
        methodName !== "constructor" &&
        typeof this[methodName as keyof this] === "function"
      );
    });

    for (const methodName of methodNames) {
      const method = this[methodName as keyof this];

      this[methodName as keyof this] = (method as Function).bind(this);
    }
  }

  /**
   * Handles errors thrown during API requests.
   *
   * Converts ApiError instances to standard Error objects with meaningful messages.
   * Other errors are re-thrown as-is.
   *
   * @param error - The error to handle (can be ApiError or any other error)
   * @throws {Error} Always throws an error - never returns normally
   *
   * @example
   * ```typescript
   * try {
   *   const data = await this.apiService.get("/users");
   *   return data;
   * } catch (error) {
   *   this.handleError(error); // Converts ApiError to Error with message
   * }
   * ```
   */
  protected handleError(error: unknown): never {
    if (error instanceof ApiError) {
      throw new Error(error.getErrorMessage());
    }

    throw error;
  }

  /**
   * Constructs a full API URL by combining the API base path with the endpoint.
   *
   * Automatically handles trailing/leading slashes to ensure proper URL construction.
   *
   * @param endpoint - The API endpoint path (e.g., "/users", "/posts/123", "users")
   * @returns The full API URL combining base path and endpoint
   *
   * @example
   * ```typescript
   * // Base URL: "https://api.example.com"
   * this.getApiUrl("/users");        // Returns: "https://api.example.com/users"
   * this.getApiUrl("users");         // Returns: "https://api.example.com/users"
   * this.getApiUrl("/users/123");    // Returns: "https://api.example.com/users/123"
   *
   * // Base URL: "https://api.example.com/"
   * this.getApiUrl("/users");        // Returns: "https://api.example.com/users"
   * ```
   */
  protected getApiUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const cleanBasePath = this.apiBasePath.endsWith("/")
      ? this.apiBasePath.slice(0, -1)
      : this.apiBasePath;
    return `${cleanBasePath}${cleanEndpoint}`;
  }

  /**
   * Creates a URL string by appending query parameters to a base URL.
   *
   * @param base - The base URL (without query parameters)
   * @param query - URLSearchParams object containing query parameters
   * @returns The complete URL with query string appended (if query params exist)
   *
   * @example
   * ```typescript
   * const query = new URLSearchParams({ page: "1", limit: "10" });
   * const url = this.createURL("https://api.example.com/users", query);
   * // Returns: "https://api.example.com/users?page=1&limit=10"
   *
   * const emptyQuery = new URLSearchParams();
   * const url2 = this.createURL("https://api.example.com/users", emptyQuery);
   * // Returns: "https://api.example.com/users"
   * ```
   */
  protected createURL(base: string, query: URLSearchParams): string {
    const queryString = query.toString();
    return base + (queryString ? `?${queryString}` : "");
  }

  /**
   * Builds URLSearchParams from an object, with support for renaming and transforming values.
   *
   * Automatically handles:
   * - Filtering out undefined, null, and empty string values
   * - Converting arrays to comma-separated strings
   * - Converting objects to JSON strings
   * - Renaming parameter keys
   * - Transforming values using custom functions
   *
   * @template T - The type of the params object
   * @param params - The parameters object to convert to URLSearchParams
   * @param options - Optional configuration for renaming and transforming parameters
   * @param options.rename - Map of original keys to new query parameter names
   * @param options.transform - Map of keys to transformation functions that convert values to strings
   * @returns URLSearchParams object ready for use in URLs
   *
   * @example
   * ```typescript
   * // Basic usage
   * const params = this.buildSearchParams({ page: 1, limit: 10 });
   * // Creates: URLSearchParams with page=1&limit=10
   *
   * // With renaming
   * const params2 = this.buildSearchParams(
   *   { page: 1, limit: 10 },
   *   { rename: { page: "page_number", limit: "page_size" } }
   * );
   * // Creates: URLSearchParams with page_number=1&page_size=10
   *
   * // With transformation
   * const params3 = this.buildSearchParams(
   *   { date: new Date() },
   *   { transform: { date: (d) => (d as Date).toISOString() } }
   * );
   *
   * // With arrays
   * const params4 = this.buildSearchParams({ tags: ["js", "ts"] });
   * // Creates: URLSearchParams with tags=js,ts
   *
   * // Filtering undefined/null/empty values
   * const params5 = this.buildSearchParams({
   *   page: 1,
   *   filter: undefined,  // Will be skipped
   *   search: "",          // Will be skipped
   *   limit: null         // Will be skipped
   * });
   * // Creates: URLSearchParams with only page=1
   * ```
   */
  protected buildSearchParams<T extends Record<string, unknown>>(
    params: T | undefined,
    options?: {
      rename?: Partial<Record<keyof T, string>>;
      transform?: Partial<Record<keyof T, (v: unknown) => string | undefined>>;
    }
  ): URLSearchParams {
    const query = new URLSearchParams();

    if (!params) return query;

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;

      const queryKey = options?.rename?.[key as keyof T] ?? key;

      const transformer = options?.transform?.[key as keyof T];
      let finalValue: string;

      if (transformer) {
        const transformedValue = transformer(value);
        if (transformedValue === undefined) continue;
        finalValue = transformedValue;
      } else if (Array.isArray(value)) {
        finalValue = value.join(",");
      } else if (typeof value === "object") {
        finalValue = JSON.stringify(value);
      } else {
        finalValue = `${value as string}`;
      }

      query.set(queryKey, finalValue);
    }

    return query;
  }
}
