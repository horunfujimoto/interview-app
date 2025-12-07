import { useState, useEffect, useRef, useCallback } from 'react';

interface UseMediaStream {
  stream: MediaStream | null;
  isMicActive: boolean | null;
  error: Error | null;
  getMediaStream: () => Promise<void>;
}

/**
 * useMediaStream Custom Hook
 * カメラとマイクのメディアストリームを管理するカスタムフック。
 * @returns {UseMediaStream} stream, isMicActive, error, getMediaStream
 */
export const useMediaStream = (): UseMediaStream => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMicActive, setIsMicActive] = useState<boolean | null>(null); // true: ON, false: OFF, null: アクセス拒否/不明
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  const getMediaStream = useCallback(async () => {
    try {
      setError(null);
      // 既存のストリームがあれば停止
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (isMounted.current) {
        setStream(newStream);
        const audioTrack = newStream.getAudioTracks()[0];
        if (audioTrack) {
          setIsMicActive(audioTrack.enabled);
          audioTrack.onended = () => {
            if (isMounted.current) setIsMicActive(false);
          };
        } else {
          setIsMicActive(false);
        }
      }
    } catch (err) {
      if (isMounted.current) {
        console.error('メディアアクセスエラー:', err);
        setError(err as Error);
        setStream(null);
        setIsMicActive(null); // アクセス拒否の状態
      }
    }
  }, [stream]); // stream を依存配列から削除するため、getMediaStream自体は変わらない

  // コンポーネントマウント時にメディアストリームを取得
  useEffect(() => {
    isMounted.current = true;
    const fetchStream = async () => {
      await getMediaStream();
    };
    fetchStream();

    return () => {
      isMounted.current = false;
      // アンマウント時にストリームを停止
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空の依存配列で初回マウント時のみ実行
  
  return { stream, isMicActive, error, getMediaStream };
};
