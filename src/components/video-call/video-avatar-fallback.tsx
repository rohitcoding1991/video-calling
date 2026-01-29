import React from 'react';
import { VideoOff, ShieldAlert } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export type VideoOffReason =
  | 'toggled-off'
  | 'permission-denied'
  | 'no-device'
  | 'remote-off'
  | 'no-stream';

interface VideoAvatarFallbackProps {
  userName: string;
  reason: VideoOffReason;
  isMain: boolean;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const reasonConfig: Record<VideoOffReason, { icon: React.ElementType; label: string }> = {
  'toggled-off': { icon: VideoOff, label: 'Camera off' },
  'permission-denied': { icon: ShieldAlert, label: 'Camera blocked' },
  'no-device': { icon: VideoOff, label: 'No camera' },
  'remote-off': { icon: VideoOff, label: 'Camera off' },
  'no-stream': { icon: VideoOff, label: 'No video' },
};

export const VideoAvatarFallback: React.FC<VideoAvatarFallbackProps> = ({
  userName,
  reason,
  isMain,
}) => {
  const { icon: Icon, label } = reasonConfig[reason];

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Avatar
        className={cn(
          'bg-muted',
          isMain ? 'w-24 h-24 sm:w-32 sm:h-32' : 'w-10 h-10 sm:w-12 sm:h-12'
        )}
      >
        <AvatarFallback
          className={cn(
            'font-bold text-foreground',
            isMain ? 'text-lg sm:text-xl' : 'text-xs sm:text-sm'
          )}
        >
          {getInitials(userName)}
        </AvatarFallback>
      </Avatar>
      {isMain && (
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm">
          <Icon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </div>
      )}
    </div>
  );
};
