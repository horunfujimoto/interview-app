import { useState, useCallback, useRef, useEffect } from 'react';

interface UseMediaRecorder {
  isRecording: boolean;
  startRecording: (stream: MediaStream) => void;
  /** 録画を停止し、録画データ（webm Blob）を返す */
  stopRecording: () => Promise<Blob | null>;
}

/**
 * useMediaRecorder Custom Hook
 * MediaStream を MediaRecorder で録画し、停止時に Blob を返す。
 */
export const useMediaRecorder = (): UseMediaRecorder => {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback((stream: MediaStream) => {
    if (recorderRef.current?.state === 'recording') return;

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType });

    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start(1000); // 1秒ごとにチャンク化（途中クラッシュ時のデータ損失を最小化）
    recorderRef.current = recorder;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type: 'video/webm' }) : null);
        return;
      }
      recorder.onstop = () => {
        setIsRecording(false);
        resolve(new Blob(chunksRef.current, { type: 'video/webm' }));
      };
      recorder.stop();
    });
  }, []);

  // アンマウント時に録画を止める
  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
    };
  }, []);

  return { isRecording, startRecording, stopRecording };
};
