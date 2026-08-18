import { describe, expect, it } from "vitest";
import { csvCell, csvDocument, csvRow, UTF8_BOM } from "@/lib/csv";

describe("csvCell", () => {
  it("leaves a plain value untouched", () => {
    expect(csvCell("Jane Doe")).toBe("Jane Doe");
  });

  it("quotes a value containing a comma", () => {
    expect(csvCell("Doe, Jane")).toBe('"Doe, Jane"');
  });

  it("quotes and doubles an embedded quote", () => {
    expect(csvCell('Jane "JD" Doe')).toBe('"Jane ""JD"" Doe"');
  });

  it("quotes a value containing a newline", () => {
    expect(csvCell("line one\nline two")).toBe('"line one\nline two"');
  });
});

describe("csvRow", () => {
  it("joins cells with commas and terminates with CRLF", () => {
    expect(csvRow(["a", "b"])).toBe("a,b\r\n");
  });
});

describe("csvDocument", () => {
  it("starts with the UTF-8 BOM Excel needs for umlauts", () => {
    const document = csvDocument(["Name"], [["Jäne Döe"]]);
    expect(document.startsWith(UTF8_BOM)).toBe(true);
    expect(UTF8_BOM.charCodeAt(0)).toBe(0xfeff);
  });

  it("writes the header row followed by one row per record", () => {
    const document = csvDocument(["Name", "E-Mail"], [
      ["Jane", "jane@example.com"],
      ["Max", "max@example.com"],
    ]);
    expect(document).toBe(`${UTF8_BOM}Name,E-Mail\r\nJane,jane@example.com\r\nMax,max@example.com\r\n`);
  });

  it("writes only the header row for no records", () => {
    expect(csvDocument(["Name"], [])).toBe(`${UTF8_BOM}Name\r\n`);
  });
});
