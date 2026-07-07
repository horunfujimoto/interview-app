import { useEffect, useRef, useState, useCallback } from 'react';
import classNames from 'classnames';

interface MicrophoneLevelIndicatorProps {
  stream: MediaStream | null;
  className?: string;
  micError: boolean; // マイクエラーの状態を受け取る
}

// Global AudioContext for reusability
let audioContext: AudioContext | null = null;

// Extend Window interface to include webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

/**
 * MicrophoneLevelIndicator Component
 * Displays microphone level bar and status text, analyzes audio stream.
 */
export const MicrophoneLevelIndicator = ({ stream, className, micError }: MicrophoneLevelIndicatorProps) => {
  const micLevelBarRef = useRef<HTMLDivElement>(null);
  
  // Determine initial status based on props
  const getInitialStatus = useCallback((currentStream: MediaStream | null, currentMicError: boolean) => {
    if (!currentStream && !currentMicError) {
      return { text: '待機中', color: 'text-muted' };
    } else if (currentMicError) {
      return { text: 'エラー', color: 'text-danger' };
    }
    return { text: 'OK', color: 'text-success' }; // Default to OK if stream is present and no error, this will be updated by analysis
  }, []);

  const [micStatusText, setMicStatusText] = useState(() => getInitialStatus(stream, micError).text);
  const [micStatusColor, setMicStatusColor] = useState(() => getInitialStatus(stream, micError).color);

  const [selectedMic] = useState('（デバイス名）');
  const animationFrameId = useRef<number | undefined>(undefined);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const isComponentMounted = useRef(true);

  // Refs to track current status text and color inside the animation frame loop
  const currentStatusTextInternalRef = useRef(micStatusText);
  const currentStatusColorInternalRef = useRef(micStatusColor);


  // Initialize or get AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContext) {
      if (typeof window.AudioContext !== 'undefined') {
        audioContext = new window.AudioContext();
      } else if (typeof window.webkitAudioContext !== 'undefined') {
        audioContext = new window.webkitAudioContext();
      }
    }
    return audioContext;
  }, []);

  const stopAnalysis = useCallback(() => {
    cancelAnimationFrame(animationFrameId.current as number);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (analyserRef.current) analyserRef.current.disconnect();
    if (audioContext) {
      if (audioContext.state !== 'closed') {
        audioContext.close().catch(e => console.error("Error closing AudioContext:", e));
      }
    }
    audioContext = null;
    analyserRef.current = null;
    sourceRef.current = null;
  }, []);

  useEffect(() => {
    isComponentMounted.current = true;
    
    // Update internal refs for use in updateMicLevel closure
    currentStatusTextInternalRef.current = micStatusText;
    currentStatusColorInternalRef.current = micStatusColor;

    if (!stream || micError) {
      stopAnalysis();
      // Update state if analysis is not starting
      const status = getInitialStatus(stream, micError);
      setMicStatusText(status.text);
      setMicStatusColor(status.color);
      return;
    }

    const currentAudioContext = getAudioContext();
    if (!currentAudioContext) {
      setMicStatusText('オーディオAPI利用不可');
      setMicStatusColor('text-danger');
      return;
    }

    analyserRef.current = currentAudioContext.createAnalyser();
    sourceRef.current = currentAudioContext.createMediaStreamSource(stream);
    analyserRef.current.fftSize = 256;
    sourceRef.current.connect(analyserRef.current);

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateMicLevel = () => {
      if (!isComponentMounted.current || !analyserRef.current || !micLevelBarRef.current) {
        return;
      }

      analyserRef.current.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;

      const level = Math.min(100, Math.round((average / 150) * 100));
      micLevelBarRef.current.style.width = `${level}%`;

      let newMicStatusText = currentStatusTextInternalRef.current;
      let newMicStatusColor = currentStatusColorInternalRef.current;

      if (level < 5) {
        if (currentStatusTextInternalRef.current !== '小さすぎます' && currentStatusTextInternalRef.current !== 'エラー') {
          newMicStatusText = '小さすぎます';
          newMicStatusColor = 'text-warning';
        }
      } else {
        if (currentStatusTextInternalRef.current !== 'OK' && currentStatusTextInternalRef.current !== 'エラー') {
          newMicStatusText = 'OK';
          newMicStatusColor = 'text-success';
        }
      }

      if (newMicStatusText !== currentStatusTextInternalRef.current) {
        setMicStatusText(newMicStatusText);
        currentStatusTextInternalRef.current = newMicStatusText;
      }
      if (newMicStatusColor !== currentStatusColorInternalRef.current) {
        setMicStatusColor(newMicStatusColor);
        currentStatusColorInternalRef.current = newMicStatusColor;
      }
      animationFrameId.current = requestAnimationFrame(updateMicLevel);
    };

    updateMicLevel();
    
    if (!micError && stream && currentStatusTextInternalRef.current === '初期化中...') {
      setMicStatusText('OK');
      setMicStatusColor('text-success');
    }

    return () => {
      isComponentMounted.current = false;
      stopAnalysis();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, micError, getAudioContext, stopAnalysis, getInitialStatus]);

  const containerClasses = classNames(
    "mb-4",
    className,
  );

  return (
    <div className={containerClasses}>
      <p className="text-sm font-weight-medium text-gray-600 mb-1 d-flex justify-content-between align-items-center">
        <span>マイクレベル: <span className={classNames("font-weight-semibold", micStatusColor)}>{micStatusText}</span></span>
        <span className="text-xs text-gray-500">{selectedMic}</span>
      </p>
      <div className="mic-bar-container" style={{ height: '10px', backgroundColor: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
        <div ref={micLevelBarRef} className="mic-level-bar" style={{ width: '0%', height: '100%', backgroundColor: '#10b981', transition: 'width 0.1s ease-out' }}></div>
      </div>
    </div>
  );
};