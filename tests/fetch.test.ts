import { describe, expect, it, vi } from "vitest";
import { lintDomain } from "../src/fetch.js";

const toml = 'VERSION = "2.0.0"';
const okResponse = (
  headers: Record<string, string> = {
    "access-control-allow-origin": "*",
    "content-type": "text/plain",
  },
) => new Response(toml, { status: 200, headers });

describe("lintDomain", () => {
  it("normalizes a full URL to HTTPS and fetches the well-known file", async () => {
    const fetcher = vi.fn(async () => okResponse());
    const result = await lintDomain("http://example.org/some/path", {
      fetch: fetcher,
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://example.org/.well-known/stellar.toml",
      expect.objectContaining({ redirect: "follow" }),
    );
    expect(result.ok).toBe(true);
    expect(result.url).toBe("https://example.org/.well-known/stellar.toml");
  });

  it("uses the global fetch implementation when no fetcher is injected", async () => {
    const fetcher = vi.fn(async () => okResponse());
    vi.stubGlobal("fetch", fetcher);
    try {
      expect((await lintDomain("example.org")).ok).toBe(true);
      expect(fetcher).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("accepts localhost IPv6 and uses custom rules", async () => {
    const fetcher = vi.fn(async () => okResponse());
    const result = await lintDomain("http://[::1]:8080/path", {
      fetch: fetcher,
      rules: [
        {
          id: "CUSTOM",
          severity: "info",
          description: "Test-only custom rule.",
          check: () => [
            { rule: "CUSTOM", severity: "info", message: "custom result" },
          ],
        },
      ],
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://[::1]/.well-known/stellar.toml",
      expect.any(Object),
    );
    expect(result.issues.map((item) => item.rule)).toEqual(["CUSTOM"]);
  });

  it("reports redirects and checks headers", async () => {
    const fetcher = vi.fn(async () => {
      const response = okResponse({
        "access-control-allow-origin": "https://other.example",
      });
      Object.defineProperty(response, "url", {
        value: "https://cdn.example/stellar.toml",
      });
      return response;
    });
    const result = await lintDomain("example.org", { fetch: fetcher });
    expect(result.issues.map((item) => item.rule)).toEqual([
      "FETCH_REDIRECT",
      "CORS_NOT_WILDCARD",
    ]);
  });

  it("turns non-200 responses into HTTP_STATUS issues", async () => {
    const result = await lintDomain("example.org", {
      fetch: vi.fn(async () => new Response("", { status: 404 })),
    });
    expect(result.issues[0]?.rule).toBe("HTTP_STATUS");
  });

  it("turns network failures into FETCH_FAILED issues", async () => {
    const result = await lintDomain("example.org", {
      fetch: vi.fn(async () => {
        throw new Error("offline");
      }),
    });
    expect(result.issues[0]?.rule).toBe("FETCH_FAILED");
  });

  it("handles non-Error fetch failures", async () => {
    const result = await lintDomain("example.org", {
      fetch: vi.fn(async () => {
        throw "offline";
      }),
    });
    expect(result.issues[0]?.message).toContain("offline");
  });

  it("turns aborts into FETCH_TIMEOUT issues", async () => {
    const fetcher: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        );
      });
    const result = await lintDomain("example.org", {
      fetch: fetcher,
      timeoutMs: 1,
    });
    expect(result.issues[0]?.rule).toBe("FETCH_TIMEOUT");
  });

  it("rejects invalid domains without calling fetch", async () => {
    const fetcher = vi.fn();
    const result = await lintDomain("not a hostname", { fetch: fetcher });
    expect(result.issues[0]?.rule).toBe("FETCH_FAILED");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects blank and malformed hostnames", async () => {
    for (const domain of ["", "-bad.example"]) {
      const result = await lintDomain(domain, { fetch: vi.fn() });
      expect(result.issues[0]?.rule).toBe("FETCH_FAILED");
    }
  });

  it("includes file size errors for an oversized body", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response("x".repeat(102401), {
          status: 200,
          headers: { "access-control-allow-origin": "*" },
        }),
    );
    const result = await lintDomain("example.org", { fetch: fetcher });
    expect(result.issues.map((item) => item.rule)).toContain("FILE_TOO_LARGE");
  });
});
