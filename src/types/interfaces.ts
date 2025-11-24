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
 * @template CreateResponse - Response type for create operation (defaults to T, can be any type/Record)
 * @template AllResponse - Response type for getAll operation (defaults to T[], can be any type/Record)
 * @template ShowResponse - Response type for getById operation (defaults to T, can be any type/Record)
 * @template UpdateResponse - Response type for update operation (defaults to T, can be any type/Record)
 * @template DeleteResponse - Response type for delete operation (defaults to void, can be any type/Record)
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 * }
 *
 * // Example 1: Simple array response
 * interface UserCRUD1 extends CRUD<User> {
 *   // all() returns Promise<User[]>
 * }
 *
 * // Example 2: Paginated response with custom structure
 * interface PaginatedUsers {
 *   data: User[];
 *   pagination: { limit: number; page: number; page_size: number; total: number };
 * }
 * interface UserCRUD2 extends CRUD<User, any, any, string, User, PaginatedUsers> {
 *   // all() returns Promise<PaginatedUsers>
 * }
 *
 * // Example 3: Success message response
 * interface SuccessResponse {
 *   message: string;
 *   success: boolean;
 * }
 * interface UserCRUD3 extends CRUD<User, any, any, string, SuccessResponse, User[], User, SuccessResponse> {
 *   // create() returns Promise<SuccessResponse>
 *   // update() returns Promise<SuccessResponse>
 * }
 *
 * // Example 4: Any backend response structure
 * interface BackendResponse {
 *   result: User[];
 *   meta: Record<string, unknown>;
 *   status: string;
 * }
 * interface UserCRUD4 extends CRUD<User, any, any, string, any, BackendResponse> {
 *   // all() returns Promise<BackendResponse>
 * }
 * ```
 */
export interface CRUD<
  T,
  CreateDto = Omit<T, "id">,
  UpdateDto = Partial<T>,
  ID = string | number,
  CreateResponse = T,
  AllResponse = T[],
  ShowResponse = T,
  UpdateResponse = T,
  DeleteResponse = void
> {
  /**
   * Create a new entity
   * @param data - The data to create the entity with
   * @returns Promise resolving to the create response (any structure - entity, success message, wrapped response, etc.)
   */
  create(data: CreateDto): Promise<CreateResponse>;

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
  show(id: ID): Promise<ShowResponse>;

  /**
   * Update an entity by ID
   * @param id - The identifier of the entity to update
   * @param data - The data to update the entity with
   * @returns Promise resolving to the update response (any structure - entity, success message, wrapped response, etc.)
   */
  update(id: ID, data: UpdateDto): Promise<UpdateResponse>;

  /**
   * Delete an entity by ID
   * @param id - The identifier of the entity to delete
   * @returns Promise resolving to the delete response (any structure - void, success message, wrapped response, etc.)
   */
  delete(id: ID): Promise<DeleteResponse>;
}
