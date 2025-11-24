# MVC Front SDK

A **framework-agnostic** MVC SDK for building frontend applications with clean architecture, type safety, and dependency injection support. Works seamlessly with any JavaScript/TypeScript framework including React, Vue, Angular, Svelte, and more.

## What is MVC Front SDK?

MVC Front SDK provides a clean, type-safe way to organize your API logic using the Model-View-Controller pattern. It's designed to work with **any frontend framework** - whether you're building with React, Vue, Angular, Next.js, Nuxt.js, or any other framework, the SDK adapts to your needs.

### Why MVC Pattern?

- **Separation of Concerns**: Keep your API logic separate from your UI components
- **Reusability**: Share controllers across different parts of your application
- **Testability**: Easily test your API logic in isolation
- **Type Safety**: Full TypeScript support with generics for compile-time safety
- **Maintainability**: Clean, organized code that's easy to understand and modify

## Features

- 🎯 **Framework-Agnostic**: Works with any JavaScript/TypeScript framework
- 🔒 **Type-Safe**: Full TypeScript support with generics
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

### Basic Controller

```typescript
import { BaseController } from "mvc-front-sdk";

interface User {
  id: string;
  name: string;
  email: string;
}

export class UserController extends BaseController {
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

  async getUserById(id: string) {
    try {
      const user = await this.apiService.get<User>(`/users/${id}`);
      return user;
    } catch (error) {
      this.handleError(error);
    }
  }
}
```

### With Authentication

```typescript
export class AuthenticatedController extends BaseController {
  constructor() {
    super("https://api.example.com", process.env.API_TOKEN);
    // All requests automatically include: Authorization: Bearer <token>
  }

  async getProfile() {
    const profile = await this.apiService.get<User>("/profile");
    return profile;
  }
}
```

## Framework Integration

The SDK is designed to work seamlessly with any framework. Below are examples showing how to integrate it with popular frameworks.

### NuxtJS

NuxtJS provides composables and server-side rendering capabilities. You can use MVC Front SDK controllers with Nuxt composables for a clean integration.

#### Installation

```bash
npm install mvc-front-sdk
```

#### Controller Setup

```typescript
// composables/controllers/user.controller.ts
import { BaseController } from "mvc-front-sdk";

interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserDto {
  name: string;
  email: string;
}

export class UserController extends BaseController {
  constructor() {
    const config = useRuntimeConfig();
    super(config.public.apiBaseUrl, config.apiToken);
  }

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

  async getUserById(id: string) {
    try {
      const user = await this.apiService.get<User>(`/users/${id}`);
      return user;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createUser(userData: CreateUserDto) {
    try {
      const newUser = await this.apiService.post<User>("/users", userData);
      return newUser;
    } catch (error) {
      this.handleError(error);
    }
  }
}
```

#### Composable Pattern

```typescript
// composables/useUsers.ts
import { UserController } from "./controllers/user.controller";

let userControllerInstance: UserController | null = null;

function getUserController() {
  if (!userControllerInstance) {
    const config = useRuntimeConfig();
    userControllerInstance = new UserController();
  }
  return userControllerInstance;
}

export const useUsers = () => {
  const controller = getUserController();

  const users = useState<User[]>("users", () => []);
  const loading = useState<boolean>("users-loading", () => false);
  const error = useState<Error | null>("users-error", () => null);

  const fetchUsers = async (filters?: { page?: number; limit?: number }) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await controller.getAllUsers(filters);
      users.value = data;
      return data;
    } catch (err) {
      error.value = err as Error;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchUser = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      const user = await controller.getUserById(id);
      return user;
    } catch (err) {
      error.value = err as Error;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createUser = async (userData: CreateUserDto) => {
    loading.value = true;
    error.value = null;
    try {
      const newUser = await controller.createUser(userData);
      users.value.push(newUser);
      return newUser;
    } catch (err) {
      error.value = err as Error;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    users: readonly(users),
    loading: readonly(loading),
    error: readonly(error),
    fetchUsers,
    fetchUser,
    createUser,
  };
};
```

#### Server-Side Rendering Usage

```typescript
// pages/users/index.vue
<template>
  <div>
    <h1>Users</h1>
    <div v-if="pending">Loading...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else>
      <div v-for="user in data" :key="user.id">
        {{ user.name }} - {{ user.email }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data, pending, error } = await useLazyAsyncData('users', () => {
  const controller = new UserController();
  return controller.getAllUsers({ page: 1, limit: 10 });
});
</script>
```

