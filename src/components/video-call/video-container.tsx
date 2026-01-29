import React, { useState, useEffect, useRef } from 'react';
import { Draggable } from '@/components/ui/draggable';
import { VideoAvatarFallback, type VideoOffReason } from '@/components/video-call/video-avatar-fallback';
import { VideoControlsBar } from '@/components/video-call/video-controls-bar';
import { IncomingCallOverlay } from '@/components/video-call/incoming-call-overlay';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { cn } from '@/lib/utils';

interface WaitingCall {
  from: string;
  name: string;
  isVideo: boolean;
}

interface VideoContainerProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  remoteUserName: string;
  isLocalVideoEnabled: boolean;
  isRemoteVideoEnabled: boolean;
  cameraPermission: string;
  onEndCall: () => void;
  onToggleVideo: () => void;
  waitingCall?: WaitingCall | null;
  onSwitchCall?: () => void;
  onDismissWaitingCall?: () => void;
}

export const VideoContainer: React.FC<VideoContainerProps> = ({
  localStream,
  remoteStream,
  remoteUserName,
  isLocalVideoEnabled,
  isRemoteVideoEnabled,
  cameraPermission,
  onEndCall,
  onToggleVideo,
  waitingCall,
  onSwitchCall,
  onDismissWaitingCall,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const breakpoint = useBreakpoint();

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isSwapped]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isSwapped]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const hasVideoTrack = localStream ? localStream.getVideoTracks().length > 0 : false;

  const getVideoOffReason = (isLocal: boolean): VideoOffReason => {
    if (isLocal) {
      if (cameraPermission === 'denied') return 'permission-denied';
      if (!localStream || localStream.getVideoTracks().length === 0) return 'no-device';
      if (!isLocalVideoEnabled) return 'toggled-off';
      return 'no-stream';
    }
    // Remote
    if (!isRemoteVideoEnabled) return 'remote-off';
    if (!remoteStream) return 'no-stream';
    return 'no-stream';
  };

  const renderVideo = (
    stream: MediaStream | null,
    isLocal: boolean,
    isMain: boolean,
    userName: string
  ) => {
    const videoRef = isLocal ? localVideoRef : remoteVideoRef;
    const videoEnabled = isLocal ? isLocalVideoEnabled : isRemoteVideoEnabled;
    const showAvatar = !stream || !videoEnabled;

    return (
      <div
        className={cn(
          'relative w-full h-full bg-black overflow-hidden flex items-center justify-center',
          isMain ? 'rounded-none' : 'rounded-xl shadow-lg border border-white/20'
        )}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={cn(
            'w-full h-full object-cover',
            showAvatar ? 'hidden' : 'block',
            isLocal && 'scale-x-[-1]'
          )}
        />
        {showAvatar && (
          <VideoAvatarFallback
            userName={userName}
            reason={getVideoOffReason(isLocal)}
            isMain={isMain}
          />
        )}

        {/* Name Label */}
        <div className="absolute bottom-4 left-4 bg-black/50 px-2 py-1 rounded text-white text-sm">
          {isLocal ? 'You' : userName}
        </div>
      </div>
    );
  };

  const mainStream = isSwapped ? localStream : remoteStream;
  const pipStream = isSwapped ? remoteStream : localStream;

  const mainIsLocal = isSwapped;
  const pipIsLocal = !isSwapped;

  const mainName = isSwapped ? 'You' : remoteUserName;
  const pipName = isSwapped ? remoteUserName : 'You';

  const pipSizeClass =
    breakpoint === 'mobile'
      ? 'w-24 h-36'
      : breakpoint === 'tablet'
        ? 'w-32 h-48'
        : 'w-40 h-56';

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Incoming Call Overlay (call waiting) */}
      {waitingCall && onSwitchCall && onDismissWaitingCall && (
        <IncomingCallOverlay
          callerName={waitingCall.name}
          isVideo={waitingCall.isVideo}
          onSwitch={onSwitchCall}
          onDismiss={onDismissWaitingCall}
        />
      )}

      {/* Main Video Area */}
      <div className="absolute inset-0 w-full h-full">
        {renderVideo(mainStream, mainIsLocal, true, mainName)}
      </div>

      {/* PiP View */}
      <Draggable
        zIndex={40}
        dragThreshold={5}
        onClick={() => setIsSwapped(!isSwapped)}
      >
        <div className={cn(pipSizeClass, 'hover:opacity-90 transition-opacity shadow-xl')}>
          {renderVideo(pipStream, pipIsLocal, false, pipName)}
        </div>
      </Draggable>

      {/* Controls Bar */}
      <VideoControlsBar
        isMuted={isMuted}
        isVideoOff={!isLocalVideoEnabled}
        hasVideoTrack={hasVideoTrack}
        breakpoint={breakpoint}
        onToggleMute={toggleMute}
        onToggleVideo={onToggleVideo}
        onEndCall={onEndCall}
      />
    </div>
  );
};
