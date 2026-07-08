/**
 * バックエンド API クライアント。
 * 認証は httpOnly Cookie で行うため、全リクエストに credentials: 'include' を付ける。
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

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
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
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
  /**
   * 録画チャンクの送信。通常の request() と契約が異なるため専用:
   * 例外を投げず結果を値で返す（'conflict' = 連番不整合でセッション継続不能、
   * 'failed' = ネットワーク断等。呼び出し側が新セッションで復旧する）。
   */
  postRecordingChunk: async (
    session: string,
    seq: number,
    blob: Blob
  ): Promise<'ok' | 'conflict' | 'failed'> => {
    const url = `${API_BASE}/api/interviews/me/recording/chunk?session=${session}&seq=${seq}`;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'video/webm' },
          body: blob,
        });
        if (res.ok) return 'ok';
        if (res.status === 409) return 'conflict';
      } catch {
        // ネットワーク断: 1回だけリトライ
      }
    }
    return 'failed';
  },
};

// ===== 型定義 =====
// バックエンド（prisma/schema.prisma の enum）と手動同期している。
// スキーマの InterviewMode / InterviewStatus を変更したらここも更新すること。

export type InterviewMode = 'FIXED' | 'AI' | 'HYBRID';
export type InterviewStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

export interface InterviewSummary {
  id: string;
  candidateName: string;
  mode: InterviewMode;
  status: InterviewStatus;
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

// ===== 管理者向け =====

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'OWNER' | 'RECRUITER';
}

export interface AdminLoginResponse {
  /** パスワード認証後の次ステップ（setup_required: 初回 / code_required: 2回目以降） */
  mfa: 'setup_required' | 'code_required';
}

export interface AdminMfaVerifyResponse {
  admin: AdminUser;
}

export interface QuestionSetSummary {
  id: number;
  name: string;
  description: string | null;
  questionCount: number;
  interviewCount: number;
  createdAt: string;
}

export interface AdminInterviewRow {
  id: string;
  candidateName: string;
  candidateEmail: string | null;
  loginId: string;
  mode: InterviewMode;
  status: InterviewStatus;
  questionSetName: string | null;
  answerCount: number;
  hasRecording: boolean;
  expiresAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface IssuedCredentials {
  loginId: string;
  password: string;
}

export interface CreateInterviewResponse {
  interview: { id: string; candidateName: string; mode: InterviewMode; expiresAt: string };
  credentials: IssuedCredentials;
}

export interface AdminInterviewQuestion {
  id: number;
  sequence: number;
  text: string;
  timeLimitSec: number;
}

export interface AdminInterviewDetail {
  id: string;
  candidateName: string;
  candidateEmail: string | null;
  loginId: string;
  mode: InterviewMode;
  status: InterviewStatus;
  questionSetName: string | null;
  expiresAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  createdBy: string;
  /** SCHEDULED（面接開始前）のときのみ true。質問の追加・編集・削除が可能 */
  canEditQuestions: boolean;
  questions: AdminInterviewQuestion[];
  answers: {
    sequence: number;
    questionText: string;
    transcript: string | null;
    durationSec: number | null;
    answeredAt: string;
  }[];
  recording: { mimeType: string; sizeBytes: string | null; uploadedAt: string } | null;
  recordingSegments: { id: number; sizeBytes: string; createdAt: string }[];
  aiSummary: unknown | null;
}
