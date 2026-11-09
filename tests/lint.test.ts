import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { lintToml, parseIssue } from "../src/lint.js";

const fixture = (name: string) =>
  readFile(resolve("tests/fixtures", name), "utf8");

describe("lintToml", () => {
  it("parses a valid fixture and returns parsed data", async () => {
    const result = lintToml(await fixture("valid.toml"));
    expect(result.ok).toBe(true);
    expect(result.parsed?.VERSION).toBe("2.0.0");
  });

  it("returns a parse error with a source location when TOML is invalid", async () => {
    const result = lintToml(await fixture("invalid-syntax.toml"));
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.rule).toBe("TOML_PARSE_ERROR");
    expect(result.issues[0]?.message).toContain("line 1, column");
  });

  it("returns a parse error for invalid table syntax", () => {
    const result = lintToml("a\nb", { rules: [] });
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.rule).toBe("TOML_PARSE_ERROR");
  });

  it("uses parser-provided line and column metadata", () => {
    const error = Object.assign(new Error("invalid syntax"), {
      line: 2,
      column: 3,
    });
    expect(parseIssue("first\nsecond", error).message).toContain(
      "line 2, column 3",
    );
  });

  it("derives a location from a parser position", () => {
    const result = parseIssue("first\nsecond", { position: 7 });
    expect(result.message).toContain("line 2, column 2");
  });

  it("parses line and column from a parser message", () => {
    expect(parseIssue("", new Error("failed at 3:4")).message).toContain(
      "line 3, column 4",
    );
  });

  it("handles non-Error parser failures without location metadata", () => {
    expect(parseIssue("", "bad input").message).toContain("bad input");
  });

  it("supports caller-provided rules", () => {
    const result = lintToml('VERSION = "2.0.0"', {
      rules: [
        {
          id: "CUSTOM",
          severity: "warning",
          description: "test",
          check: () => [
            { rule: "CUSTOM", severity: "warning", message: "custom issue" },
          ],
        },
      ],
    });
    expect(result.issues.map((item) => item.rule)).toEqual(["CUSTOM"]);
  });
});
