import { afterEach, describe, expect, it, vi } from "vitest";
import { postJson } from "@/lib/submitForm";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("postJson", () => {
  it("returns ok:true on a successful response, ignoring its body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    expect(await postJson("/api/example", { a: 1 })).toEqual({ ok: true });
  });

  it("surfaces the response body's error code on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: false, error: "window_closed" }), { status: 409 })),
    );
    expect(await postJson("/api/example", {})).toEqual({ ok: false, error: "window_closed" });
  });

  it("returns ok:false with no error code when the response body isn't JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    expect(await postJson("/api/example", {})).toEqual({ ok: false, error: undefined });
  });

  it("returns ok:false with no error code on a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await postJson("/api/example", {})).toEqual({ ok: false });
  });
});
