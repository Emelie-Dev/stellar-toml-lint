const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const ACCOUNT_VERSION = 48;
const CONTRACT_VERSION = 16;

function decodeBase32(value: string): number[] | undefined {
  let buffer = 0;
  let bits = 0;
  const output: number[] = [];

  for (const char of value) {
    const digit = ALPHABET.indexOf(char);
    if (digit < 0) return undefined;
    buffer = (buffer << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((buffer >> bits) & 0xff);
    }
  }

  if (bits > 0 && (buffer & ((1 << bits) - 1)) !== 0) return undefined;
  return output;
}

export function crc16Xmodem(bytes: number[]): number {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc;
}

function isValidStrkey(value: unknown, version?: number): value is string {
  if (typeof value !== "string" || value.length !== 56) return false;
  const decoded = decodeBase32(value);
  if (!decoded || decoded.length !== 35) return false;
  if (version !== undefined && decoded[0] !== version) return false;

  const payload = decoded.slice(0, 33);
  const expected = crc16Xmodem(payload);
  const actual = decoded[33] | (decoded[34] << 8);
  return expected === actual;
}

export function isValidPublicKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("G") &&
    isValidStrkey(value, ACCOUNT_VERSION)
  );
}

export function isValidContractId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("C") &&
    isValidStrkey(value, CONTRACT_VERSION)
  );
}