#### Client-Side Usage

```typescript
// pages/users/[id].vue
<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="userError">Error: {{ userError.message }}</div>
    <div v-else-if="user">
      <h1>{{ user.name }}</h1>
      <p>{{ user.email }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { fetchUser, loading, error: userError } = useUsers();

const user = ref<User | null>(null);

onMounted(async () => {
  user.value = await fetchUser(route.params.id as string);
});
</script>
```

### Tanstack Start

Tanstack Start is a full-stack React framework. You can use MVC Front SDK controllers in route loaders, server actions, and React components.

#### Installation

```bash
npm install mvc-front-sdk
```

#### Controller Setup

```typescript
// app/controllers/user.controller.ts
import { BaseController } from "mvc-front-sdk";

interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserDto {
  name: string;
  email: string;
}

export class UserController extends BaseController {
  constructor() {
    super(process.env.API_BASE_URL, process.env.API_TOKEN);
  }

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

  async getUserById(id: string) {
    try {
      const user = await this.apiService.get<User>(`/users/${id}`);
      return user;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createUser(userData: CreateUserDto) {
    try {
      const newUser = await this.apiService.post<User>("/users", userData);
      return newUser;
    } catch (error) {
      this.handleError(error);
    }
  }
}
```

#### Route Loader Usage

```typescript
// app/routes/users.tsx
import { createFileRoute } from "@tanstack/react-router";
import { UserController } from "../controllers/user.controller";

export const Route = createFileRoute("/users")({
  loader: async ({ search }) => {
    const controller = new UserController();
    const filters = {
      page: search.page || 1,
      limit: search.limit || 10,
    };
    return controller.getAllUsers(filters);
  },
  component: UsersPage,
});

function UsersPage() {
  const users = Route.useLoaderData();

  return (
    <div>
      <h1>Users</h1>
      {users.map((user) => (
        <div key={user.id}>
          {user.name} - {user.email}
        </div>
      ))}
    </div>
  );
}
```

#### Server Actions

```typescript
// app/actions/user.actions.ts
import { createServerFn } from "@tanstack/start";
import { UserController } from "../controllers/user.controller";

export const createUser = createServerFn()
  .validator((input: CreateUserDto) => input)
  .handler(async ({ data }) => {
    const controller = new UserController();
    return controller.createUser(data);
  });
```

#### React Component Integration

```typescript
// app/components/CreateUserForm.tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "../actions/user.actions";
import { UserController } from "../controllers/user.controller";

export function CreateUserForm() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const mutation = useMutation({
    mutationFn: async (userData: CreateUserDto) => {
      // Option 1: Use server action
      return createUser({ data: userData });

      // Option 2: Use controller directly (client-side)
      // const controller = new UserController();
      // return controller.createUser(userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setName("");
      setEmail("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, email });
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
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
```

#### TanStack Query Integration

```typescript
// app/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserController } from "../controllers/user.controller";

const userController = new UserController();

export function useUsers(filters?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["users", filters],
    queryFn: () => userController.getAllUsers(filters),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => userController.getUserById(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserDto) =>
      userController.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
```

### Angular

Angular's dependency injection system works perfectly with MVC Front SDK controllers. You can use controllers as Angular services.

#### Installation

```bash
npm install mvc-front-sdk
```

#### Service Setup

```typescript
// src/app/services/user.controller.ts
import { Injectable } from "@angular/core";
import { BaseController } from "mvc-front-sdk";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
}

@Injectable({
  providedIn: "root",
})
export class UserController extends BaseController {
  constructor() {
    super(environment.apiBaseUrl, environment.apiToken);
  }

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

  async getUserById(id: string) {
    try {
      const user = await this.apiService.get<User>(`/users/${id}`);
      return user;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createUser(userData: CreateUserDto) {
    try {
      const newUser = await this.apiService.post<User>("/users", userData);
      return newUser;
    } catch (error) {
      this.handleError(error);
    }
  }

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

  async deleteUser(id: string) {
    try {
      await this.apiService.delete(`/users/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }
}
```

#### Component Usage

```typescript
// src/app/components/user-list/user-list.component.ts
import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { UserController, User } from "../../services/user.controller";

