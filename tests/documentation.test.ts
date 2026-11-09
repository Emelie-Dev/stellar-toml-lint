import { describe, expect, it } from "vitest";
import { documentationRules } from "../src/rules/documentation.js";

const run = (DOCUMENTATION: unknown) =>
  documentationRules.flatMap((rule) =>
    rule.check({ toml: { DOCUMENTATION }, raw: "" }),
  );

describe("documentation rules", () => {
  it("accepts valid documentation details", () => {
    expect(
      run({
        ORG_NAME: "Example",
        ORG_URL: "https://example.org",
        ORG_LOGO: "https://example.org/logo.png",
        ORG_SUPPORT_EMAIL: "help@example.org",
      }),
    ).toEqual([]);
  });

  it("reports missing organization name and invalid URL, logo, and email", () => {
    expect(
      run({
        ORG_URL: "http://example.org",
        ORG_LOGO: "bad",
        ORG_SUPPORT_EMAIL: "bad",
      }).map((item) => item.rule),
    ).toEqual([
      "ORG_NAME_MISSING",
      "ORG_URL_INVALID",
      "ORG_LOGO_INVALID",
      "ORG_SUPPORT_EMAIL_INVALID",
    ]);
  });

  it("ignores a missing documentation table", () => {
    expect(run(undefined)).toEqual([]);
  });
});
