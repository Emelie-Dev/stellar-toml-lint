import { parse } from "smol-toml";
import { defaultRules } from "./rules/index.js";
import type { LintIssue, LintResult, Rule, RuleContext } from "./types.js";

export function parseIssue(raw: string, error: unknown): LintIssue {
  const message = error instanceof Error ? error.message : String(error);
  const lineColumn = message.match(
    /(?:line|at)\s+(\d+)(?:[:,]\s*(?:column\s*)?(\d+))?/i,
  );
  const position =
    typeof error === "object" && error !== null && "position" in error
      ? Number(error.position)
      : undefined;
  const parserLine =
    typeof error === "object" &&
    error !== null &&
    "line" in error &&
    typeof error.line === "number"
      ? error.line
      : undefined;
  const parserColumn =
    typeof error === "object" &&
    error !== null &&
    "column" in error &&
    typeof error.column === "number"
      ? error.column
      : undefined;
  const before =
    position !== undefined && Number.isFinite(position)
      ? raw.slice(0, position)
      : undefined;
  const line = lineColumn?.[1]
    ? Number(lineColumn[1])
    : parserLine
      ? parserLine
      : before === undefined
        ? undefined
        : before.split("\n").length;
  const column = lineColumn?.[2]
    ? Number(lineColumn[2])
    : parserColumn
      ? parserColumn
      : before === undefined
        ? undefined
        : before.length - before.lastIndexOf("\n");
  const location = line
    ? ` at line ${line}${column ? `, column ${column}` : ""}`
    : "";
  return {
    rule: "TOML_PARSE_ERROR",
    severity: "error",
    message: `Unable to parse TOML${location}: ${message}`,
    hint: "Correct the TOML syntax and try again.",
  };
}

export function lintText(
  raw: string,
  rules: Rule[] = defaultRules,
  response?: RuleContext["response"],
): LintResult {
  let toml: Record<string, unknown>;
  try {
    const parsed: unknown = parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error("TOML document must have a table at its root.");
    }
    toml = parsed as Record<string, unknown>;
  } catch (error) {
    const context: RuleContext = { toml: {}, raw, response };
    const responseIssues = response
      ? rules
          .filter(
            (rule) =>
              rule.id.startsWith("CORS_") ||
              rule.id === "FILE_TOO_LARGE" ||
              rule.id === "CONTENT_TYPE_UNEXPECTED",
          )
          .flatMap((rule) => rule.check(context))
      : [];
    return { ok: false, issues: [parseIssue(raw, error), ...responseIssues] };
  }

  const context: RuleContext = { toml, raw, response };
  const issues = rules.flatMap((rule) => rule.check(context));
  return {
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    parsed: toml,
  };
}

export function lintToml(
  raw: string,
  opts: { rules?: Rule[] } = {},
): LintResult {
  return lintText(raw, opts.rules ?? defaultRules);
}
