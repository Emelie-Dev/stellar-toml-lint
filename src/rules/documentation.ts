import type { Rule } from "../types.js";

function entries(toml: Record<string, unknown>): Record<string, unknown>[] {
  const value = toml.DOCUMENTATION;
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? [value as Record<string, unknown>]
    : [];
}

export const documentationRules: Rule[] = [
  {
    id: "ORG_NAME_MISSING",
    severity: "warning",
    description: "DOCUMENTATION should include ORG_NAME.",
    check: ({ toml }) =>
      entries(toml).flatMap((doc) =>
        !doc.ORG_NAME
          ? [
              {
                rule: "ORG_NAME_MISSING",
                severity: "warning" as const,
                message: "DOCUMENTATION.ORG_NAME is missing.",
                path: "DOCUMENTATION.ORG_NAME",
                hint: "Add your organization's name.",
              },
            ]
          : [],
      ),
  },
  {
    id: "ORG_URL_INVALID",
    severity: "error",
    description: "ORG_URL, when present, must be a valid HTTPS URL.",
    check: ({ toml }) =>
      entries(toml).flatMap((doc) => {
        if (doc.ORG_URL === undefined) return [];
        try {
          if (new URL(String(doc.ORG_URL)).protocol === "https:") return [];
        } catch {
          /* Invalid URL is reported below. */
        }
        return [
          {
            rule: "ORG_URL_INVALID",
            severity: "error" as const,
            message: "DOCUMENTATION.ORG_URL must be a valid HTTPS URL.",
            path: "DOCUMENTATION.ORG_URL",
            hint: "Provide an absolute HTTPS URL.",
          },
        ];
      }),
  },
  {
    id: "ORG_LOGO_INVALID",
    severity: "warning",
    description: "ORG_LOGO should be a valid HTTPS URL.",
    check: ({ toml }) =>
      entries(toml).flatMap((doc) => {
        if (doc.ORG_LOGO === undefined) return [];
        try {
          if (new URL(String(doc.ORG_LOGO)).protocol === "https:") return [];
        } catch {
          /* Invalid URL is reported below. */
        }
        return [
          {
            rule: "ORG_LOGO_INVALID",
            severity: "warning" as const,
            message: "DOCUMENTATION.ORG_LOGO is not a valid HTTPS URL.",
            path: "DOCUMENTATION.ORG_LOGO",
            hint: "Provide an absolute HTTPS image URL.",
          },
        ];
      }),
  },
  {
    id: "ORG_SUPPORT_EMAIL_INVALID",
    severity: "warning",
    description: "ORG_SUPPORT_EMAIL should be a valid email address.",
    check: ({ toml }) =>
      entries(toml).flatMap((doc) =>
        doc.ORG_SUPPORT_EMAIL !== undefined &&
        (typeof doc.ORG_SUPPORT_EMAIL !== "string" ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doc.ORG_SUPPORT_EMAIL))
          ? [
              {
                rule: "ORG_SUPPORT_EMAIL_INVALID",
                severity: "warning" as const,
                message:
                  "DOCUMENTATION.ORG_SUPPORT_EMAIL is not a valid email address.",
                path: "DOCUMENTATION.ORG_SUPPORT_EMAIL",
                hint: "Provide an address such as support@example.org.",
              },
            ]
          : [],
      ),
  },
];
