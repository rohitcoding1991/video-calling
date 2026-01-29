import React from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Breakpoint } from '@/hooks/use-breakpoint';

interface VideoControlsBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  hasVideoTrack: boolean;
  breakpoint: Breakpoint;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

export const VideoControlsBar: React.FC<VideoControlsBarProps> = ({
  isMuted,
  isVideoOff,
  hasVideoTrack,
  breakpoint,
  onToggleMute,
  onToggleVideo,
  onEndCall,
}) => {
  const btnSize = breakpoint === 'mobile' ? 'w-12 h-12' : 'w-14 h-14';
  const endBtnSize = breakpoint === 'mobile' ? 'w-14 h-14' : 'w-16 h-16';
  const iconSize = breakpoint === 'mobile' ? 'w-5 h-5' : 'w-6 h-6';
  const endIconSize = breakpoint === 'mobile' ? 'w-6 h-6' : 'w-8 h-8';
  const gap = breakpoint === 'mobile' ? 'gap-4' : 'gap-6';
  const padding = breakpoint === 'mobile' ? 'p-4' : 'p-6';

  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 right-0 flex items-end justify-center z-50',
        'bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20',
        padding
      )}
    >
      <div className={cn('flex items-center', gap)}>
        {/* Mute toggle */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'rounded-full shadow-lg border-2',
            btnSize,
            isMuted
              ? 'bg-destructive/20 border-destructive text-destructive hover:bg-destructive/30'
              : 'bg-white border-transparent text-black hover:bg-white/80'
          )}
          onClick={onToggleMute}
        >
          {isMuted ? <MicOff className={iconSize} /> : <Mic className={iconSize} />}
        </Button>

        {/* End call */}
        <Button
          variant="destructive"
          size="icon"
          className={cn(
            'rounded-full shadow-lg border-4 border-destructive/50',
            endBtnSize
          )}
          onClick={onEndCall}
        >
          <PhoneOff className={endIconSize} />
        </Button>

        {/* Video toggle — only show if we have a video track */}
        {hasVideoTrack && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'rounded-full shadow-lg border-2',
              btnSize,
              isVideoOff
                ? 'bg-destructive/20 border-destructive text-destructive hover:bg-destructive/30'
                : 'bg-white border-transparent text-black hover:bg-white/80'
            )}
            onClick={onToggleVideo}
          >
            {isVideoOff ? <VideoOff className={iconSize} /> : <VideoIcon className={iconSize} />}
          </Button>
        )}
      </div>
    </div>
  );
};
