import { useSocket } from "@/context/socket-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Video, Phone, LogOut } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWebRTC } from "@/hooks/use-webrtc";
import { useRingtone } from "@/hooks/use-ringtone";
import { VideoContainer } from "@/components/video-call/video-container";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function HomePage() {
  const { currentUser, onlineUsers, socket, logout } = useSocket();
  const {
    startCall,
    answerCall,
    endCall,
    declineCall,
    toggleLocalVideo,
    switchCall,
    dismissWaitingCall,
    localStream,
    remoteStream,
    incomingCall,
    waitingCall,
    isCallActive,
    connectedUserName,
    isLocalVideoEnabled,
    isRemoteVideoEnabled,
    cameraPermission,
  } = useWebRTC({
    socket,
    currentUser,
  });

  useRingtone(!!incomingCall || !!waitingCall);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const otherUsers = onlineUsers.filter((u) => u.id !== currentUser?.id);

  if (isCallActive) {
    return (
      <VideoContainer
        localStream={localStream}
        remoteStream={remoteStream}
        remoteUserName={
          connectedUserName || incomingCall?.name || "Remote User"
        }
        isLocalVideoEnabled={isLocalVideoEnabled}
        isRemoteVideoEnabled={isRemoteVideoEnabled}
        cameraPermission={cameraPermission}
        onEndCall={endCall}
        onToggleVideo={toggleLocalVideo}
        waitingCall={waitingCall}
        onSwitchCall={switchCall}
        onDismissWaitingCall={dismissWaitingCall}
      />
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl min-h-screen bg-background">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Video Calling App</h1>
          <p className="text-muted-foreground">
            Logged in as {currentUser?.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-12 w-12 cursor-pointer">
                <AvatarImage src="" />
                <AvatarFallback>
                  {currentUser ? getInitials(currentUser.name) : "?"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{currentUser?.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Online Users ({otherUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {otherUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No other users online.
            </p>
          ) : (
            otherUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.name}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    title="Audio Call"
                    onClick={() => startCall(user.id, user.name, false)}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    title="Video Call"
                    onClick={() => startCall(user.id, user.name, true)}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Incoming Call Dialog */}
      <AlertDialog open={!!incomingCall}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Incoming {incomingCall?.isVideo ? "Video" : "Audio"} Call
            </AlertDialogTitle>
            <AlertDialogDescription>
              {incomingCall?.name} is calling you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={declineCall}>Decline</AlertDialogCancel>
            <AlertDialogAction onClick={answerCall}>Accept</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
