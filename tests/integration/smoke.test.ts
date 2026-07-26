import { describe, expect, it } from "vitest";

describe("integration test setup", () => {
  it("runs in a Node-capable Vitest environment", async () => {
    const response = new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
    const body = await response.json();
    expect(body).toEqual({ ok: true });
  });
});
