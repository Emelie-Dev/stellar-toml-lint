import { describe, expect, it } from "vitest";
import { lintText } from "../src/lint.js";
import { responseRules } from "../src/rules/response.js";

const run = (headers: Record<string, string>, sizeBytes = 1) =>
  responseRules.flatMap((rule) =>
    rule.check({
      toml: {},
      raw: "",
      response: {
        status: 200,
        headers,
        url: "https://example.org/.well-known/stellar.toml",
        sizeBytes,
      },
    }),
  );

describe("response rules", () => {
  it("reports missing CORS, large files, and unexpected content types", () => {
    const issues = run({ "content-type": "application/octet-stream" }, 102401);
    expect(issues.map((item) => item.rule)).toEqual([
      "CORS_MISSING",
      "FILE_TOO_LARGE",
      "CONTENT_TYPE_UNEXPECTED",
    ]);
  });

  it("accepts wildcard CORS and text/plain", () => {
    expect(
      run({
        "access-control-allow-origin": "*",
        "content-type": "text/plain; charset=utf-8",
      }),
    ).toEqual([]);
  });

  it("warns for non-wildcard CORS", () => {
    expect(
      run({
        "access-control-allow-origin": "https://example.org",
        "content-type": "text/plain",
      }).map((item) => item.rule),
    ).toEqual(["CORS_NOT_WILDCARD"]);
  });

  it("warns for an empty CORS value and missing content type", () => {
    expect(
      run({ "access-control-allow-origin": "" }).map((item) => item.rule),
    ).toEqual(["CORS_NOT_WILDCARD", "CONTENT_TYPE_UNEXPECTED"]);
  });

  it("does not apply response checks to pure TOML linting", () => {
    expect(lintText('VERSION = "2.0.0"').issues).toEqual([]);
  });
});
