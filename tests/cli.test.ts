import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function run(...args: string[]) {
  return spawnSync(
    process.execPath,
    ["--import", "tsx", "bin/cli.ts", ...args],
    { encoding: "utf8", cwd: process.cwd() },
  );
}

const fixture = (name: string) => resolve("tests/fixtures", name);

describe("CLI", () => {
  it("returns success for a valid local file", () => {
    expect(run("--file", fixture("valid.toml")).status).toBe(0);
  });

  it("prints machine-readable JSON", () => {
    const result = run("--file", fixture("valid.toml"), "--json");
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).ok).toBe(true);
  });

  it("returns 1 for errors and can ignore selected rules", () => {
    expect(run("--file", fixture("invalid-rules.toml")).status).toBe(1);
    expect(
      run(
        "--file",
        fixture("invalid-rules.toml"),
        "--ignore",
        "SIGNING_KEY_INVALID,CURRENCY_CODE_INVALID",
      ).status,
    ).toBe(1);
    expect(
      run(
        "--file",
        fixture("invalid-rules.toml"),
        "--ignore",
        "SIGNING_KEY_INVALID,CURRENCY_CODE_INVALID,URL_FIELD_INVALID,ORG_URL_INVALID,VALIDATOR_PUBLIC_KEY_INVALID,CURRENCY_ISSUER_MISSING,CURRENCY_DECIMALS_INVALID,CURRENCY_STATUS_INVALID,CURRENCY_IMAGE_URL_INVALID,CURRENCY_FIELDS_MISSING,ORG_NAME_MISSING,ORG_SUPPORT_EMAIL_INVALID,WEB_AUTH_ENDPOINT_NO_SIGNING_KEY",
      ).status,
    ).toBe(0);
  });

  it("uses strict mode to fail warnings", () => {
    expect(run("--file", fixture("minimal.toml"), "--strict").status).toBe(0);
    const warning = resolve("tests/fixtures/warning-only.toml");
    expect(run("--file", warning, "--strict").status).toBe(1);
  });

  it("prints GitHub workflow annotations", () => {
    const result = run(
      "--file",
      fixture("invalid-rules.toml"),
      "--format",
      "github",
    );
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("::error ");
  });

  it("returns usage code 2 for invalid arguments", () => {
    expect(run("--unknown").status).toBe(2);
    expect(run().status).toBe(2);
  });
});
