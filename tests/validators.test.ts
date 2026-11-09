import { describe, expect, it } from "vitest";
import { validatorRules } from "../src/rules/validators.js";

const run = (VALIDATORS: unknown) =>
  validatorRules.flatMap((rule) =>
    rule.check({ toml: { VALIDATORS }, raw: "" }),
  );
const validKey = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

describe("validator rules", () => {
  it("accepts valid validator keys", () => {
    expect(run([{ PUBLIC_KEY: validKey }])).toEqual([]);
  });

  it("reports an invalid validator public key", () => {
    expect(run([{ PUBLIC_KEY: "invalid" }])[0]?.rule).toBe(
      "VALIDATOR_PUBLIC_KEY_INVALID",
    );
    expect(run([{}])[0]?.rule).toBe("VALIDATOR_PUBLIC_KEY_INVALID");
  });

  it("ignores absent arrays and non-table entries", () => {
    expect(run(undefined)).toEqual([]);
    expect(run(["not a table"])).toEqual([]);
  });
});
