import { isValidPublicKey } from "../stellar-keys.js";
import type { Rule } from "../types.js";

export const validatorRules: Rule[] = [
  {
    id: "VALIDATOR_PUBLIC_KEY_INVALID",
    severity: "error",
    description: "Validator entries must contain valid Stellar public keys.",
    check: ({ toml }) =>
      Array.isArray(toml.VALIDATORS)
        ? toml.VALIDATORS.flatMap((item, index) => {
            if (
              typeof item !== "object" ||
              item === null ||
              Array.isArray(item)
            )
              return [];
            const validator = item as Record<string, unknown>;
            return validator.PUBLIC_KEY === undefined ||
              !isValidPublicKey(validator.PUBLIC_KEY)
              ? [
                  {
                    rule: "VALIDATOR_PUBLIC_KEY_INVALID",
                    severity: "error" as const,
                    message:
                      "Validator PUBLIC_KEY is not a valid Stellar public key.",
                    path: `VALIDATORS[${index}].PUBLIC_KEY`,
                    hint: "Use a valid G... Stellar public key.",
                  },
                ]
              : [];
          })
        : [],
  },
];
