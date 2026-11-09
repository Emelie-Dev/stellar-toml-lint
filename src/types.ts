export type Severity = "error" | "warning" | "info";

export interface LintIssue {
  rule: string;
  severity: Severity;
  message: string;
  path?: string;
  hint?: string;
}

export interface LintResult {
  domain?: string;
  url?: string;
  ok: boolean;
  issues: LintIssue[];
  parsed?: Record<string, unknown>;
}

export interface RuleContext {
  toml: Record<string, unknown>;
  raw: string;
  response?: {
    status: number;
    headers: Record<string, string>;
    url: string;
    sizeBytes: number;
  };
}

export interface Rule {
  id: string;
  severity: Severity;
  description: string;
  check(ctx: RuleContext): LintIssue[];
}
