import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

interface MediaError {
  type: 'NotAllowedError' | 'NotFoundError' | 'NotReadableError' | 'unknown';
  device: 'camera' | 'microphone' | 'both';
  message: string;
}

interface MediaResult {
  stream: MediaStream | null;
  videoEnabled: boolean;
}

export const useMediaPermissions = () => {
  const [cameraPermission, setCameraPermission] = useState<PermissionState>('unknown');
  const [microphonePermission, setMicrophonePermission] = useState<PermissionState>('unknown');
  const [lastError, setLastError] = useState<MediaError | null>(null);

  // Query permission state on mount
  useEffect(() => {
    const queryPermission = async (name: PermissionName, setter: (s: PermissionState) => void) => {
      try {
        const result = await navigator.permissions.query({ name });
        setter(result.state);
        result.addEventListener('change', () => setter(result.state));
      } catch {
        // Firefox doesn't support querying camera/microphone permissions
        setter('unknown');
      }
    };

    queryPermission('camera' as PermissionName, setCameraPermission);
    queryPermission('microphone' as PermissionName, setMicrophonePermission);
  }, []);

  const classifyError = (err: unknown, device: MediaError['device']): MediaError => {
    if (err instanceof DOMException) {
      switch (err.name) {
        case 'NotAllowedError':
          return { type: 'NotAllowedError', device, message: `${device === 'camera' ? 'Camera' : device === 'microphone' ? 'Microphone' : 'Camera & microphone'} access was blocked. Check your browser permissions.` };
        case 'NotFoundError':
          return { type: 'NotFoundError', device, message: `No ${device} found on this device.` };
        case 'NotReadableError':
          return { type: 'NotReadableError', device, message: `${device === 'camera' ? 'Camera' : 'Microphone'} is already in use by another app.` };
        default:
          return { type: 'unknown', device, message: `Could not access ${device}: ${err.message}` };
      }
    }
    return { type: 'unknown', device, message: `Could not access ${device}.` };
  };

  const requestMediaWithFallback = useCallback(async (preferVideo: boolean): Promise<MediaResult> => {
    setLastError(null);

    // Audio-only call requested
    if (!preferVideo) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        return { stream, videoEnabled: false };
      } catch (err) {
        const error = classifyError(err, 'microphone');
        setLastError(error);
        toast.error(error.message);
        return { stream: null, videoEnabled: false };
      }
    }

    // Video call — try video + audio first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      return { stream, videoEnabled: true };
    } catch (err) {
      const videoError = classifyError(err, 'camera');

      // If camera fails, try audio-only fallback
      if (videoError.type === 'NotAllowedError' || videoError.type === 'NotFoundError' || videoError.type === 'NotReadableError') {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          toast.warning('Camera unavailable — joining with audio only.');
          setLastError(videoError);
          return { stream: audioStream, videoEnabled: false };
        } catch (audioErr) {
          const audioError = classifyError(audioErr, 'both');
          setLastError(audioError);
          toast.error(audioError.message);
          return { stream: null, videoEnabled: false };
        }
      }

      setLastError(videoError);
      toast.error(videoError.message);
      return { stream: null, videoEnabled: false };
    }
  }, []);

  return {
    requestMediaWithFallback,
    cameraPermission,
    microphonePermission,
    lastError,
  };
};
