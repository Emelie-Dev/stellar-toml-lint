# stellar-toml-lint

[![CI](https://github.com/determined-001/stellar-toml-lint/actions/workflows/ci.yml/badge.svg)](https://github.com/determined-001/stellar-toml-lint/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/stellar-toml-lint)](https://www.npmjs.com/package/stellar-toml-lint)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

`stellar-toml-lint` fetches and validates Stellar's `stellar.toml` info file. A broken file can silently make wallets, anchors, and other Stellar integrations unable to discover or use your services. Catch compatibility and configuration problems before they affect users.

## Install

```sh
npm install stellar-toml-lint
```

Requires Node.js 18 or newer.

## CLI

```sh
npx stellar-toml-lint example.org
npx stellar-toml-lint --file ./stellar.toml
npx stellar-toml-lint example.org --format github
npx stellar-toml-lint --file ./stellar.toml --json
npx stellar-toml-lint --file ./stellar.toml --ignore CORS_MISSING,ORG_NAME_MISSING
npx stellar-toml-lint example.org --strict --timeout 15000
```

Text output groups findings by severity. ANSI colors are used only for TTY output and are disabled by `NO_COLOR`. `--json` is an alias for `--format json`; GitHub annotations are produced with `--format github`.

Exit codes:

| Code | Meaning                                                |
| ---- | ------------------------------------------------------ |
| `0`  | No errors (and no warnings when `--strict` is enabled) |
| `1`  | At least one error, or a warning with `--strict`       |
| `2`  | Invalid command-line usage or an unreadable local file |

## Library

```ts
import { lintDomain, lintToml } from "stellar-toml-lint";

const local = lintToml('VERSION = "2.0.0"');
console.log(local.ok, local.issues);

const remote = await lintDomain("example.org", { timeoutMs: 5_000 });
console.log(remote.domain, remote.issues);
```

`lintToml` is synchronous and performs no network access. `lintDomain` requests `https://<domain>/.well-known/stellar.toml`; its optional `fetch` option can be injected for tests or custom environments. Findings include a stable rule ID, severity, explanation, optional TOML path, and suggested fix.

## GitHub Action

After publishing a release, the composite action can run the same checks in a workflow:

```yaml
name: Validate Stellar info file
on: [push, pull_request]
jobs:
  stellar-toml:
    runs-on: ubuntu-latest
    steps:
      - uses: determined-001/stellar-toml-lint@v0.1.0
        with:
          domain: example.org
          # Or provide a checked-in file instead:
          # file: ./stellar.toml
```

The action emits GitHub workflow annotations. Provide exactly one of `domain` and `file`.

## Rules

| ID                                 | Severity | Description                                                                 |
| ---------------------------------- | -------- | --------------------------------------------------------------------------- |
| `CORS_MISSING`                     | error    | Response lacks `Access-Control-Allow-Origin`.                               |
| `CORS_NOT_WILDCARD`                | warning  | CORS origin is present but is not `*`.                                      |
| `FILE_TOO_LARGE`                   | error    | Response is larger than 100 KB.                                             |
| `CONTENT_TYPE_UNEXPECTED`          | info     | Response content type is not text/plain.                                    |
| `TOML_PARSE_ERROR`                 | error    | TOML syntax is invalid.                                                     |
| `VERSION_INVALID`                  | warning  | VERSION is not semver-like.                                                 |
| `NETWORK_PASSPHRASE_UNKNOWN`       | warning  | Network passphrase is not a recognized public, testnet, or futurenet value. |
| `URL_FIELD_INVALID`                | error*   | Service URL is invalid or does not use HTTPS; localhost HTTP is a warning.  |
| `SIGNING_KEY_INVALID`              | error    | SIGNING_KEY is not a valid Stellar public key.                              |
| `URI_REQUEST_SIGNING_KEY_INVALID`  | error    | URI_REQUEST_SIGNING_KEY is not a valid Stellar public key.                  |
| `ACCOUNTS_INVALID`                 | error    | ACCOUNTS contains a value that is not a valid Stellar public key.           |
| `ACCOUNTS_DUPLICATE`               | warning  | ACCOUNTS contains duplicate keys.                                           |
| `WEB_AUTH_ENDPOINT_NO_SIGNING_KEY` | warning  | WEB_AUTH_ENDPOINT is set without SIGNING_KEY.                               |
| `WEB_AUTH_CONTRACT_ID_INVALID`     | error    | WEB_AUTH_CONTRACT_ID is not a valid contract address.                       |
| `CURRENCY_CODE_INVALID`            | error    | Currency code is not 1-12 alphanumeric characters.                          |
| `CURRENCY_ISSUER_INVALID`          | error    | Currency issuer is not a valid Stellar public key.                          |
| `CURRENCY_ISSUER_MISSING`          | warning  | Non-native currency has no issuer.                                          |
| `CURRENCY_DECIMALS_INVALID`        | warning  | display_decimals is not an integer from 0 to 7.                             |
| `CURRENCY_STATUS_INVALID`          | warning  | Currency status is not live, dead, test, or private.                        |
| `CURRENCY_IMAGE_URL_INVALID`       | warning  | Currency image is not a valid HTTPS URL.                                    |
| `CURRENCY_DUPLICATE`               | warning  | Currency code and issuer pair is duplicated.                                |
| `CURRENCY_FIELDS_MISSING`          | info     | Currency has neither a name nor description.                                |
| `ORG_NAME_MISSING`                 | warning  | DOCUMENTATION has no ORG_NAME.                                              |
| `ORG_URL_INVALID`                  | error    | DOCUMENTATION.ORG_URL is not a valid HTTPS URL.                             |
| `ORG_LOGO_INVALID`                 | warning  | DOCUMENTATION.ORG_LOGO is not a valid HTTPS URL.                            |
| `ORG_SUPPORT_EMAIL_INVALID`        | warning  | DOCUMENTATION.ORG_SUPPORT_EMAIL is not a valid email address.               |
| `PRINCIPAL_FIELDS_MISSING`         | info     | A principal is missing name or email.                                       |
| `VALIDATOR_PUBLIC_KEY_INVALID`     | error    | Validator PUBLIC_KEY is not a valid Stellar public key.                     |
| `FETCH_FAILED`                     | error    | The URL could not be fetched or the hostname is invalid.                    |
| `HTTP_STATUS`                      | error    | The server response status is not 200.                                      |
| `FETCH_TIMEOUT`                    | error    | The request exceeded its timeout.                                           |
| `FETCH_REDIRECT`                   | warning  | The request ended at a URL different from the requested URL.                |

\* `URL_FIELD_INVALID` reports localhost HTTP as a warning; all other invalid or non-HTTPS service URLs are errors.

## Add a rule

Add a testable `Rule` to the appropriate module under `src/rules/`, include it in `src/rules/index.ts`, and cover a passing and failing case. See [CONTRIBUTING.md](CONTRIBUTING.md) for a step-by-step guide.

## Contributing

Bug reports, feature requests, and rule proposals are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

MIT. See [LICENSE](LICENSE).
