import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, AlertTriangle } from 'lucide-react';
import classNames from 'classnames';

interface VideoPlayerProps {
  stream: MediaStream | null;
  isMicActive: boolean | null; // null は「不明」や「アクセス拒否」の状態を表す
  muted?: boolean;
  className?: string;
}

/**
 * VideoPlayer Molecule
 * 応募者のビデオストリームを表示し、マイクステータスオーバーレイを含むコンポーネント。
 * @param {VideoPlayerProps} props - The props for the component.
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  stream,
  isMicActive,
  muted = true,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const micStatusClasses = classNames(
    'mic-status-overlay', // `App.css`で定義するカスタムクラス
    'position-absolute',
    'bottom-3',
    'right-3',
    'p-2',
    'rounded-pill',
    'd-flex',
    'align-items-center',
    'text-sm',
    {
      'bg-danger': isMicActive === true, // マイクON
      'bg-secondary': isMicActive === false, // マイクOFF
      'bg-warning': isMicActive === null, // アクセス拒否など
    },
    'text-white',
    'space-x-1'
  );

  return (
    <div className={classNames('video-wrapper', className)}>
      {/* 自分用プレビューは鏡像表示する（表示のみ。録画データには影響しない） */}
      <video ref={videoRef} autoPlay playsInline muted={muted} className="object-cover w-100 h-100" style={{ transform: 'scaleX(-1)' }}></video>
      <div className={micStatusClasses}>
        {isMicActive === true && <Mic size={16} />}
        {isMicActive === false && <MicOff size={16} />}
        {isMicActive === null && <AlertTriangle size={16} />}
        <span>
          {isMicActive === true ? 'ON' : isMicActive === false ? 'OFF' : 'アクセス拒否'}
        </span>
      </div>
    </div>
  );
};
