import { BaseController } from "@/core/base-controller";
import type { CRUD } from "./interfaces";

// ============================================================================
// Example 1: Simple CRUD with basic array response
// ============================================================================

interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserDto extends Record<string, unknown> {
  name: string;
  email: string;
}

interface UpdateUserDto extends Record<string, unknown> {
  name?: string;
  email?: string;
}

/**
 * Example 1: Simple implementation using defaults
 * - all() returns User[]
 * - create() returns User
 * - show() returns User
 * - update() returns User
 * - delete() returns void
 *
 * Note: You can use `implements CRUD<User>` and it will use all defaults:
 * - CreateDto = Omit<User, "id">
 * - UpdateDto = Partial<User>
 * - ID = string | number
 * - AllResponse = User[]
 * - Response = User
 */
export class UserController extends BaseController implements CRUD<User> {
  constructor(baseUrl: string, token?: string) {
    super(baseUrl, token);
  }

  // Using Omit<User, "id"> as CreateDto (default)
  async create(data: Omit<User, "id">): Promise<User> {
    try {
      const url = this.getApiUrl("/users");
      const user = await this.apiService.post<User>(url, data);
      return user;
    } catch (error) {
      this.handleError(error);
    }
  }

  async all(filters?: Record<string, unknown>): Promise<User[]> {
    try {
      const queryParams = this.buildSearchParams(filters);
      const url = this.createURL(this.getApiUrl("/users"), queryParams);
      const users = await this.apiService.get<User[]>(url);
      return users;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Using string | number as ID (default)
  async show(id: string | number): Promise<User> {
    try {
      const url = this.getApiUrl(`/users/${id}`);
      const user = await this.apiService.get<User>(url);
      return user;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Using Partial<User> as UpdateDto (default)
  async update(id: string | number, data: Partial<User>): Promise<User> {
    try {
      const url = this.getApiUrl(`/users/${id}`);
      const user = await this.apiService.put<User>(url, data);
      return user;
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const url = this.getApiUrl(`/users/${id}`);
      await this.apiService.delete(url);
    } catch (error) {
      this.handleError(error);
    }
  }
}

// ============================================================================
// Example 2: CRUD with paginated response
// ============================================================================

interface PaginatedUsersResponse {
  data: User[];
  pagination: {
    limit: number;
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Example 2: Implementation with paginated response structure
 * - all() returns PaginatedUsersResponse (wrapped with pagination)
 * - Other methods return simple types
 */
export class PaginatedUserController
  extends BaseController
  implements
    CRUD<User, CreateUserDto, UpdateUserDto, string, PaginatedUsersResponse>
{
  constructor(baseUrl: string, token?: string) {
    super(baseUrl, token);
  }

  async create(data: CreateUserDto): Promise<User> {
    try {
      const url = this.getApiUrl("/users");
      const user = await this.apiService.post<User>(url, data);
      return user;
    } catch (error) {
      this.handleError(error);
    }
  }

  async all(
    filters?: Record<string, unknown>
  ): Promise<PaginatedUsersResponse> {
    try {
      const queryParams = this.buildSearchParams(filters);
      const url = this.createURL(this.getApiUrl("/users"), queryParams);
      const response = await this.apiService.get<PaginatedUsersResponse>(url);
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  async show(id: string): Promise<User> {
    try {
      const url = this.getApiUrl(`/users/${id}`);
      const user = await this.apiService.get<User>(url);
      return user;
    } catch (error) {
      this.handleError(error);
    }
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    try {
      const url = this.getApiUrl(`/users/${id}`);
      const user = await this.apiService.put<User>(url, data);
      return user;
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const url = this.getApiUrl(`/users/${id}`);
      await this.apiService.delete(url);
    } catch (error) {
      this.handleError(error);
    }
  }
}

// ============================================================================
// Example 3: CRUD with success message responses
// ============================================================================

interface SuccessResponse {
  message: string;
  success: boolean;
}

/**
 * Example 3: Implementation where create/show/update return success messages
 * - create() returns SuccessResponse
 * - update() returns SuccessResponse
 * - show() returns SuccessResponse
 * - all() returns User[]
 * - delete() returns void
 */
export class SuccessMessageUserController
  extends BaseController
  implements
    CRUD<User, CreateUserDto, UpdateUserDto, string, User[], SuccessResponse>
{
  constructor(baseUrl: string, token?: string) {
    super(baseUrl, token);
  }

  async create(data: CreateUserDto): Promise<SuccessResponse> {
    try {
      const url = this.getApiUrl("/users");
      const response = await this.apiService.post<SuccessResponse>(url, data);
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  async all(filters?: Record<string, unknown>): Promise<User[]> {
    try {
      const queryParams = this.buildSearchParams(filters);
      const url = this.createURL(this.getApiUrl("/users"), queryParams);
      const users = await this.apiService.get<User[]>(url);
      return users;
    } catch (error) {
      this.handleError(error);
    }
  }

  async show(id: string): Promise<SuccessResponse> {
    try {
      const url = this.getApiUrl(`/users/${id}`);
      const response = await this.apiService.get<SuccessResponse>(url);
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  async update(id: string, data: UpdateUserDto): Promise<SuccessResponse> {
    try {
      const url = this.getApiUrl(`/users/${id}`);
      const response = await this.apiService.put<SuccessResponse>(url, data);
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const url = this.getApiUrl(`/users/${id}`);
      await this.apiService.delete(url);
    } catch (error) {
      this.handleError(error);
    }
  }
}

// ============================================================================
// Example 4: CRUD with completely custom backend response structure
// ============================================================================

interface CustomBackendResponse {
  result: User[];
  meta: {
    timestamp: string;
    version: string;
    [key: string]: unknown;
  };
  status: "success" | "error";
}

interface CustomCreateResponse {
  id: string;
  status: "created";
  timestamp: string;
}

/**
 * Example 4: Implementation with completely custom backend structure
 * - all() returns CustomBackendResponse
 * - create/show/update return CustomCreateResponse
 * - delete() returns void
 */
export class CustomBackendUserController
  extends BaseController
  implements
    CRUD<
      User,
      CreateUserDto,
      UpdateUserDto,
      string,
      CustomBackendResponse,
      CustomCreateResponse
    >
{
  constructor(baseUrl: string, token?: string) {
    super(baseUrl, token);
  }

  async create(data: CreateUserDto): Promise<CustomCreateResponse> {
    try {
      const url = this.getApiUrl("/users");
      const response = await this.apiService.post<CustomCreateResponse>(
        url,
        data
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  async all(filters?: Record<string, unknown>): Promise<CustomBackendResponse> {
    try {
      const queryParams = this.buildSearchParams(filters);
      const url = this.createURL(this.getApiUrl("/users"), queryParams);
      const response = await this.apiService.get<CustomBackendResponse>(url);
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  async show(id: string): Promise<CustomCreateResponse> {
    try {
      const url = this.getApiUrl(`/users/${id}`);
      const response = await this.apiService.get<CustomCreateResponse>(url);
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  async update(id: string, data: UpdateUserDto): Promise<CustomCreateResponse> {
    try {
      const url = this.getApiUrl(`/users/${id}`);
      const response = await this.apiService.put<CustomCreateResponse>(
        url,
        data
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const url = this.getApiUrl(`/users/${id}`);
      await this.apiService.delete(url);
    } catch (error) {
      this.handleError(error);
    }
  }
}

// ============================================================================
// Example 5: Using Record<string, unknown> for maximum flexibility
// ============================================================================

/**
 * Example 5: Implementation with Record<string, unknown> for complete flexibility
 * Useful when backend response structure is unknown or varies
 */
export class FlexibleUserController
  extends BaseController
  implements
    CRUD<
      User,
      CreateUserDto,
      UpdateUserDto,
      string,
      Record<string, unknown>,
      Record<string, unknown>
    >
{
  constructor(baseUrl: string, token?: string) {
    super(baseUrl, token);
  }

  async create(data: CreateUserDto): Promise<Record<string, unknown>> {
    try {
      const url = this.getApiUrl("/users");
      const response = await this.apiService.post<Record<string, unknown>>(
        url,
        data
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  async all(
    filters?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    try {
      const queryParams = this.buildSearchParams(filters);
      const url = this.createURL(this.getApiUrl("/users"), queryParams);
      const response = await this.apiService.get<Record<string, unknown>>(url);
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  async show(id: string): Promise<Record<string, unknown>> {
    try {
      const url = this.getApiUrl(`/users/${id}`);
      const user = await this.apiService.get<Record<string, unknown>>(url);
      return user;
    } catch (error) {
      this.handleError(error);
    }
  }

  async update(
    id: string,
    data: UpdateUserDto
  ): Promise<Record<string, unknown>> {
    try {
      const url = this.getApiUrl(`/users/${id}`);
      const response = await this.apiService.put<Record<string, unknown>>(
        url,
        data
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const url = this.getApiUrl(`/users/${id}`);
      await this.apiService.delete(url);
    } catch (error) {
      this.handleError(error);
    }
  }
}
