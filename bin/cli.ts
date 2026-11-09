#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { isatty } from "node:tty";
import { lintDomain, lintToml } from "../src/index.js";
import type { LintIssue, LintResult, Severity } from "../src/types.js";

interface CliOptions {
  domain?: string;
  file?: string;
  format: "text" | "json" | "github";
  ignore: Set<string>;
  strict: boolean;
  timeoutMs?: number;
}

const usage = `Usage: stellar-toml-lint <domain>
       stellar-toml-lint --file <path>

Options:
  --json                    Machine-readable JSON output
  --format <text|json|github>
  --ignore <ruleId,...>     Ignore listed rule IDs
  --strict                  Treat warnings as errors for exit code
  --timeout <ms>            Fetch timeout in milliseconds`;

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    format: "text",
    ignore: new Set(),
    strict: false,
  };
  const positional: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") options.format = "json";
    else if (arg === "--strict") options.strict = true;
    else if (
      arg === "--file" ||
      arg === "--format" ||
      arg === "--ignore" ||
      arg === "--timeout"
    ) {
      const value = args[index + 1];
      if (!value || value.startsWith("--"))
        throw new Error(`Missing value for ${arg}.`);
      index += 1;
      if (arg === "--file") options.file = value;
      if (arg === "--format") {
        if (!["text", "json", "github"].includes(value))
          throw new Error(`Unknown format: ${value}.`);
        options.format = value as CliOptions["format"];
      }
      if (arg === "--ignore")
        value
          .split(",")
          .filter(Boolean)
          .forEach((rule) => options.ignore.add(rule.trim()));
      if (arg === "--timeout") {
        const timeout = Number(value);
        if (!Number.isInteger(timeout) || timeout < 1)
          throw new Error("--timeout must be a positive integer.");
        options.timeoutMs = timeout;
      }
    } else if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}.`);
    else positional.push(arg);
  }

  if (options.file && positional.length)
    throw new Error("Provide either a domain or --file, not both.");
  if (options.file && !args.includes("--file"))
    throw new Error("--file requires a path.");
  if (!options.file && positional.length !== 1)
    throw new Error("Provide exactly one domain or --file path.");
  if (options.file && options.timeoutMs !== undefined)
    throw new Error("--timeout is only valid when fetching a domain.");
  options.domain = positional[0];
  return options;
}

function color(
  severity: Severity,
  enabled: boolean,
): (value: string) => string {
  const code =
    severity === "error" ? "31" : severity === "warning" ? "33" : "36";
  return (value) => (enabled ? `\u001b[${code}m${value}\u001b[0m` : value);
}

function filtered(result: LintResult, ignore: Set<string>): LintResult {
  const issues = result.issues.filter((entry) => !ignore.has(entry.rule));
  return {
    ...result,
    issues,
    ok: !issues.some((entry) => entry.severity === "error"),
  };
}

function outputText(result: LintResult): void {
  const enabled = isatty(1) && !process.env.NO_COLOR;
  if (result.issues.length === 0) {
    console.log("No issues found.");
    return;
  }
  for (const severity of ["error", "warning", "info"] as const) {
    const issues = result.issues.filter((entry) => entry.severity === severity);
    if (!issues.length) continue;
    console.log(
      color(severity, enabled)(`${severity.toUpperCase()} (${issues.length})`),
    );
    for (const entry of issues) {
      console.log(
        `  ${entry.rule}${entry.path ? ` [${entry.path}]` : ""}: ${entry.message}`,
      );
      if (entry.hint) console.log(`    Fix: ${entry.hint}`);
    }
  }
}

function outputGithub(issues: LintIssue[]): void {
  for (const entry of issues) {
    const level =
      entry.severity === "error"
        ? "error"
        : entry.severity === "warning"
          ? "warning"
          : "notice";
    const title = entry.rule.replace(/[\r\n,]/g, " ");
    const message = entry.message.replace(/\r/g, "").replace(/\n/g, "%0A");
    const file = entry.path ? `file=${entry.path},` : "";
    console.log(`::${level} ${file}title=${title}::${message}`);
  }
}

async function main(): Promise<void> {
  try {
    const options = parseArgs(process.argv.slice(2));
    let result: LintResult;
    if (options.file) {
      const raw = await readFile(options.file, "utf8");
      result = lintToml(raw);
    } else {
      result = await lintDomain(options.domain!, {
        timeoutMs: options.timeoutMs,
      });
    }
    result = filtered(result, options.ignore);
    if (options.format === "json") console.log(JSON.stringify(result, null, 2));
    else if (options.format === "github") outputGithub(result.issues);
    else outputText(result);
    process.exitCode =
      !result.ok ||
      (options.strict &&
        result.issues.some((entry) => entry.severity === "warning"))
        ? 1
        : 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(usage);
    process.exitCode = 2;
  }
}

void main();
