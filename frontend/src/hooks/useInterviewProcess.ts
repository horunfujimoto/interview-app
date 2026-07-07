import { useState, useCallback, useEffect, useRef } from 'react';
import { api, type MeResponse, type NextQuestionResponse, type InterviewQuestion } from '../lib/api';

interface UseInterviewProcess {
  interviewId: string | null;
  currentQuestionSequence: number;
  totalQuestions: number;
  questionTitle: string;
  questionText: string;
  timeLimitSec: number;
  isLoading: boolean;
  error: Error | null;
  isUnauthorized: boolean;
  submitAnswerAndNext: (durationSec?: number) => Promise<void>;
  finishInterview: () => Promise<void>;
  hasInterviewFinished: boolean;
}

/**
 * useInterviewProcess Custom Hook
 * 質問の進行、回答の送信、面接終了などのロジックを管理するカスタムフック。
 * 質問はサーバーから取得する（モード分岐はサーバー側に集約されている）。
 */
export const useInterviewProcess = (): UseInterviewProcess => {
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false);
  const [hasInterviewFinished, setHasInterviewFinished] = useState<boolean>(false);
  const initialized = useRef(false);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error && 'status' in err && (err as { status: number }).status === 401) {
      setIsUnauthorized(true); // セッション切れ → ログイン画面へ誘導
      return;
    }
    setError(err as Error);
  }, []);

  const fetchNextQuestion = useCallback(async (): Promise<boolean> => {
    const data = await api.get<NextQuestionResponse>('/api/interviews/me/questions/next');
    setProgress(data.progress);
    if (data.finished || !data.question) {
      return true; // 全問終了
    }
    setQuestion(data.question);
    return false;
  }, []);

  const finishInterview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/api/interviews/me/finish');
      setHasInterviewFinished(true);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // 初期化: 面接情報と最初の質問を取得
  useEffect(() => {
    if (initialized.current) return; // StrictMode の二重実行を防ぐ
    initialized.current = true;

    (async () => {
      try {
        const { interview } = await api.get<MeResponse>('/api/interviews/me');
        setInterviewId(interview.id);
        const finished = await fetchNextQuestion();
        if (finished) {
          await finishInterview(); // リロード時に全問回答済みだった場合
        }
      } catch (err) {
        handleError(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [fetchNextQuestion, finishInterview, handleError]);

  const submitAnswerAndNext = useCallback(async (durationSec?: number) => {
    if (!question) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/api/interviews/me/answers', {
        sequence: question.sequence,
        durationSec: durationSec ?? null,
        // TODO: Phase 4 で音声の文字起こし（transcript）を送信する
      });
      const finished = await fetchNextQuestion();
      if (finished) {
        await finishInterview();
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [question, fetchNextQuestion, finishInterview, handleError]);

  return {
    interviewId,
    currentQuestionSequence: question?.sequence ?? 0,
    totalQuestions: progress.total,
    questionTitle: 'AI面接官からの質問',
    questionText: question?.text ?? '',
    timeLimitSec: question?.timeLimitSec ?? 180,
    isLoading,
    error,
    isUnauthorized,
    submitAnswerAndNext,
    finishInterview,
    hasInterviewFinished,
  };
};
