# Deployment Guide

This document explains how to deploy this package to npm using GitHub Actions.

## Prerequisites

1. **npm Account**: You need an npm account to publish packages
2. **npm Token**: Create an automation token from npm
3. **GitHub Secrets**: Configure the secret in your GitHub repository

## Setup

### 1. Create npm Automation Token

1. Log in to [npmjs.com](https://www.npmjs.com)
2. Go to **Access Tokens** → **Generate New Token**
3. Select **Automation** token type (recommended for CI/CD)
4. Copy the token (you won't see it again!)

### 2. Configure GitHub Secret

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste your npm automation token
6. Click **Add secret**

## Publishing

### Method 1: Automatic on PR Merge (Default)

**The workflow automatically publishes to npm when:**

- A pull request is merged to `main` or `master` branch
- Code is pushed directly to `main` or `master` branch

**Automatic Version Bumping:**

- **Patch** (x.x.1): Default for regular commits
- **Minor** (x.1.0): For commits starting with `feat:` or `feature:`
- **Major** (1.0.0): For commits starting with `break:` or `breaking:`

The workflow will:

1. Run tests and type checks
2. Build the project
3. Automatically bump version based on commit message
4. Commit version bump back to repository
5. Publish to npm

### Method 2: Create a GitHub Release

1. Create a git tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. Create a GitHub Release:
   - Go to **Releases** → **Create a new release**
   - Select the tag (e.g., `v1.0.0`)
   - Add release notes
   - Click **Publish release**
3. The workflow will automatically:
   - Extract version from tag
   - Run tests
   - Build the project
   - Publish to npm

### Method 3: Manual Workflow Dispatch

1. Go to **Actions** → **Publish to npm**
2. Click **Run workflow**
3. Optionally specify:
   - **Version**: Exact version (e.g., `1.0.0`)
   - **Bump Type**: `patch`, `minor`, or `major`
4. Click **Run workflow**
5. The workflow will:
   - Update package.json version
   - Run tests
   - Build the project
   - Publish to npm

## Workflow Details

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request:

- ✅ Type checking
- ✅ Running tests with coverage
- ✅ Generating coverage HTML report
- ✅ Building the project
- ✅ Verifying build output

### Publish Workflow (`.github/workflows/publish.yml`)

Runs on:

- **Pull requests merged to main/master** (automatic)
- **Push to main/master branch** (automatic)
- **GitHub Release creation** (with tag version)
- **Manual workflow dispatch** (with optional version/bump type)

Steps:

1. Checkout code
2. Setup Bun and Node.js
3. Install dependencies
4. Run type check
5. Run tests with coverage
6. Build project
7. Extract/update version (automatic based on commit or manual)
8. Commit version bump (for PR merges/pushes)
9. Publish to npm

## Version Management

The workflow handles version updates automatically:

- **On PR Merge/Push to Main**:
  - Automatically bumps version based on commit message
  - Commits version bump back to repository
  - Uses semantic versioning (patch/minor/major)
- **From Release Tag**: Extracts version from tag (e.g., `v1.0.0` → `1.0.0`)
- **From Manual Input**: Uses provided version string or bump type
- **Commit Message Convention**:
  - `feat:` or `feature:` → Minor version bump
  - `break:` or `breaking:` → Major version bump
  - Everything else → Patch version bump

## Troubleshooting

### Authentication Failed

- Verify `NPM_TOKEN` secret is set correctly
- Ensure token has **Automation** type (not **Publish**)
- Check token hasn't expired

### Version Already Exists

- Ensure version in `package.json` is unique
- Check npm registry for existing versions
- Update version before publishing

### Build Failed

- Check build logs in GitHub Actions
- Verify all dependencies are installed
- Ensure TypeScript compilation succeeds

## Security Notes

- Never commit npm tokens to the repository
- Use GitHub Secrets for sensitive data
- Automation tokens are recommended over personal access tokens
- Tokens should have minimal required permissions
