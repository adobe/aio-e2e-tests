# Adobe I/O E2E Tests

E2e tests for Adobe I/O SDKs and tools.

## Requirements

Each tested repository has its own requirements, mostly environment variables to be set.

## Run

`npm run all`

## Tests

- [GH action: e2e tests](.github/workflows/app-test.yml)
  - [@adobe/aio-lib-analytics](https://github.com/adobe/aio-lib-analytics/blob/master/e2e/e2e.js)
  - [@adobe/aio-lib-target](https://github.com/adobe/aio-lib-target/blob/master/e2e/e2e.js)
  - [@adobe/aio-lib-campaign-standard](https://github.com/adobe/aio-lib-campaign-standard/tree/master/e2e)
  - [@adobe/aio-lib-audience-manager-cd](https://github.com/adobe/aio-lib-audience-manager-cd/tree/master/e2e)
  - [@adobe/aio-lib-events](https://github.com/adobe/aio-lib-events/tree/master/e2e)
  - [@adobe/aio-lib-web](https://github.com/adobe/aio-lib-web/tree/master/e2e/)
  - [@adobe/aio-lib-runtime](https://github.com/adobe/aio-lib-runtime/tree/master/e2e/)
  - [@adobe/aio-lib-customer-profile](https://github.com/adobe/aio-lib-customer-profile/tree/master/e2e)
  - [@adobe/aio-cli-plugin-app-storage](https://github.com/adobe/aio-cli-plugin-app-storage/tree/main/e2e)
- [GH action: app plugin smoke test](.github/workflows/app-smoke-test.yml)
- [GH action: asset-compute smoke test](.github/workflows/asset-compute-smoke-test.yml)

## Add a new e2e test

- expose a `npm run e2e` command in the repo under test.
- set the repo, branch, requiredEnv and doNotLog fields in `repositories.json`.
- add to the [above section](#tests) a reference to a markdown describing what the test does.

## Contributing

Contributions are welcomed! Read the [Contributing Guide](./.github/CONTRIBUTING.md) for more information.

## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
