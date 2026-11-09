import { lintText } from "./lint.js";
import { defaultRules } from "./rules/index.js";
import type { LintIssue, LintResult, Rule } from "./types.js";

export interface FetchOptions {
  timeoutMs?: number;
  fetch?: typeof fetch;
  rules?: Rule[];
}

function normalizeDomain(
  domain: string,
): { hostname: string; url: string } | undefined {
  const trimmed = domain.trim();
  if (!trimmed) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(
      /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
  } catch {
    return undefined;
  }
  const hostname = parsed.hostname.toLowerCase();
  if (
    !hostname ||
    (!/^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?)(?:\.(?:[a-z\d](?:[a-z\d-]*[a-z\d])?))*$/.test(
      hostname,
    ) &&
      hostname !== "[::1]")
  ) {
    return undefined;
  }
  const url = `https://${hostname}/.well-known/stellar.toml`;
  return { hostname, url };
}

function issue(
  rule: string,
  severity: LintIssue["severity"],
  message: string,
  hint: string,
): LintIssue {
  return { rule, severity, message, hint };
}

export async function lintDomain(
  domain: string,
  opts: FetchOptions = {},
): Promise<LintResult> {
  const normalized = normalizeDomain(domain);
  if (!normalized) {
    return {
      domain,
      ok: false,
      issues: [
        issue(
          "FETCH_FAILED",
          "error",
          "The supplied domain is empty or invalid.",
          "Provide a valid hostname, optionally as a full URL.",
        ),
      ],
    };
  }

  const timeoutMs = opts.timeoutMs ?? 10_000;
  const fetcher = opts.fetch ?? globalThis.fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetcher(normalized.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
    });
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    if (response.status !== 200) {
      return {
        domain: normalized.hostname,
        url: normalized.url,
        ok: false,
        issues: [
          issue(
            "HTTP_STATUS",
            "error",
            `The server returned HTTP ${response.status}.`,
            "Serve the stellar.toml at the requested URL with HTTP 200.",
          ),
        ],
      };
    }

    const raw = await response.text();
    const finalUrl = response.url || normalized.url;
    const result = lintText(raw, opts.rules ?? defaultRules, {
      status: response.status,
      headers,
      url: finalUrl,
      sizeBytes: new TextEncoder().encode(raw).byteLength,
    });
    result.domain = normalized.hostname;
    result.url = normalized.url;
    if (finalUrl !== normalized.url) {
      result.issues.unshift(
        issue(
          "FETCH_REDIRECT",
          "warning",
          `The stellar.toml request redirected to ${finalUrl}.`,
          "Serve the file directly from the requested well-known URL when possible.",
        ),
      );
    }
    return result;
  } catch (error) {
    const timedOut =
      controller.signal.aborted ||
      (error instanceof Error && error.name === "AbortError");
    return {
      domain: normalized.hostname,
      url: normalized.url,
      ok: false,
      issues: [
        issue(
          timedOut ? "FETCH_TIMEOUT" : "FETCH_FAILED",
          "error",
          timedOut
            ? `Fetching stellar.toml timed out after ${timeoutMs} ms.`
            : `Failed to fetch stellar.toml: ${error instanceof Error ? error.message : String(error)}`,
          timedOut
            ? "Increase the timeout or make the server respond faster."
            : "Check the hostname, HTTPS configuration, and server availability.",
        ),
      ],
    };
  } finally {
    clearTimeout(timeout);
  }
}
