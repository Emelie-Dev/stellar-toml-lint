import type { Rule } from "../types.js";

export const responseRules: Rule[] = [
  {
    id: "CORS_MISSING",
    severity: "error",
    description: "The response must include Access-Control-Allow-Origin.",
    check: ({ response }) =>
      response && !("access-control-allow-origin" in response.headers)
        ? [
            {
              rule: "CORS_MISSING",
              severity: "error",
              message: "Missing Access-Control-Allow-Origin response header.",
              hint: "Allow cross-origin reads by setting Access-Control-Allow-Origin: *.",
            },
          ]
        : [],
  },
  {
    id: "CORS_NOT_WILDCARD",
    severity: "warning",
    description: "The CORS origin is present but is not a wildcard.",
    check: ({ response }) => {
      const value = response?.headers["access-control-allow-origin"];
      return value !== undefined && value !== "*"
        ? [
            {
              rule: "CORS_NOT_WILDCARD",
              severity: "warning",
              message: "Access-Control-Allow-Origin is not '*'.",
              hint: "Use Access-Control-Allow-Origin: * for broad client compatibility.",
            },
          ]
        : [];
    },
  },
  {
    id: "FILE_TOO_LARGE",
    severity: "error",
    description: "The stellar.toml response must not exceed 100 KB.",
    check: ({ response }) =>
      response && response.sizeBytes > 100 * 1024
        ? [
            {
              rule: "FILE_TOO_LARGE",
              severity: "error",
              message: `Response is ${response.sizeBytes} bytes; the limit is 102400 bytes.`,
              hint: "Reduce the stellar.toml response to 100 KB or less.",
            },
          ]
        : [],
  },
  {
    id: "CONTENT_TYPE_UNEXPECTED",
    severity: "info",
    description: "The response content type should be text/plain.",
    check: ({ response }) => {
      const value = response?.headers["content-type"]?.toLowerCase();
      return response && (!value || !value.startsWith("text/plain"))
        ? [
            {
              rule: "CONTENT_TYPE_UNEXPECTED",
              severity: "info",
              message: value
                ? `Unexpected content type: ${value}.`
                : "Response is missing a content type.",
              hint: "Serve the file with a text/plain content type.",
            },
          ]
        : [];
    },
  },
];
