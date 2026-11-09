import { isValidPublicKey } from "../stellar-keys.js";
import type { Rule } from "../types.js";

function currencies(toml: Record<string, unknown>): Record<string, unknown>[] {
  return Array.isArray(toml.CURRENCIES)
    ? toml.CURRENCIES.filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null && !Array.isArray(item),
      )
    : [];
}

function validHttpsUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export const currencyRules: Rule[] = [
  {
    id: "CURRENCY_CODE_INVALID",
    severity: "error",
    description: "Currency code must be 1-12 alphanumeric characters.",
    check: ({ toml }) =>
      currencies(toml).flatMap((currency, index) =>
        typeof currency.code !== "string" ||
        !/^[A-Za-z0-9]{1,12}$/.test(currency.code)
          ? [
              {
                rule: "CURRENCY_CODE_INVALID",
                severity: "error" as const,
                message: "Currency code must be 1-12 alphanumeric characters.",
                path: `CURRENCIES[${index}].code`,
                hint: "Use a code containing 1-12 letters or digits.",
              },
            ]
          : [],
      ),
  },
  {
    id: "CURRENCY_ISSUER_INVALID",
    severity: "error",
    description: "A present issuer must be a valid Stellar public key.",
    check: ({ toml }) =>
      currencies(toml).flatMap((currency, index) =>
        currency.issuer !== undefined && !isValidPublicKey(currency.issuer)
          ? [
              {
                rule: "CURRENCY_ISSUER_INVALID",
                severity: "error" as const,
                message: "Currency issuer is not a valid Stellar public key.",
                path: `CURRENCIES[${index}].issuer`,
                hint: "Use a valid G... Stellar public key.",
              },
            ]
          : [],
      ),
  },
  {
    id: "CURRENCY_ISSUER_MISSING",
    severity: "warning",
    description: "Non-native currencies should specify an issuer.",
    check: ({ toml }) =>
      currencies(toml).flatMap((currency, index) =>
        currency.code !== "XLM" && !currency.issuer
          ? [
              {
                rule: "CURRENCY_ISSUER_MISSING",
                severity: "warning" as const,
                message: "Non-native currency has no issuer.",
                path: `CURRENCIES[${index}].issuer`,
                hint: "Add the issuer account's public key.",
              },
            ]
          : [],
      ),
  },
  {
    id: "CURRENCY_DECIMALS_INVALID",
    severity: "warning",
    description: "display_decimals should be an integer from 0 to 7.",
    check: ({ toml }) =>
      currencies(toml).flatMap((currency, index) =>
        currency.display_decimals !== undefined &&
        (!Number.isInteger(currency.display_decimals) ||
          Number(currency.display_decimals) < 0 ||
          Number(currency.display_decimals) > 7)
          ? [
              {
                rule: "CURRENCY_DECIMALS_INVALID",
                severity: "warning" as const,
                message: "display_decimals must be an integer from 0 to 7.",
                path: `CURRENCIES[${index}].display_decimals`,
                hint: "Set display_decimals to an integer from 0 to 7.",
              },
            ]
          : [],
      ),
  },
  {
    id: "CURRENCY_STATUS_INVALID",
    severity: "warning",
    description: "Currency status should be live, dead, test, or private.",
    check: ({ toml }) =>
      currencies(toml).flatMap((currency, index) =>
        currency.status !== undefined &&
        !["live", "dead", "test", "private"].includes(String(currency.status))
          ? [
              {
                rule: "CURRENCY_STATUS_INVALID",
                severity: "warning" as const,
                message: "Currency status is not recognized.",
                path: `CURRENCIES[${index}].status`,
                hint: "Use live, dead, test, or private.",
              },
            ]
          : [],
      ),
  },
  {
    id: "CURRENCY_IMAGE_URL_INVALID",
    severity: "warning",
    description: "Currency image should have an HTTPS URL.",
    check: ({ toml }) =>
      currencies(toml).flatMap((currency, index) =>
        currency.image !== undefined && !validHttpsUrl(currency.image)
          ? [
              {
                rule: "CURRENCY_IMAGE_URL_INVALID",
                severity: "warning" as const,
                message: "Currency image is not a valid HTTPS URL.",
                path: `CURRENCIES[${index}].image`,
                hint: "Provide an absolute HTTPS image URL.",
              },
            ]
          : [],
      ),
  },
  {
    id: "CURRENCY_DUPLICATE",
    severity: "warning",
    description: "Currency code and issuer pairs should be unique.",
    check: ({ toml }) => {
      const seen = new Set<string>();
      return currencies(toml).flatMap((currency, index) => {
        const key = `${String(currency.code)}\u0000${String(currency.issuer ?? "")}`;
        if (seen.has(key))
          return [
            {
              rule: "CURRENCY_DUPLICATE",
              severity: "warning" as const,
              message: "Duplicate currency code and issuer.",
              path: `CURRENCIES[${index}]`,
              hint: "Remove the duplicate currency entry.",
            },
          ];
        seen.add(key);
        return [];
      });
    },
  },
  {
    id: "CURRENCY_FIELDS_MISSING",
    severity: "info",
    description: "Currency entries should include a name or description.",
    check: ({ toml }) =>
      currencies(toml).flatMap((currency, index) =>
        !currency.desc && !currency.name
          ? [
              {
                rule: "CURRENCY_FIELDS_MISSING",
                severity: "info" as const,
                message: "Currency has neither desc nor name.",
                path: `CURRENCIES[${index}]`,
                hint: "Add a short name or description.",
              },
            ]
          : [],
      ),
  },
];
