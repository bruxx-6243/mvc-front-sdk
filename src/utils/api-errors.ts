export default class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public body: Record<string, unknown> | undefined,
    public response: Response | null = null
  ) {
    super(message);
    this.name = "ApiError";
  }

  isUnAuthenticated(): boolean {
    return this.statusCode === 401;
  }

  getErrorMessage(): string {
    return this.message;
  }
}
