import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  HeaderSurfaceProvider,
  useHeaderSurface,
} from "@/components/layout/HeaderSurface";

function Probe() {
  const { overlaid, setOverlaid } = useHeaderSurface();
  return (
    <>
      <p>{overlaid ? "overlaid" : "solid"}</p>
      <button type="button" onClick={() => setOverlaid(!overlaid)}>
        Toggle
      </button>
    </>
  );
}

describe("HeaderSurface", () => {
  it("defaults to solid when read without a provider", () => {
    render(<Probe />);
    expect(screen.getByText("solid")).toBeInTheDocument();
  });

  it("starts solid inside a provider", () => {
    render(
      <HeaderSurfaceProvider>
        <Probe />
      </HeaderSurfaceProvider>,
    );
    expect(screen.getByText("solid")).toBeInTheDocument();
  });

  it("shares updated state between all consumers inside the same provider", async () => {
    const user = userEvent.setup();
    render(
      <HeaderSurfaceProvider>
        <Probe />
        <Probe />
      </HeaderSurfaceProvider>,
    );
    await user.click(screen.getAllByRole("button", { name: "Toggle" })[0]);
    expect(screen.getAllByText("overlaid")).toHaveLength(2);
  });

  it("has no effect on state outside its own provider (the default setter is a no-op)", async () => {
    const user = userEvent.setup();
    render(<Probe />);
    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByText("solid")).toBeInTheDocument();
  });
});
