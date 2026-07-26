import type { AssertionsResult } from "jest-axe";

declare module "vitest" {
  interface Assertion {
    toHaveNoViolations(): AssertionsResult;
  }
}
