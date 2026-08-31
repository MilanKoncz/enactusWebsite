export type CollectedString = { path: string; value: string };

/**
 * Walks a message catalog (or any nested string/array/object tree) and
 * collects every leaf string with its dotted/indexed path. Shared by
 * tests/unit/messages/dashes.test.ts (dash-drift check) and
 * tests/unit/messages/parity.test.ts (de/en key-parity check) — both need
 * the same "every string, wherever it lives" traversal, just filtering the
 * result differently.
 */
export function collectStrings(value: unknown, path: string, out: CollectedString[]): void {
  if (typeof value === "string") {
    out.push({ path, value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStrings(item, `${path}[${index}]`, out));
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      collectStrings(child, path ? `${path}.${key}` : key, out);
    }
  }
}
