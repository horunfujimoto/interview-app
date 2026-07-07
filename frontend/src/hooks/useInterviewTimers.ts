import { useState, useEffect, useCallback, useRef } from 'react';

const INITIAL_RESPONSE_TIME = 45; // 秒（制限時間未指定時のデフォルト）

interface UseInterviewTimers {
  totalTime: number;
  responseRemainingTime: number;
  startTimers: () => void;
  resetResponseTimer: (timeLimitSec?: number) => void;
}

/**
 * useInterviewTimers Custom Hook
 * AI面接画面の総経過時間と応答タイマーを管理するカスタムフック。
 * @returns {UseInterviewTimers} totalTime, responseRemainingTime, startTimers, resetResponseTimer
 */
export const useInterviewTimers = (): UseInterviewTimers => {
  const [totalTime, setTotalTime] = useState<number>(0);
  const [responseRemainingTime, setResponseRemainingTime] = useState<number>(INITIAL_RESPONSE_TIME);
  const totalTimerIntervalRef = useRef<number | null>(null);
  const responseTimerIntervalRef = useRef<number | null>(null);

  const startTotalTimer = useCallback(() => {
    if (totalTimerIntervalRef.current !== null) {
      clearInterval(totalTimerIntervalRef.current);
    }
    totalTimerIntervalRef.current = window.setInterval(() => {
      setTotalTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const startResponseTimer = useCallback(() => {
    if (responseTimerIntervalRef.current !== null) {
      clearInterval(responseTimerIntervalRef.current);
    }
    responseTimerIntervalRef.current = window.setInterval(() => {
      setResponseRemainingTime((prev) => {
        if (prev <= 0) {
          // 時間切れの処理はフックの利用側で実装されることを想定
          clearInterval(responseTimerIntervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetResponseTimer = useCallback((timeLimitSec?: number) => {
    setResponseRemainingTime(timeLimitSec ?? INITIAL_RESPONSE_TIME);
    startResponseTimer(); // リセット後にタイマーを再開
  }, [startResponseTimer]);

  const startTimers = useCallback(() => {
    startTotalTimer();
    startResponseTimer();
  }, [startTotalTimer, startResponseTimer]);

  // アンマウント時にタイマーをクリーンアップ
  useEffect(() => {
    return () => {
      if (totalTimerIntervalRef.current !== null) {
        clearInterval(totalTimerIntervalRef.current);
      }
      if (responseTimerIntervalRef.current !== null) {
        clearInterval(responseTimerIntervalRef.current);
      }
    };
  }, []);

  return {
    totalTime,
    responseRemainingTime,
    startTimers,
    resetResponseTimer,
  };
};
