import { injectable, inject } from "tsyringe";

import ApiError from "@/utils/api-errors";

import type { HeadersInit, HttpMethod, RequestBody } from "@/types";

export const BASE_URL = "ApiService:baseUrl";
export const AUTH_TOKEN = "ApiService:token";

@injectable()
export default class ApiService {
  private readonly baseUrl: string;
  private token: string | undefined;
  private readonly defaultHeaders: HeadersInit | undefined;

  constructor(
    @inject(BASE_URL) baseUrl: string,
    @inject(AUTH_TOKEN, { isOptional: true }) token: string | undefined
  ) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.defaultHeaders = undefined;
  }

  public setToken(token: string | undefined): void {
    this.token = token;
  }

  /**
   * Factory method for direct instantiation (SDK usage)
   * Creates an ApiService instance without requiring dependency injection
   * @param baseUrl - The base URL for API requests
   * @param token - Optional authentication token
   * @param defaultHeaders - Optional default headers to include in all requests
   * @returns A new ApiService instance
   */
  static create(
    baseUrl: string,
    token?: string,
    defaultHeaders?: HeadersInit
  ): ApiService {
    const service = Object.create(ApiService.prototype) as ApiService;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serviceInternal = service as any;
    serviceInternal.baseUrl = baseUrl;
    serviceInternal.token = token;
    serviceInternal.defaultHeaders = defaultHeaders;
    return service;
  }

  private createHeaders(customHeaders: HeadersInit = {}): Headers {
    // Start with default headers if provided
    const headers = new Headers(this.defaultHeaders);

    // Merge custom headers (custom headers take precedence over defaults)
    const customHeadersObj = new Headers(customHeaders);
    customHeadersObj.forEach((value, key) => {
      headers.set(key, value);
    });

    // Add token only if Authorization header is not already set by custom headers
    // This allows users to override the token with a custom Authorization header
    if (this.token && !customHeadersObj.has("Authorization")) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    return headers;
  }

  private async request<T>(
    method: HttpMethod,
    url: string,
    body?: RequestBody,
    headers: HeadersInit = {},
    customErrorMessage?: string
  ): Promise<T> {
    const requestHeaders = this.createHeaders(headers);
    const isJsonBody = body && !(body instanceof FormData);

    if (isJsonBody) {
      requestHeaders.set("Content-Type", "application/json");
    }

    const options: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: "include",
      ...(body && {
        body: isJsonBody ? JSON.stringify(body) : body,
      }),
    };

    try {
      const response = await fetch(`${this.baseUrl}${url}`, options);

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;

        const backendErrorMessage =
          (errorBody["message"] as string) ??
          (errorBody["error"] as string) ??
          (errorBody["detail"] as string) ??
          "Unknown error";

        const errorMessage = customErrorMessage ?? backendErrorMessage;
        throw new ApiError(errorMessage, response.status, errorBody, response);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        customErrorMessage ?? "Network error occurred",
        0,
        undefined,
        null
      );
    }
  }

  public get<T>(
    url: string,
    headers: HeadersInit = {},
    customErrorMessage?: string
  ): Promise<T> {
    return this.request("GET", url, undefined, headers, customErrorMessage);
  }

  public post<T>(
    url: string,
    body?: RequestBody,
    headers: HeadersInit = {},
    customErrorMessage?: string
  ): Promise<T> {
    return this.request("POST", url, body, headers, customErrorMessage);
  }

  public put<T>(
    url: string,
    body?: RequestBody,
    headers: HeadersInit = {},
    customErrorMessage?: string
  ): Promise<T> {
    return this.request("PUT", url, body, headers, customErrorMessage);
  }

  public patch<T>(
    url: string,
    body?: RequestBody,
    headers: HeadersInit = {},
    customErrorMessage?: string
  ): Promise<T> {
    return this.request("PATCH", url, body, headers, customErrorMessage);
  }

  public delete<T>(
    url: string,
    headers: HeadersInit = {},
    customErrorMessage?: string
  ): Promise<T> {
    return this.request("DELETE", url, undefined, headers, customErrorMessage);
  }
}