@Component({
  selector: "app-user-list",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1>Users</h1>
      <div *ngIf="loading">Loading...</div>
      <div *ngIf="error">Error: {{ error }}</div>
      <div *ngIf="!loading && !error">
        <div *ngFor="let user of users">{{ user.name }} - {{ user.email }}</div>
      </div>
    </div>
  `,
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error: string | null = null;

  constructor(private userController: UserController) {}

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    this.loading = true;
    this.error = null;
    try {
      this.users = await this.userController.getAllUsers({
        page: 1,
        limit: 10,
      });
    } catch (err) {
      this.error = err instanceof Error ? err.message : "An error occurred";
    } finally {
      this.loading = false;
    }
  }
}
```

#### Using Async Pipe with Observables

```typescript
// src/app/services/user.service.ts
import { Injectable } from "@angular/core";
import { Observable, from } from "rxjs";
import { UserController, User, CreateUserDto } from "./user.controller";

@Injectable({
  providedIn: "root",
})
export class UserService {
  constructor(private userController: UserController) {}

  getUsers(filters?: { page?: number; limit?: number }): Observable<User[]> {
    return from(this.userController.getAllUsers(filters));
  }

  getUser(id: string): Observable<User> {
    return from(this.userController.getUserById(id));
  }

  createUser(userData: CreateUserDto): Observable<User> {
    return from(this.userController.createUser(userData));
  }
}
```

```typescript
// src/app/components/user-list/user-list.component.ts
import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { UserService } from "../../services/user.service";

@Component({
  selector: "app-user-list",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1>Users</h1>
      <div *ngIf="users$ | async as users">
        <div *ngFor="let user of users">{{ user.name }} - {{ user.email }}</div>
      </div>
    </div>
  `,
})
export class UserListComponent {
  users$ = this.userService.getUsers({ page: 1, limit: 10 });

  constructor(private userService: UserService) {}
}
```

#### Form Handling

```typescript
// src/app/components/create-user/create-user.component.ts
import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { UserController } from "../../services/user.controller";

@Component({
  selector: "app-create-user",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
      <input formControlName="name" placeholder="Name" />
      <input formControlName="email" type="email" placeholder="Email" />
      <button type="submit" [disabled]="userForm.invalid || loading">
        {{ loading ? "Creating..." : "Create User" }}
      </button>
    </form>
  `,
})
export class CreateUserComponent {
  userForm: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder, private userController: UserController) {
    this.userForm = this.fb.group({
      name: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
    });
  }

  async onSubmit() {
    if (this.userForm.valid) {
      this.loading = true;
      try {
        await this.userController.createUser(this.userForm.value);
        this.userForm.reset();
      } catch (error) {
        console.error("Error creating user:", error);
      } finally {
        this.loading = false;
      }
    }
  }
}
```

## API Reference

### BaseController

The base class that provides API service and helper methods for building MVC controllers.

#### Constructor

```typescript
constructor(baseUrl: string, token?: string)
```

**Parameters:**

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

## Advanced Examples

### Complete CRUD Controller

```typescript
import { BaseController } from "mvc-front-sdk";

interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserDto {
  name: string;
  email: string;
}

export class UserController extends BaseController {
  constructor() {
    super("https://api.example.com", process.env.API_TOKEN);
  }

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

  async getUserById(id: string) {
    try {
      const user = await this.apiService.get<User>(`/users/${id}`);
      return user;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createUser(userData: CreateUserDto) {
    try {
      const newUser = await this.apiService.post<User>("/users", userData);
      return newUser;
    } catch (error) {
      this.handleError(error);
    }
  }

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

  async deleteUser(id: string) {
    try {
      await this.apiService.delete(`/users/${id}`);
    } catch (error) {
      this.handleError(error);
    }
  }
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

### Dynamic Token Updates

```typescript
export class AuthController extends BaseController {
  constructor() {
    super("https://api.example.com");
  }

  async login(credentials: LoginDto) {
    const response = await this.apiService.post<LoginResponse>(
      "/auth/login",
      credentials
    );
    // Update token after successful login
    this.apiService.setToken(response.token);
    return response;
  }

  logout() {
    this.apiService.setToken(undefined);
  }
}
```

## Error Handling

The SDK provides built-in error handling through `ApiError`:

```typescript
import { ApiError } from "mvc-front-sdk";

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
