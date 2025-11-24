/**
 * Pagination metadata structure
 */
export interface PaginationMeta {
  limit: number;
  page: number;
  page_size: number;
  [key: string]: unknown;
}

/**
 * Wrapped response structure with data and pagination
 */
export interface PaginatedResponse<T> {
  data: T;
  pagination: PaginationMeta;
}

/**
 * Generic CRUD interface with flexible response types
 *
 * Response types are completely flexible - you can specify any structure that matches your backend API.
 * The interface does not enforce any specific response structure, allowing you to adapt to any backend format.
 *
 * @template T - The entity type
 * @template CreateDto - Type for creating entities (defaults to T without 'id')
 * @template UpdateDto - Type for updating entities (defaults to Partial<T>)
 * @template ID - The identifier type (defaults to string | number)
 * @template AllResponse - Response type for getAll operation (defaults to T[], can be any type/Record)
 * @template Response - Response type for create/show/update operations (defaults to T, can be any type/Record)
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 * }
 *
 * // Example 1: Using all defaults - just provide the entity type
 * class UserController implements CRUD<User> {
 *   // Uses defaults:
 *   // - CreateDto = Omit<User, "id">
 *   // - UpdateDto = Partial<User>
 *   // - ID = string | number
 *   // - AllResponse = User[]
 *   // - Response = User
 *
 *   create(data: Omit<User, "id">): Promise<User> { ... }
 *   all(): Promise<User[]> { ... }
 *   show(id: string | number): Promise<User> { ... }
 *   update(id: string | number, data: Partial<User>): Promise<User> { ... }
 *   delete(id: string | number): Promise<void> { ... }
 * }
 *
 * // Example 2: Custom paginated response
 * interface PaginatedUsers {
 *   data: User[];
 *   pagination: { limit: number; page: number; page_size: number };
 * }
 * class PaginatedController implements CRUD<User, any, any, string, PaginatedUsers> {
 *   // all() returns Promise<PaginatedUsers>
 *   // create/show/update return Promise<User> (default Response)
 * }
 *
 * // Example 3: Custom response types
 * interface SuccessResponse {
 *   message: string;
 *   success: boolean;
 * }
 * class SuccessController implements CRUD<User, any, any, string, User[], SuccessResponse> {
 *   // all() returns Promise<User[]>
 *   // create/show/update return Promise<SuccessResponse>
 * }
 * ```
 */
export interface CRUD<
  T,
  CreateDto = Omit<T, "id">,
  UpdateDto = Partial<T>,
  ID = string | number,
  AllResponse = T[],
  Response = T
> {
  /**
   * Create a new entity
   * @param data - The data to create the entity with
   * @returns Promise resolving to the create response (any structure - entity, success message, wrapped response, etc.)
   */
  create(data: CreateDto): Promise<Response>;

  /**
   * Get all entities, optionally with filters
   * @param filters - Optional filters/query parameters
   * @returns Promise resolving to the response (any structure - array, paginated response, wrapped response, etc.)
   */
  all(filters?: Record<string, unknown>): Promise<AllResponse>;

  /**
   * Get a single entity by ID
   * @param id - The identifier of the entity
   * @returns Promise resolving to the response (any structure - entity, wrapped response, etc.)
   */
  show(id: ID): Promise<Response>;

  /**
   * Update an entity by ID
   * @param id - The identifier of the entity to update
   * @param data - The data to update the entity with
   * @returns Promise resolving to the update response (any structure - entity, success message, wrapped response, etc.)
   */
  update(id: ID, data: UpdateDto): Promise<Response>;

  /**
   * Delete an entity by ID
   * @param id - The identifier of the entity to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(id: ID): Promise<void>;
}
