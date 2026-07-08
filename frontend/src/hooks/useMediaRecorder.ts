import { useState, useCallback, useRef, useEffect } from 'react';
import { API_BASE } from '../lib/api';

const CHUNK_INTERVAL_MS = 5000; // 5秒ごとにチャンクをサーバーへ送る

interface UseMediaRecorder {
  isRecording: boolean;
  /** アップロードが継続的に失敗している場合 true（UIで警告表示に使える） */
  hasUploadTrouble: boolean;
  startRecording: (stream: MediaStream) => void;
  /** 録画を停止し、未送信チャンクをすべて送り終えるまで待つ */
  stopRecording: () => Promise<void>;
}

const newSessionId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/**
 * useMediaRecorder Custom Hook
 * MediaStream を録画し、チャンクを逐次サーバーへアップロードする。
 * 一括アップロードと違い、リロードやクラッシュが起きても送信済みのぶんは保全される。
 * 送信に失敗した場合は新しいセッション（別セグメント）を開始して録画を継続する。
 */
export const useMediaRecorder = (): UseMediaRecorder => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasUploadTrouble, setHasUploadTrouble] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<string>('');
  const seqRef = useRef(0);
  // チャンクは到着順に1本のPromiseチェーンで直列送信する（連番保証のため）
  const uploadChainRef = useRef<Promise<void>>(Promise.resolve());
  const sessionBrokenRef = useRef(false);
  const stoppingRef = useRef(false);

  const sendChunk = useCallback(async (blob: Blob, session: string, seq: number): Promise<boolean> => {
    const url = `${API_BASE}/api/interviews/me/recording/chunk?session=${session}&seq=${seq}`;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'video/webm' },
          body: blob,
        });
        if (res.ok) return true;
        if (res.status === 409) return false; // 連番不整合 → このセッションは継続不能
      } catch {
        // ネットワーク断: 1回だけリトライ
      }
    }
    return false;
  }, []);

  const beginSession = useCallback((stream: MediaStream) => {
    const session = newSessionId();
    sessionRef.current = session;
    seqRef.current = 0;
    sessionBrokenRef.current = false;

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size === 0 || sessionBrokenRef.current) return;
      const seq = ++seqRef.current;
      uploadChainRef.current = uploadChainRef.current.then(async () => {
        if (sessionBrokenRef.current) return;
        const ok = await sendChunk(e.data, session, seq);
        if (!ok) {
          // このセッションは打ち切り、録画は新セッションで続ける（送信済み分は保全済み）
          sessionBrokenRef.current = true;
          setHasUploadTrouble(true);
          if (!stoppingRef.current && streamRef.current) {
            recorder.stop();
          }
        } else {
          setHasUploadTrouble(false);
        }
      });
    };

    recorder.onstop = () => {
      // 送信失敗による停止なら、新しいセッションで録画を再開する
      if (sessionBrokenRef.current && !stoppingRef.current && streamRef.current) {
        beginSession(streamRef.current);
      }
    };

    recorder.start(CHUNK_INTERVAL_MS);
    recorderRef.current = recorder;
    setIsRecording(true);
  }, [sendChunk]);

  const startRecording = useCallback((stream: MediaStream) => {
    if (recorderRef.current?.state === 'recording') return;
    streamRef.current = stream;
    stoppingRef.current = false;
    beginSession(stream);
  }, [beginSession]);

  const stopRecording = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      stoppingRef.current = true;
      const recorder = recorderRef.current;
      const finish = () => {
        // キューに残っているチャンクを送り切ってから完了する
        uploadChainRef.current.then(() => {
          setIsRecording(false);
          resolve();
        });
      };
      if (!recorder || recorder.state === 'inactive') {
        finish();
        return;
      }
      recorder.onstop = finish;
      recorder.stop(); // 停止時に最後のチャンクが ondataavailable へ届く
    });
  }, []);

  // アンマウント時に録画を止める
  useEffect(() => {
    return () => {
      stoppingRef.current = true;
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
    };
  }, []);

  return { isRecording, hasUploadTrouble, startRecording, stopRecording };
};
