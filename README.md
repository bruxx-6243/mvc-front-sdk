# MVC Front SDK

A modern, type-safe MVC SDK for building frontend applications with clean architecture and dependency injection support.

## Features

- 🎯 **Type-Safe**: Full TypeScript support with generics
- 🔐 **Authentication Ready**: Optional token-based authentication
- 🏗️ **Dependency Injection**: Built on tsyringe for clean architecture
- 🚀 **Simple API**: Easy-to-use controller pattern
- 📦 **Lightweight**: Minimal dependencies
- 🔄 **Auto Method Binding**: Automatic `this` context binding
- 🛠️ **Helper Methods**: Built-in utilities for URL construction and query parameters

## Installation

```bash
npm install mvc-front-sdk
# or
yarn add mvc-front-sdk
# or
bun add mvc-front-sdk
# or
pnpm add mvc-front-sdk
```

## Requirements

- Node.js >= 18.0.0
- TypeScript ^5

## Quick Start

### Basic Usage (Without Token)

```typescript
import BaseController from "mvc-front-sdk";

export default class UserController extends BaseController {
  constructor() {
    super("https://api.example.com");
  }

  async getUsers() {
    try {
      const users = await this.apiService.get<User[]>("/users");
      return users;
    } catch (error) {
      this.handleError(error);
    }
  }
}
```

### With Authentication Token

```typescript
import BaseController from "mvc-front-sdk";
import { env } from "@/env";

export default class AuthenticatedController extends BaseController {
  constructor() {
    super(env.NEXT_PUBLIC_API_BASE_URL, env.API_TOKEN);
    // All requests will automatically include: Authorization: Bearer <token>
  }

  async getProfile() {
    const profile = await this.apiService.get<User>("/profile");
    return profile;
  }
}
```

## API Reference

### BaseController

The base class that provides API service and helper methods.

#### Constructor

```typescript
constructor(baseUrl: string, token?: string)
```

- `baseUrl` (required): The base URL for your API (e.g., `"https://api.example.com"`)
- `token` (optional): Authentication token that will be included in all requests as `Authorization: Bearer <token>`

#### Protected Properties

- `apiService: ApiService` - The API service instance for making HTTP requests
- `apiBasePath: string` - The base URL path

#### Protected Methods

##### `handleError(error: unknown): never`

Handles errors and throws appropriate error messages.

```typescript
try {
  await this.apiService.get("/users");
} catch (error) {
  this.handleError(error); // Throws formatted error
}
```

##### `getApiUrl(endpoint: string): string`

Constructs a full API URL by combining the base path with an endpoint.

```typescript
const url = this.getApiUrl("/users"); // Returns: "https://api.example.com/users"
```

##### `createURL(base: string, query: URLSearchParams): string`

Creates a URL with query parameters.

```typescript
const params = new URLSearchParams({ page: "1", limit: "10" });
const url = this.createURL("/users", params); // Returns: "/users?page=1&limit=10"
```

##### `buildSearchParams<T>(params: T, options?): URLSearchParams`

Builds URLSearchParams from an object with advanced options.

```typescript
const params = this.buildSearchParams(
  { name: "John", age: 30, tags: ["developer", "designer"] },
  {
    rename: { name: "fullName" }, // Rename "name" to "fullName"
    transform: {
      age: (v) => String(v), // Custom transformation
    },
  }
);
// Result: URLSearchParams with fullName=John&age=30&tags=developer,designer
```

### ApiService

The API service provides HTTP methods for making requests.

#### Methods

##### `get<T>(url: string, headers?: HeadersInit, customErrorMessage?: string): Promise<T>`

Make a GET request.

```typescript
const users = await this.apiService.get<User[]>("/users");
```

##### `post<T>(url: string, body?: RequestBody, headers?: HeadersInit, customErrorMessage?: string): Promise<T>`

Make a POST request.

```typescript
const newUser = await this.apiService.post<User>("/users", {
  name: "John Doe",
  email: "john@example.com",
});
```

##### `put<T>(url: string, body?: RequestBody, headers?: HeadersInit, customErrorMessage?: string): Promise<T>`

Make a PUT request.

```typescript
const updatedUser = await this.apiService.put<User>("/users/123", {
  name: "Jane Doe",
});
```

##### `patch<T>(url: string, body?: RequestBody, headers?: HeadersInit, customErrorMessage?: string): Promise<T>`

Make a PATCH request.

