import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RecorderPanel } from "@/components/RecorderPanel";

vi.mock("@/hooks/use-recorder", () => ({
  useRecorder: vi.fn(),
}));

vi.mock("@/hooks/use-upload", () => ({
  useUpload: vi.fn(),
}));

const { useRecorder } = await import("@/hooks/use-recorder");
const { useUpload } = await import("@/hooks/use-upload");
const mockUseRecorder = vi.mocked(useRecorder);
const mockUseUpload = vi.mocked(useUpload);

type RecorderState = ReturnType<typeof useRecorder>;
type UploadState = ReturnType<typeof useUpload>;

function recorderStub(overrides: Partial<RecorderState> = {}): RecorderState {
  return {
    status: "idle",
    error: null,
    audioBlob: null,
    audioUrl: null,
    contentType: null,
    durationMs: 0,
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };
}

function uploadStub(overrides: Partial<UploadState> = {}): UploadState {
  return {
    status: "idle",
    progress: 0,
    s3Key: null,
    errorCode: null,
    errorMessage: null,
    upload: vi.fn().mockResolvedValue({ s3Key: "key" }),
    reset: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  mockUseRecorder.mockReset();
  mockUseUpload.mockReset();
});

describe("RecorderPanel", () => {
  it("renders the idle state with a record button", () => {
    mockUseRecorder.mockReturnValue(recorderStub());
    mockUseUpload.mockReturnValue(uploadStub());

    render(<RecorderPanel />);

    expect(
      screen.getByText("아래 버튼을 눌러 녹음을 시작하세요."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "녹음 시작" }),
    ).toBeInTheDocument();
  });

  it("clicking the record button starts recording and resets upload state", async () => {
    const recorder = recorderStub();
    const upload = uploadStub();
    mockUseRecorder.mockReturnValue(recorder);
    mockUseUpload.mockReturnValue(upload);

    const user = userEvent.setup();
    render(<RecorderPanel />);

    await user.click(screen.getByRole("button", { name: "녹음 시작" }));

    expect(upload.reset).toHaveBeenCalledOnce();
    expect(recorder.start).toHaveBeenCalledOnce();
  });

  it("shows the recording ticker and duration", () => {
    mockUseRecorder.mockReturnValue(
      recorderStub({ status: "recording", durationMs: 65_000 }),
    );
    mockUseUpload.mockReturnValue(uploadStub());

    render(<RecorderPanel />);

    expect(screen.getByText(/녹음 중 · 01:05/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "녹음 정지" }),
    ).toBeInTheDocument();
  });

  it("clicking stop while recording calls recorder.stop()", async () => {
    const recorder = recorderStub({ status: "recording", durationMs: 1_000 });
    const upload = uploadStub();
    mockUseRecorder.mockReturnValue(recorder);
    mockUseUpload.mockReturnValue(upload);

    const user = userEvent.setup();
    render(<RecorderPanel />);

    await user.click(screen.getByRole("button", { name: "녹음 정지" }));
    expect(recorder.stop).toHaveBeenCalledOnce();
  });

  it("disables the record button while requesting microphone permission", () => {
    mockUseRecorder.mockReturnValue(recorderStub({ status: "requesting" }));
    mockUseUpload.mockReturnValue(uploadStub());

    render(<RecorderPanel />);
    expect(screen.getByText(/마이크 권한 요청 중/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "녹음 시작" })).toBeDisabled();
  });

  it("renders playback controls when recording is finished", () => {
    mockUseRecorder.mockReturnValue(
      recorderStub({
        status: "recorded",
        durationMs: 2_000,
        audioUrl: "blob:abc",
        audioBlob: new Blob(["x"], { type: "audio/webm" }),
        contentType: "audio/webm",
      }),
    );
    mockUseUpload.mockReturnValue(uploadStub());

    render(<RecorderPanel />);

    expect(screen.getByText(/녹음 완료 · 00:02/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /다시 녹음/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /업로드하기/ }),
    ).toBeInTheDocument();
  });

  it("clicking 'upload' invokes upload with the blob and content-type", async () => {
    const blob = new Blob(["x"], { type: "audio/webm" });
    const upload = uploadStub();
    mockUseRecorder.mockReturnValue(
      recorderStub({
        status: "recorded",
        audioBlob: blob,
        contentType: "audio/webm",
        audioUrl: "blob:abc",
      }),
    );
    mockUseUpload.mockReturnValue(upload);

    const user = userEvent.setup();
    render(<RecorderPanel />);

    await user.click(screen.getByRole("button", { name: /업로드하기/ }));
    expect(upload.upload).toHaveBeenCalledWith(blob, "audio/webm");
  });

  it("disables the upload button and skips the call when audio data is missing", async () => {
    const upload = uploadStub();
    mockUseRecorder.mockReturnValue(
      recorderStub({
        status: "recorded",
        audioBlob: null,
        contentType: null,
        audioUrl: null,
      }),
    );
    mockUseUpload.mockReturnValue(upload);

    const user = userEvent.setup();
    render(<RecorderPanel />);

    const button = screen.getByRole("button", { name: /업로드하기/ });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(upload.upload).not.toHaveBeenCalled();
  });

  it("clicking 'rerecord' resets both upload and recorder and starts again", async () => {
    const recorder = recorderStub({
      status: "recorded",
      audioBlob: new Blob(["x"]),
      contentType: "audio/webm",
      audioUrl: "blob:abc",
    });
    const upload = uploadStub();
    mockUseRecorder.mockReturnValue(recorder);
    mockUseUpload.mockReturnValue(upload);

    const user = userEvent.setup();
    render(<RecorderPanel />);

    await user.click(screen.getByRole("button", { name: /다시 녹음/ }));

    expect(upload.reset).toHaveBeenCalledOnce();
    expect(recorder.reset).toHaveBeenCalledOnce();
    expect(recorder.start).toHaveBeenCalledOnce();
  });

  it("renders the upload progress bar while uploading", () => {
    mockUseRecorder.mockReturnValue(
      recorderStub({
        status: "recorded",
        audioBlob: new Blob(["x"]),
        contentType: "audio/webm",
        audioUrl: "blob:abc",
      }),
    );
    mockUseUpload.mockReturnValue(
      uploadStub({ status: "uploading", progress: 42 }),
    );

    render(<RecorderPanel />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "42",
    );
    expect(screen.getByText("S3 업로드 중")).toBeInTheDocument();
  });

  it("shows a 'presigning' label during the presign step", () => {
    mockUseRecorder.mockReturnValue(
      recorderStub({
        status: "recorded",
        audioBlob: new Blob(["x"]),
        contentType: "audio/webm",
        audioUrl: "blob:abc",
      }),
    );
    mockUseUpload.mockReturnValue(uploadStub({ status: "presigning" }));

    render(<RecorderPanel />);
    expect(screen.getByText("업로드 준비 중…")).toBeInTheDocument();
  });

  it("renders a recorder error message", () => {
    mockUseRecorder.mockReturnValue(
      recorderStub({ status: "error", error: "마이크 권한을 허용해주세요." }),
    );
    mockUseUpload.mockReturnValue(uploadStub());

    render(<RecorderPanel />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("마이크 권한을 허용해주세요.");
  });

  it("formats upload error with code prefix when available", () => {
    mockUseRecorder.mockReturnValue(
      recorderStub({
        status: "recorded",
        audioBlob: new Blob(["x"]),
        contentType: "audio/webm",
        audioUrl: "blob:abc",
      }),
    );
    mockUseUpload.mockReturnValue(
      uploadStub({
        status: "error",
        errorCode: "S3_UPLOAD_FAILED",
        errorMessage: "S3 down",
      }),
    );

    render(<RecorderPanel />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "업로드 실패 (S3_UPLOAD_FAILED): S3 down",
    );
  });

  it("renders upload error without code prefix when code is null", () => {
    mockUseRecorder.mockReturnValue(
      recorderStub({
        status: "recorded",
        audioBlob: new Blob(["x"]),
        contentType: "audio/webm",
        audioUrl: "blob:abc",
      }),
    );
    mockUseUpload.mockReturnValue(
      uploadStub({
        status: "error",
        errorCode: null,
        errorMessage: "something broke",
      }),
    );

    render(<RecorderPanel />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "업로드 실패: something broke",
    );
  });
});
