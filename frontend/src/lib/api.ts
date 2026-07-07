/**
 * バックエンド API クライアント。
 * 認証は httpOnly Cookie で行うため、全リクエストに credentials: 'include' を付ける。
 */
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? 'サーバーエラーが発生しました。');
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  /** multipart/form-data 送信（Content-Type はブラウザが boundary 付きで自動設定する） */
  postForm: async <T>(path: string, formData: FormData): Promise<T> => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(res.status, body?.error ?? 'サーバーエラーが発生しました。');
    }
    return body as T;
  },
};

// ===== 型定義 =====

export interface InterviewSummary {
  id: string;
  candidateName: string;
  mode: 'FIXED' | 'AI' | 'HYBRID';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  totalQuestions?: number | null;
  expiresAt?: string;
  startedAt?: string | null;
}

export interface LoginResponse {
  interview: InterviewSummary;
}

export interface InterviewQuestion {
  sequence: number;
  text: string;
  timeLimitSec: number;
}

export interface NextQuestionResponse {
  finished: boolean;
  question: InterviewQuestion | null;
  progress: { current: number; total: number };
}

export interface MeResponse {
  interview: InterviewSummary;
}
