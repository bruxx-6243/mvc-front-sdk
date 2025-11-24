export type HeadersInit = Record<string, string> | [string, string][] | Headers;
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type RequestBody = Record<string, unknown> | FormData;
