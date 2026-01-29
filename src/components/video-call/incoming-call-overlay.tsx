import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface IncomingCallOverlayProps {
  callerName: string;
  isVideo: boolean;
  onSwitch: () => void;
  onDismiss: () => void;
}

export const IncomingCallOverlay: React.FC<IncomingCallOverlayProps> = ({
  callerName,
  isVideo,
  onSwitch,
  onDismiss,
}) => {
  return (
    <div
      className={cn(
        'absolute top-4 left-1/2 -translate-x-1/2 z-[60]',
        'bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-2xl',
        'px-5 py-4 flex items-center gap-4',
        'animate-in slide-in-from-top-5 duration-300',
        'max-w-[90vw] w-auto'
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isVideo ? (
          <Video className="h-5 w-5 text-primary shrink-0" />
        ) : (
          <Phone className="h-5 w-5 text-primary shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-card-foreground truncate">
            {callerName}
          </p>
          <p className="text-xs text-muted-foreground">
            Incoming {isVideo ? 'video' : 'audio'} call
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="destructive"
          onClick={onDismiss}
          className="gap-1.5"
        >
          <PhoneOff className="h-3.5 w-3.5" />
          Dismiss
        </Button>
        <Button
          size="sm"
          onClick={onSwitch}
          className="gap-1.5"
        >
          <Phone className="h-3.5 w-3.5" />
          Switch
        </Button>
      </div>
    </div>
  );
};
