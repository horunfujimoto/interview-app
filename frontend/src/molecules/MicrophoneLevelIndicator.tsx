import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

interface MicrophoneLevelIndicatorProps {
  stream: MediaStream | null;
  className?: string;
  micError: boolean; // マイクエラーの状態を受け取る
}

/**
 * MicrophoneLevelIndicator Component
 * Displays microphone level bar and status text, analyzes audio stream.
 */
export const MicrophoneLevelIndicator = ({ stream, className, micError }: MicrophoneLevelIndicatorProps) => {
  const micLevelBarRef = useRef<HTMLDivElement>(null);
  const [micStatusText, setMicStatusText] = useState('初期化中...');
  const [micStatusColor, setMicStatusColor] = useState('text-yellow-600'); // Corresponds to Tailwind-like classes
  const [selectedMic] = useState('（デバイス名）'); // Placeholder for selected device name

  useEffect(() => {
    if (!stream) {
      if (!micError) { // ストリームがないがエラーではない場合（まだ開始していない等）
        setMicStatusText('待機中');
        setMicStatusColor('text-muted');
      } else { // ストリームなしでエラーの場合
        setMicStatusText('エラー');
        setMicStatusColor('text-red-600');
      }
      return;
    }

    if (micError) { // ストリームはあるが外部でエラーと判断された場合
        setMicStatusText('エラー');
        setMicStatusColor('text-red-600');
        return;
    }

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let animationFrameId: number;
    let isMounted = true; // For cleanup

    const startAnalysis = () => {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMicLevel = () => {
        if (!isMounted) return;

        analyser!.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        const level = Math.min(100, Math.round((average / 150) * 100)); // 150を基準とする (HTMLのJSに合わせる)

        if (micLevelBarRef.current) {
          micLevelBarRef.current.style.width = `${level}%`;
        }
        
        if (isMounted) { // Mountされている場合のみstateを更新
            if (level < 5) {
              if (micStatusText !== 'エラー') {
                setMicStatusText('小さすぎます');
                setMicStatusColor('text-warning'); // text-yellow-600 to text-warning (Bootstrap)
              }
            } else {
              if (micStatusText !== 'OK' && micStatusText !== 'エラー') {
                setMicStatusText('OK');
                setMicStatusColor('text-success'); // text-green-600 to text-success (Bootstrap)
              }
            }
        }
        animationFrameId = requestAnimationFrame(updateMicLevel);
      };

      updateMicLevel();
      if (isMounted) { // Mountされている場合のみstateを更新
        setMicStatusText('OK');
        setMicStatusColor('text-success');
      }
    };

    startAnalysis();

    // Cleanup function
    return () => {
      isMounted = false; // Prevent state updates on unmounted component
      cancelAnimationFrame(animationFrameId);
      if (source) source.disconnect();
      if (analyser) analyser.disconnect();
      if (audioContext) audioContext.close();
      // Reset state on cleanup
      setMicStatusText('初期化中...');
      setMicStatusColor('text-warning');
    };
  }, [stream, micError]); // Dependencies: stream and micError

  const containerClasses = classNames(
    "mb-4",
    className,
  );

  return (
    <div className={containerClasses}>
      <p className="text-sm font-medium text-gray-600 mb-1 d-flex justify-content-between align-items-center">
        <span>マイクレベル: <span className={classNames("font-semibold", micStatusColor)}>{micStatusText}</span></span>
        <span className="text-xs text-gray-500">{selectedMic}</span>
      </p>
      <div className="mic-bar-container" style={{ height: '10px', backgroundColor: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}> {/* Tailwind Gray 200 */}
        <div ref={micLevelBarRef} className="mic-level-bar" style={{ width: '0%', height: '100%', backgroundColor: '#10b981', transition: 'width 0.1s ease-out' }}></div> {/* Tailwind Green 500 */}
      </div>
    </div>
  );
};
