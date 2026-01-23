# Workflow Scripts

JavaScript scripts for GitHub Actions workflows, replacing inline shell code.

## Main Script

`smoke-test.js` - Unified CLI for all smoke tests

```bash
# Usage
node smoke-test.js <command>

# Commands
create-app           # Create and deploy app (no extensions)
create-app-extension # Create and deploy app (with extension)
pack                 # Package app to zip
install              # Install app from zip
asset-compute        # Run Asset Compute tests
```

## Files

- `smoke-test.js` - Main CLI entry point
- `utils.js` - Shared utilities (runCommand, verifyOutput, etc.)
- `test-harness.js` - Local testing with mocks (no credentials needed)

## Local Testing

```bash
# Test with mocks (no credentials required)
node test-harness.js

# Test with actual CLI (requires credentials)
export AIO_RUNTIME_AUTH="your-auth"
export AIO_RUNTIME_NAMESPACE="your-namespace"
node smoke-test.js create-app
```

## Workflows

| Original | JavaScript Version |
|----------|-------------------|
| `app-smoke-test.yml` | `app-smoke-test-js.yml` |
| `asset-compute-smoke-test.yml` | `asset-compute-smoke-test-js.yml` |