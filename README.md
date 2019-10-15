# Adobe I/O E2E Tests

E2e tests for Adobe I/O SDKs and tools.

## Requirements

Each tested repository has its own requirements, mostly environment variables to be set.

## Run

`npm run all`

## Tests

- [@adobe/aio-lib-state](https://github.com/adobe/aio-lib-state/blob/master/e2e/e2e.md)
- [@adobe/aio-lib-files](https://github.com/adobe/aio-lib-files/blob/master/e2e/e2e.md)
- [@adobe/aio-lib-core-tvm](https://github.com/adobe/aio-lib-core-tvm/blob/master/e2e/e2e.md)
- *more to be added*

## Add a new e2e test

- expose a `npm run e2e` command in the repo under test.
- set the repo, branch, requiredEnv and doNotLog fields in `repositories.json`.
- add to the [above section](#tests) a reference to a markdown describing what the test does.

## Contributing

Contributions are welcomed! Read the [Contributing Guide](./.github/CONTRIBUTING.md) for more information.

## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
