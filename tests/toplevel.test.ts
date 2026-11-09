import { describe, expect, it } from "vitest";
import { lintToml } from "../src/lint.js";
import { topLevelRules } from "../src/rules/toplevel.js";

const run = (toml: Record<string, unknown>) =>
  topLevelRules.flatMap((rule) => rule.check({ toml, raw: "" }));
const validKey = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

describe("top-level rules", () => {
  it("accepts valid versions, URLs, keys, passphrases, and accounts", () => {
    expect(
      run({
        VERSION: "2.0.0",
        NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
        SIGNING_KEY: validKey,
        URI_REQUEST_SIGNING_KEY: validKey,
        ACCOUNTS: [validKey],
        WEB_AUTH_ENDPOINT: "https://example.org/auth",
      }),
    ).toEqual([]);
  });

  it("reports malformed versions, unknown networks, URLs, keys, accounts, and contract IDs", () => {
    const ids = run({
      VERSION: "latest",
      NETWORK_PASSPHRASE: "unknown",
      SIGNING_KEY: "bad",
      URI_REQUEST_SIGNING_KEY: "bad",
      ACCOUNTS: ["bad"],
      WEB_AUTH_ENDPOINT: "https://example.org",
      WEB_AUTH_CONTRACT_ID: "not-an-id",
      AUTH_SERVER: "ftp://example.org",
    }).map((item) => item.rule);
    expect(ids).toEqual(
      expect.arrayContaining([
        "VERSION_INVALID",
        "NETWORK_PASSPHRASE_UNKNOWN",
        "SIGNING_KEY_INVALID",
        "URI_REQUEST_SIGNING_KEY_INVALID",
        "ACCOUNTS_INVALID",
        "WEB_AUTH_CONTRACT_ID_INVALID",
        "URL_FIELD_INVALID",
      ]),
    );
  });

  it("reports malformed entries and duplicate accounts", () => {
    const issues = run({
      ACCOUNTS: [validKey, validKey],
      HORIZON_URL: "not-url",
    });
    expect(issues.map((item) => item.rule)).toContain("ACCOUNTS_DUPLICATE");
    expect(issues.map((item) => item.rule)).toContain("URL_FIELD_INVALID");
  });

  it("warns when web authentication has no signing key", () => {
    expect(
      run({ WEB_AUTH_ENDPOINT: "https://example.org/auth" }).map(
        (issue) => issue.rule,
      ),
    ).toContain("WEB_AUTH_ENDPOINT_NO_SIGNING_KEY");
  });

  it("allows localhost HTTP with a warning and checks each configured URL field", () => {
    const issues = run({
      FEDERATION_SERVER: "http://localhost/federation",
      SIGNING_KEY: validKey,
      AUTH_SERVER: "https://example.org",
      TRANSFER_SERVER: "https://example.org",
      TRANSFER_SERVER_SEP0024: "https://example.org",
      KYC_SERVER: "https://example.org",
      WEB_AUTH_ENDPOINT: "https://example.org",
      HORIZON_URL: "https://example.org",
      DIRECTORY_SERVER: "https://example.org",
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe("warning");
  });

  it("does not mislabel a valid TOML document", () => {
    expect(lintToml('VERSION = "2.0.0"').ok).toBe(true);
  });
});
