import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { UploadProgress } from "@/components/UploadProgress";

describe("UploadProgress", () => {
  it("renders with default label", () => {
    render(<UploadProgress progress={50} />);
    expect(screen.getByText("업로드 중")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("renders with a custom label", () => {
    render(<UploadProgress progress={25} label="업로드 준비 중" />);
    expect(screen.getByText("업로드 준비 중")).toBeInTheDocument();
  });

  it("clamps progress below 0 to 0", () => {
    render(<UploadProgress progress={-20} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });

  it("clamps progress above 100 to 100", () => {
    render(<UploadProgress progress={150} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });

  it("rounds fractional progress", () => {
    render(<UploadProgress progress={42.7} />);
    expect(screen.getByText("43%")).toBeInTheDocument();
  });

  it("uses emerald color and shows check icon when done", () => {
    const { container } = render(
      <UploadProgress progress={100} done label="업로드 완료" />,
    );
    expect(screen.getByText("업로드 완료")).toBeInTheDocument();
    const fill = container.querySelector('[style*="width: 100%"]');
    expect(fill).not.toBeNull();
    expect(fill).toHaveClass("bg-emerald-500");
  });

  it("uses brand color when not done", () => {
    const { container } = render(<UploadProgress progress={50} />);
    const fill = container.querySelector('[style*="width: 50%"]');
    expect(fill).toHaveClass("bg-brand-600");
  });

  it("applies the className prop on the root", () => {
    const { container } = render(
      <UploadProgress progress={50} className="custom-class" />,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("exposes correct ARIA attributes on the progressbar", () => {
    render(<UploadProgress progress={75} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "75");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("attaches aria-label tied to the visible label", () => {
    render(<UploadProgress progress={30} label="S3 업로드 중" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-label",
      "S3 업로드 중",
    );
  });

  it("declares an aria-live status region", () => {
    render(<UploadProgress progress={10} />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("coerces NaN progress to 0", () => {
    render(<UploadProgress progress={Number.NaN} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });

  it("coerces Infinity progress to 100", () => {
    render(<UploadProgress progress={Number.POSITIVE_INFINITY} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
