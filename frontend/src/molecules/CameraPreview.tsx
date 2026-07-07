import { useEffect, useRef } from 'react';
import { TriangleAlert } from 'lucide-react'; // Lucide icons for error
import { Button } from '@/atoms'; // Assuming Button atom is available
import classNames from 'classnames';

interface CameraPreviewProps {
  stream: MediaStream | null;
  hasError: boolean;
  onRetry: () => void;
  className?: string;
}

/**
 * CameraPreview Component
 * Displays camera stream or an error message.
 */
export const CameraPreview = ({ stream, hasError, onRetry, className }: CameraPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const currentVideoRef = videoRef.current; // Capture the current ref value
    if (currentVideoRef && stream) {
      currentVideoRef.srcObject = stream;
      currentVideoRef.play().catch(err => console.error("Error playing video:", err));
    }
    // Cleanup function: stop video tracks when component unmounts or stream changes
    return () => {
      if (currentVideoRef && currentVideoRef.srcObject) {
        (currentVideoRef.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        currentVideoRef.srcObject = null;
      }
    };
  }, [stream]);

  const wrapperClasses = classNames(
    "position-relative",
    "bg-dark", // Ensure dark background for video area
    "rounded-3",
    "overflow-hidden",
    className,
    "video-wrapper", // Custom class for fixed height if needed
  );

  return (
    <div className={wrapperClasses} style={{ height: '250px' }}> {/* Fixed height as per HTML example */}
      <video ref={videoRef} autoPlay muted className={classNames("w-100 h-100", { "d-none": hasError })} style={{ objectFit: 'cover' }} />

      {hasError && (
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-flex flex-column align-items-center justify-content-center text-white p-3">
          <TriangleAlert size={48} className="text-danger mb-2" />
          <p className="text-center fs-5">カメラにアクセスできません。</p>
          <p className="text-center mb-3">ブラウザの設定をご確認ください。</p>
          <Button variant="warning" onClick={onRetry}>
            再試行
          </Button>
        </div>
      )}
    </div>
  );
};