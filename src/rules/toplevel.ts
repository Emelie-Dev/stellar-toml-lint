import { isValidContractId, isValidPublicKey } from "../stellar-keys.js";
import type { LintIssue, Rule } from "../types.js";

const urlFields = [
  "FEDERATION_SERVER",
  "AUTH_SERVER",
  "TRANSFER_SERVER",
  "TRANSFER_SERVER_SEP0024",
  "KYC_SERVER",
  "WEB_AUTH_ENDPOINT",
  "HORIZON_URL",
  "DIRECTORY_SERVER",
];
const knownPassphrases = [
  "Public Global Stellar Network ; September 2015",
  "Test SDF Network ; September 2015",
  "Test SDF Future Network ; October 2022",
];

export const topLevelRules: Rule[] = [
  {
    id: "VERSION_INVALID",
    severity: "warning",
    description: "VERSION should be a semver-like string.",
    check: ({ toml }) =>
      toml.VERSION !== undefined &&
      (typeof toml.VERSION !== "string" ||
        !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(
          toml.VERSION,
        ))
        ? [
            {
              rule: "VERSION_INVALID",
              severity: "warning",
              message: "VERSION is not a semver-like string.",
              path: "VERSION",
              hint: "Use a value such as 2.0.0.",
            },
          ]
        : [],
  },
  {
    id: "NETWORK_PASSPHRASE_UNKNOWN",
    severity: "warning",
    description:
      "NETWORK_PASSPHRASE should be a known Stellar network passphrase.",
    check: ({ toml }) =>
      toml.NETWORK_PASSPHRASE !== undefined &&
      !knownPassphrases.includes(String(toml.NETWORK_PASSPHRASE))
        ? [
            {
              rule: "NETWORK_PASSPHRASE_UNKNOWN",
              severity: "warning",
              message: "Unknown Stellar network passphrase.",
              path: "NETWORK_PASSPHRASE",
              hint: "Use the public, testnet, or futurenet passphrase.",
            },
          ]
        : [],
  },
  {
    id: "URL_FIELD_INVALID",
    severity: "error",
    description:
      "Service URL fields should use HTTPS (localhost HTTP is permitted with a warning).",
    check: ({ toml }) =>
      urlFields.flatMap<LintIssue>((field) => {
        const value = toml[field];
        if (value === undefined) return [];
        let parsed: URL;
        try {
          parsed = new URL(String(value));
        } catch {
          return [
            {
              rule: "URL_FIELD_INVALID",
              severity: "error" as const,
              message: `${field} is not a valid URL.`,
              path: field,
              hint: "Provide an absolute HTTPS URL.",
            },
          ];
        }
        if (parsed.protocol === "https:") return [];
        if (
          parsed.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)
        )
          return [
            {
              rule: "URL_FIELD_INVALID",
              severity: "warning" as const,
              message: `${field} uses HTTP on localhost.`,
              path: field,
              hint: "Use HTTPS outside local development.",
            },
          ];
        return [
          {
            rule: "URL_FIELD_INVALID",
            severity: "error" as const,
            message: `${field} must use HTTPS.`,
            path: field,
            hint: "Provide an absolute HTTPS URL.",
          },
        ];
      }),
  },
  {
    id: "SIGNING_KEY_INVALID",
    severity: "error",
    description: "SIGNING_KEY must be a valid Stellar public key.",
    check: ({ toml }) =>
      toml.SIGNING_KEY !== undefined && !isValidPublicKey(toml.SIGNING_KEY)
        ? [
            {
              rule: "SIGNING_KEY_INVALID",
              severity: "error",
              message: "SIGNING_KEY is not a valid Stellar public key.",
              path: "SIGNING_KEY",
              hint: "Use a valid G... Stellar public key.",
            },
          ]
        : [],
  },
  {
    id: "URI_REQUEST_SIGNING_KEY_INVALID",
    severity: "error",
    description: "URI_REQUEST_SIGNING_KEY must be a valid Stellar public key.",
    check: ({ toml }) =>
      toml.URI_REQUEST_SIGNING_KEY !== undefined &&
      !isValidPublicKey(toml.URI_REQUEST_SIGNING_KEY)
        ? [
            {
              rule: "URI_REQUEST_SIGNING_KEY_INVALID",
              severity: "error",
              message:
                "URI_REQUEST_SIGNING_KEY is not a valid Stellar public key.",
              path: "URI_REQUEST_SIGNING_KEY",
              hint: "Use a valid G... Stellar public key.",
            },
          ]
        : [],
  },
  {
    id: "ACCOUNTS_INVALID",
    severity: "error",
    description: "ACCOUNTS must contain valid Stellar public keys.",
    check: ({ toml }) =>
      toml.ACCOUNTS !== undefined &&
      (!Array.isArray(toml.ACCOUNTS) ||
        toml.ACCOUNTS.some((key) => !isValidPublicKey(key)))
        ? [
            {
              rule: "ACCOUNTS_INVALID",
              severity: "error",
              message:
                "ACCOUNTS must be an array of valid Stellar public keys.",
              path: "ACCOUNTS",
              hint: "Remove invalid values and use G... public keys.",
            },
          ]
        : [],
  },
  {
    id: "ACCOUNTS_DUPLICATE",
    severity: "warning",
    description: "ACCOUNTS should not list a public key more than once.",
    check: ({ toml }) =>
      Array.isArray(toml.ACCOUNTS) &&
      new Set(toml.ACCOUNTS).size !== toml.ACCOUNTS.length
        ? [
            {
              rule: "ACCOUNTS_DUPLICATE",
              severity: "warning",
              message: "ACCOUNTS contains duplicate keys.",
              path: "ACCOUNTS",
              hint: "Keep each account only once.",
            },
          ]
        : [],
  },
  {
    id: "WEB_AUTH_ENDPOINT_NO_SIGNING_KEY",
    severity: "warning",
    description: "WEB_AUTH_ENDPOINT should be accompanied by SIGNING_KEY.",
    check: ({ toml }) =>
      toml.WEB_AUTH_ENDPOINT && !toml.SIGNING_KEY
        ? [
            {
              rule: "WEB_AUTH_ENDPOINT_NO_SIGNING_KEY",
              severity: "warning",
              message: "WEB_AUTH_ENDPOINT is set but SIGNING_KEY is missing.",
              path: "SIGNING_KEY",
              hint: "Add the account public key used to sign web authentication challenges.",
            },
          ]
        : [],
  },
  {
    id: "WEB_AUTH_CONTRACT_ID_INVALID",
    severity: "error",
    description: "WEB_AUTH_CONTRACT_ID must be a valid contract address.",
    check: ({ toml }) =>
      toml.WEB_AUTH_CONTRACT_ID !== undefined &&
      !isValidContractId(toml.WEB_AUTH_CONTRACT_ID)
        ? [
            {
              rule: "WEB_AUTH_CONTRACT_ID_INVALID",
              severity: "error",
              message:
                "WEB_AUTH_CONTRACT_ID is not a valid C... contract address.",
              path: "WEB_AUTH_CONTRACT_ID",
              hint: "Use a 56-character, checksum-valid C... contract address.",
            },
          ]
        : [],
  },
];
