# Smoke Tests

Individual test scripts for AIO workflows, replacing inline shell code in GitHub Actions.

## Test Scripts

Each script is standalone and can be run directly:

- `create-app.js` - Create and deploy app with no extensions
- `create-app-extension.js` - Create and deploy app with extension
- `pack.js` - Package app into a zip file
- `install.js` - Install app from zip file
- `asset-compute.js` - Run Asset Compute integration tests

## Usage

### In GitHub Actions Workflows

```yaml
- name: Create app with no extensions
  working-directory: aio-cli-plugin-app
  run: node ../e2e-tests/smoke-tests/create-app.js
  env:
    AIO_RUNTIME_AUTH: ${{ secrets.RUNTIME_AUTH }}
    AIO_RUNTIME_NAMESPACE: ${{ secrets.RUNTIME_NAMESPACE }}
```

### Local Testing

```bash
# Test with mocks (no credentials required)
cd smoke-tests
node test-harness.js

# Test with actual CLI (requires credentials)
export AIO_RUNTIME_AUTH="your-auth"
export AIO_RUNTIME_NAMESPACE="your-namespace"
node create-app.js
```

## Files

- `utils.js` - Shared utilities (runCommand, verifyOutput, createAndDeployApp, etc.)
- `test-harness.js` - Local testing with mocks (no credentials needed)
- `tests/fixtures/` - Mock output files for test-harness.js

## Workflows

These scripts are used by:
- `.github/workflows/app-smoke-test.yml`
- `.github/workflows/asset-compute-smoke-test.yml`
