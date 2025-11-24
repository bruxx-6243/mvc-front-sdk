# Testing the Package Locally

## Method 1: Using npm pack (Recommended)

1. **In this package directory** (`front-mvc`), create a tarball:

   ```bash
   npm pack
   ```

   This creates a file like `mvc-front-sdk-0.1.0.tgz`

2. **In your consuming project** (e.g., `vite-electron`), install from the tarball:

   ```bash
   npm install ../front-mvc/mvc-front-sdk-0.1.0.tgz
   # or with pnpm:
   pnpm add ../front-mvc/mvc-front-sdk-0.1.0.tgz
   ```

3. **Test the import**:

   ```typescript
   import { BaseController } from "mvc-front-sdk";

   class AuthController extends BaseController {
     constructor() {
       super("https://api.example.com");
     }
   }
   ```

## Method 2: Using npm link

1. **In this package directory**, create a link:

   ```bash
   npm link
   ```

2. **In your consuming project**, link to it:
   ```bash
   npm link mvc-front-sdk
   ```

## Method 3: Using file path (for pnpm/yarn)

In your consuming project's `package.json`:

```json
{
  "dependencies": {
    "mvc-front-sdk": "file:../front-mvc"
  }
}
```

Then run `pnpm install` or `yarn install`.

## Verifying the Build

Before testing, make sure the build is up to date:

```bash
bun run build:all
```

Check that `dist/index.d.ts` contains:

```typescript
export * from "./core/base-controller";
```

And `dist/core/base-controller.d.ts` contains:

```typescript
export declare class BaseController {
  // ...
}
```
