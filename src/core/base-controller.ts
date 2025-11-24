import { container } from "tsyringe";
import ApiError from "@/utils/api-errors";
import ApiService, { BASE_URL, AUTH_TOKEN } from "@/services/index";

export default class BaseController {
  protected readonly apiService: ApiService;
  protected readonly apiBasePath: string;

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

  protected handleError(error: unknown): never {
    if (error instanceof ApiError) {
      throw new Error(error.getErrorMessage());
    }

    throw error;
  }

  /**
   * Constructs a full API URL by combining the API base path with the endpoint
   * @param endpoint - The API endpoint (e.g., "/users", "/posts/123")
   * @returns The full API URL
   */

  protected getApiUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const cleanBasePath = this.apiBasePath.endsWith("/")
      ? this.apiBasePath.slice(0, -1)
      : this.apiBasePath;
    return `${cleanBasePath}${cleanEndpoint}`;
  }

  protected createURL(base: string, query: URLSearchParams): string {
    const queryString = query.toString();
    return base + (queryString ? `?${queryString}` : "");
  }

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
