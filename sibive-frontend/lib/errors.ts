import axios from "axios";
import type { ApiErrorBody } from "./types";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.error ?? fallback;
  }
  return fallback;
}
