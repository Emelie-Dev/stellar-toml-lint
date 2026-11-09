import { describe, expect, it } from "vitest";
import { principalRules } from "../src/rules/principals.js";

const run = (PRINCIPALS: unknown) =>
  principalRules.flatMap((rule) =>
    rule.check({ toml: { PRINCIPALS }, raw: "" }),
  );

describe("principal rules", () => {
  it("accepts a principal with name and email", () => {
    expect(run([{ name: "Example", email: "hello@example.org" }])).toEqual([]);
  });

  it("reports missing name or email but ignores non-tables", () => {
    expect(run([{}, { name: "Only name" }, "not a table"])).toHaveLength(2);
  });

  it("ignores a missing principals array", () => {
    expect(run(undefined)).toEqual([]);
  });
});