```typescript
const patchedUser = await this.apiService.patch<User>("/users/123", {
  email: "newemail@example.com",
});
```

##### `delete<T>(url: string, headers?: HeadersInit, customErrorMessage?: string): Promise<T>`

Make a DELETE request.

```typescript
await this.apiService.delete("/users/123");
```

##### `setToken(token: string | undefined): void`

Update the authentication token at runtime.

```typescript
this.apiService.setToken(newToken);
```

## Examples

### Complete Controller Example

```typescript
import BaseController from "mvc-front-sdk";

interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserDto {
  name: string;
  email: string;
}

export default class UserController extends BaseController {
  constructor() {
    super("https://api.example.com", process.env.API_TOKEN);
  }

  // Get all users with query parameters
  async getAllUsers(filters?: { page?: number; limit?: number }) {
    try {
      const queryParams = this.buildSearchParams(filters);
      const url = this.createURL("/users", queryParams);
      const users = await this.apiService.get<User[]>(url);
      return users;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get user by ID
  async getUserById(id: string) {
    try {
      const user = await this.apiService.get<User>(`/users/${id}`);
      return user;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Create user
  async createUser(userData: CreateUserDto) {
    try {
      const newUser = await this.apiService.post<User>("/users", userData);
      return newUser;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Update user
  async updateUser(id: string, userData: Partial<User>) {
    try {
      const updatedUser = await this.apiService.put<User>(
        `/users/${id}`,
        userData
      );
      return updatedUser;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Delete user
  async deleteUser(id: string) {
    try {
      await this.apiService.delete(`/users/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }
}
```

### Using in Next.js

```typescript
// app/users/page.tsx
import UserController from "@/controllers/UserController";

export default async function UsersPage() {
  const controller = new UserController();
  const users = await controller.getAllUsers({ page: 1, limit: 10 });

  return (
    <div>
      <h1>Users</h1>
      {users.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### Using with TanStack Query

Integrate the MVC SDK controllers with TanStack Query for powerful data fetching, caching, and state management:

```typescript
// hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import UserController from "@/controllers/UserController";

const userController = new UserController();

// Query hook for fetching users
export function useUsers(filters?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["users", filters],
    queryFn: () => userController.getAllUsers(filters),
  });
}

// Query hook for fetching a single user
export function useUser(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => userController.getUserById(id),
    enabled: !!id, // Only fetch if id is provided
  });
}

// Mutation hook for creating a user
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserDto) =>
      userController.createUser(userData),
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// Mutation hook for updating a user
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      userController.updateUser(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific user and users list
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// Mutation hook for deleting a user
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userController.deleteUser(id),
    onSuccess: () => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
```

```typescript
// components/UsersList.tsx
import { useUsers, useDeleteUser } from "@/hooks/useUsers";

export function UsersList() {
  const { data: users, isLoading, error } = useUsers({ page: 1, limit: 10 });
  const deleteUser = useDeleteUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Users</h1>
      {users?.map((user) => (
        <div key={user.id}>
          <span>{user.name}</span>
          <button onClick={() => deleteUser.mutate(user.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

```typescript
// components/CreateUserForm.tsx
import { useCreateUser } from "@/hooks/useUsers";
import { useState } from "react";

export function CreateUserForm() {
  const createUser = useCreateUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(
      { name, email },
      {
        onSuccess: () => {
          setName("");
          setEmail("");
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
```

### Custom Headers

```typescript
const data = await this.apiService.post("/users", userData, {
  "X-Custom-Header": "value",
});
```

### FormData Support

```typescript
const formData = new FormData();
formData.append("file", file);
formData.append("name", "John");

const result = await this.apiService.post("/upload", formData);
```

## Error Handling

The SDK provides built-in error handling through `ApiError`:

```typescript
try {
  await this.apiService.get("/users");
} catch (error) {
  if (error instanceof ApiError) {
    console.error(error.statusCode); // HTTP status code
    console.error(error.message); // Error message
    console.error(error.body); // Response body
    console.error(error.isUnAuthenticated()); // Check if 401
  }
  this.handleError(error);
}
```

## TypeScript Support

Full TypeScript support with generics:

```typescript
interface User {
  id: string;
  name: string;
}

// Type-safe API calls
const user = await this.apiService.get<User>("/users/123");
// user is typed as User
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Repository

[GitHub](https://github.com/bruxx-6243/mvc-front-sdk)
