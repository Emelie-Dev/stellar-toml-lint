import { describe, expect, it } from "vitest";
import {
  crc16Xmodem,
  isValidContractId,
  isValidPublicKey,
} from "../src/stellar-keys.js";

const publicKey = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

describe("Stellar StrKey validation", () => {
  it("accepts a known checksum-valid Stellar public key", () => {
    expect(isValidPublicKey(publicKey)).toBe(true);
  });

  it("rejects a wrong checksum", () => {
    expect(isValidPublicKey(`${publicKey.slice(0, -1)}G`)).toBe(false);
  });

  it("rejects the wrong length", () => {
    expect(isValidPublicKey(publicKey.slice(0, -1))).toBe(false);
  });

  it("rejects lowercase values", () => {
    expect(isValidPublicKey(publicKey.toLowerCase())).toBe(false);
  });

  it("rejects a key with the wrong prefix", () => {
    expect(isValidPublicKey(`C${publicKey.slice(1)}`)).toBe(false);
  });

  it("validates contract-address formatting separately from account keys", () => {
    expect(isValidContractId(`C${publicKey.slice(1)}`)).toBe(false);
    expect(isValidContractId("C" + "A".repeat(55))).toBe(false);
    expect(
      isValidContractId(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
      ),
    ).toBe(true);
  });

  it("computes CRC16-XModem", () => {
    expect(crc16Xmodem(Array.from(new TextEncoder().encode("123456789")))).toBe(
      0x31c3,
    );
  });
});
