# Azure Container Registry GitHub Action Setup

This document describes the GitHub Action workflow for building and deploying Docker images to Azure Container Registry (ACR).

## Workflow Overview

The workflow (`.github/workflows/docker-build-deploy.yml`) is triggered on:
- Push to `main` or `master` branches
- Push of version tags (e.g., `v1.0.0`)
- Manual workflow dispatch

## Required GitHub Secrets

To use this workflow, you need to configure the following secrets in your GitHub repository settings:

### 1. `AZURE_REGISTRY_NAME`
The name of your Azure Container Registry (without `.azurecr.io`).

**Example:** If your registry URL is `myregistry.azurecr.io`, then set `AZURE_REGISTRY_NAME` to `myregistry`.

### 2. `AZURE_CLIENT_ID`
The client ID (username) for authenticating to Azure Container Registry.

This can be:
- A service principal client ID
- The ACR admin username (if admin user is enabled)

### 3. `AZURE_CLIENT_SECRET`
The client secret (password) for authenticating to Azure Container Registry.

This can be:
- A service principal client secret
- The ACR admin password (if admin user is enabled)

## Setting Up Azure Container Registry Authentication

### Option 1: Using Service Principal (Recommended)

1. Create a service principal with access to your ACR:
   ```bash
   az ad sp create-for-rbac --name "github-actions-sp" --role acrpush --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.ContainerRegistry/registries/{registry-name}
   ```

2. The command will output JSON containing `appId` and `password`. Use these values:
   - `appId` → `AZURE_CLIENT_ID`
   - `password` → `AZURE_CLIENT_SECRET`

### Option 2: Using ACR Admin User

1. Enable admin user in Azure Container Registry:
   ```bash
   az acr update -n {registry-name} --admin-enabled true
   ```

2. Get admin credentials:
   ```bash
   az acr credential show -n {registry-name}
   ```

3. Use the credentials:
   - `username` → `AZURE_CLIENT_ID`
   - `password` → `AZURE_CLIENT_SECRET`

## Adding Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add each secret with its corresponding value

## Docker Image Tags

The workflow automatically creates the following tags:
- `latest` - Latest build from the default branch
- `{branch-name}` - Branch-specific builds
- `{version}` - Semantic version tags (e.g., `1.0.0`, `1.0`, `1`)
- `{branch}-{sha}` - Commit-specific tags

## Example: Pulling the Image

After the workflow runs successfully, you can pull the image:

```bash
docker pull {registry-name}.azurecr.io/docmost:latest
```

Or a specific version:

```bash
docker pull {registry-name}.azurecr.io/docmost:v0.25.1
```

## Troubleshooting

### Authentication Errors
- Verify that all three secrets are correctly set in GitHub
- Ensure the service principal or admin user has `acrpush` or `acrpull` permissions
- Check that the registry name doesn't include `.azurecr.io`

### Build Errors
- Check the GitHub Actions logs for detailed error messages
- Ensure the Dockerfile is present in the repository root
- Verify that all build dependencies are accessible

## Manual Workflow Trigger

You can manually trigger the workflow from the GitHub Actions tab:
1. Go to **Actions** > **Build and Deploy to Azure Container Registry**
2. Click **Run workflow**
3. Select the branch and click **Run workflow**
