import type { Rule } from "../types.js";

export const principalRules: Rule[] = [
  {
    id: "PRINCIPAL_FIELDS_MISSING",
    severity: "info",
    description: "Principal entries should include a name and email.",
    check: ({ toml }) =>
      Array.isArray(toml.PRINCIPALS)
        ? toml.PRINCIPALS.flatMap((item, index) => {
            if (
              typeof item !== "object" ||
              item === null ||
              Array.isArray(item)
            )
              return [];
            const principal = item as Record<string, unknown>;
            return !principal.name || !principal.email
              ? [
                  {
                    rule: "PRINCIPAL_FIELDS_MISSING",
                    severity: "info" as const,
                    message: "Principal is missing name or email.",
                    path: `PRINCIPALS[${index}]`,
                    hint: "Add both name and email fields.",
                  },
                ]
              : [];
          })
        : [],
  },
];
