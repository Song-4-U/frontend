import { create } from "zustand";

import type { RecommendationItem } from "@/types/api";

export type RecommendationPhase =
  | "idle"
  | "recording"
  | "recorded"
  | "uploading"
  | "analyzing"
  | "result"
  | "error";

interface RecommendationState {
  phase: RecommendationPhase;
  audioBlob: Blob | null;
  s3Key: string | null;
  timbreLabel: string | null;
  topK: number;
  uploadProgress: number;
  recommendations: RecommendationItem[];
  errorMessage: string | null;
  errorCode: string | null;

  setPhase: (phase: RecommendationPhase) => void;
  setAudioBlob: (blob: Blob | null) => void;
  setS3Key: (key: string | null) => void;
  setTimbreLabel: (label: string | null) => void;
  setTopK: (k: number) => void;
  setUploadProgress: (progress: number) => void;
  setRecommendations: (items: RecommendationItem[]) => void;
  setError: (code: string | null, message: string | null) => void;
  reset: () => void;
}

const initialState = {
  phase: "idle" as RecommendationPhase,
  audioBlob: null,
  s3Key: null,
  timbreLabel: null,
  topK: 10,
  uploadProgress: 0,
  recommendations: [],
  errorMessage: null,
  errorCode: null,
};

export const useRecommendationStore = create<RecommendationState>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  setAudioBlob: (audioBlob) => set({ audioBlob }),
  setS3Key: (s3Key) => set({ s3Key }),
  setTimbreLabel: (timbreLabel) => set({ timbreLabel }),
  setTopK: (topK) => set({ topK }),
  setUploadProgress: (uploadProgress) => set({ uploadProgress }),
  setRecommendations: (recommendations) =>
    set({ recommendations, phase: "result" }),
  setError: (errorCode, errorMessage) =>
    set({ errorCode, errorMessage, phase: "error" }),
  reset: () => set(initialState),
}));
