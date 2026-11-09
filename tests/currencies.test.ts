import { describe, expect, it } from "vitest";
import { currencyRules } from "../src/rules/currencies.js";

const run = (CURRENCIES: unknown) =>
  currencyRules.flatMap((rule) =>
    rule.check({ toml: { CURRENCIES }, raw: "" }),
  );
const issuer = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

describe("currency rules", () => {
  it("accepts a complete native currency entry", () => {
    expect(
      run([
        {
          code: "XLM",
          name: "Lumens",
          display_decimals: 7,
          status: "live",
          image: "https://example.org/x.png",
        },
      ]),
    ).toEqual([]);
  });

  it("reports invalid fields, missing issuer and description, and duplicates", () => {
    const issues = run([
      {
        code: "INVALID-CODE",
        issuer: "bad",
        display_decimals: 9,
        status: "unknown",
        image: "http://example.org",
        name: "",
      },
      { code: "USD", desc: "Dollar" },
      { code: "USD", issuer, desc: "Duplicate" },
      { code: "USD", issuer, desc: "Duplicate" },
    ]);
    expect(issues.map((item) => item.rule)).toEqual(
      expect.arrayContaining([
        "CURRENCY_CODE_INVALID",
        "CURRENCY_ISSUER_INVALID",
        "CURRENCY_ISSUER_MISSING",
        "CURRENCY_DECIMALS_INVALID",
        "CURRENCY_STATUS_INVALID",
        "CURRENCY_IMAGE_URL_INVALID",
        "CURRENCY_FIELDS_MISSING",
        "CURRENCY_DUPLICATE",
      ]),
    );
  });

  it("ignores absent or non-table currencies for field checks", () => {
    expect(run(undefined)).toEqual([]);
    expect(run([null, "string", 3])).toEqual([]);
  });
});
