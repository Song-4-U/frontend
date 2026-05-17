import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Home from "@/app/page";

vi.mock("@/components/RecorderPanel", () => ({
  RecorderPanel: () => (
    <div data-testid="mock-recorder-panel">RECORDER_PANEL_MOCK</div>
  ),
}));

describe("Home page", () => {
  it("renders the hero heading", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1 }),
    ).toHaveTextContent("당신의 목소리와 닮은");
    expect(
      screen.getByRole("heading", { level: 1 }),
    ).toHaveTextContent("노래를 찾아드릴게요");
  });

  it("renders the beta badge", () => {
    render(<Home />);
    expect(
      screen.getByText(/Beta · Phase 2 — 녹음 & 업로드/),
    ).toBeInTheDocument();
  });

  it("renders the hero description copy", () => {
    render(<Home />);
    expect(
      screen.getByText(/잠시 노래를 흥얼거려 보세요\./),
    ).toBeInTheDocument();
  });

  it("mounts the RecorderPanel domain component", () => {
    render(<Home />);
    expect(screen.getByTestId("mock-recorder-panel")).toBeInTheDocument();
  });

  it("renders the phase-2 follow-up notice", () => {
    render(<Home />);
    expect(
      screen.getByText(/Phase 2 후속 섹션에서 활성화됩니다/),
    ).toBeInTheDocument();
  });
});
