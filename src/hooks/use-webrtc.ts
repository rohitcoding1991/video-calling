import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useMediaPermissions } from '@/hooks/use-media-permissions';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
};

interface UseWebRTCProps {
  socket: Socket | null;
  currentUser: { id: string; name: string } | null;
  onCallEnded?: () => void;
}

interface IncomingCall {
  from: string;
  name: string;
  signal: RTCSessionDescriptionInit;
  isVideo: boolean;
}

export const useWebRTC = ({ socket, currentUser, onCallEnded }: UseWebRTCProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const isCallActiveRef = useRef(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [waitingCall, setWaitingCall] = useState<IncomingCall | null>(null);
  const waitingCallRef = useRef<IncomingCall | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'receiving' | 'connected'>('idle');
  const [connectedUserName, setConnectedUserName] = useState<string>('');
  const [isLocalVideoEnabled, setIsLocalVideoEnabled] = useState(false);
  const [isRemoteVideoEnabled, setIsRemoteVideoEnabled] = useState(false);

  const isLocalVideoEnabledRef = useRef(false);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const otherUserIdRef = useRef<string | null>(null);

  const { requestMediaWithFallback, cameraPermission } = useMediaPermissions();

  // Helper to set stream state and ref
  const updateLocalStream = (stream: MediaStream | null) => {
    setLocalStream(stream);
    localStreamRef.current = stream;
  };

  const updateLocalVideoEnabled = (enabled: boolean) => {
    setIsLocalVideoEnabled(enabled);
    isLocalVideoEnabledRef.current = enabled;
  };

  const updateIsCallActive = (active: boolean) => {
    setIsCallActive(active);
    isCallActiveRef.current = active;
  };

  const updateWaitingCall = (call: IncomingCall | null) => {
    setWaitingCall(call);
    waitingCallRef.current = call;
  };

  // Initialize Peer Connection
  const createPeer = useCallback(() => {
    if (peerRef.current) return peerRef.current;

    const peer = new RTCPeerConnection(ICE_SERVERS);

    peer.onicecandidate = (event) => {
      if (event.candidate && socket && otherUserIdRef.current) {
        socket.emit('ice-candidate', {
          to: otherUserIdRef.current,
          candidate: event.candidate,
        });
      }
    };

    peer.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peerRef.current = peer;
    return peer;
  }, [socket]);

  // Start Call (Caller)
  const startCall = async (userToCallId: string, userToCallName: string, isVideo: boolean = true) => {
    if (!socket || !currentUser) return;

    otherUserIdRef.current = userToCallId;
    setConnectedUserName(userToCallName);
    setCallStatus('calling');
    updateIsCallActive(true);
    // Assume remote has video on for video calls until told otherwise
    setIsRemoteVideoEnabled(isVideo);

    try {
      const { stream, videoEnabled } = await requestMediaWithFallback(isVideo);

      if (!stream) {
        // No media at all — abort call
        cleanupCall();
        return;
      }

      updateLocalStream(stream);
      updateLocalVideoEnabled(videoEnabled);

      const peer = createPeer();
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit('call-user', {
        userToCall: userToCallId,
        signalData: offer,
        from: { id: currentUser.id, name: currentUser.name },
        isVideo,
      });
    } catch (err) {
      console.error("Failed to start call:", err);
      endCall();
    }
  };

  // Answer Call (Callee)
  const answerCall = async () => {
    if (!socket || !incomingCall) return;

    setCallStatus('connected');
    otherUserIdRef.current = incomingCall.from;
    setConnectedUserName(incomingCall.name);
    updateIsCallActive(true);
    // Assume remote has video on for video calls until told otherwise
    setIsRemoteVideoEnabled(incomingCall.isVideo);

    try {
      const { stream, videoEnabled } = await requestMediaWithFallback(incomingCall.isVideo);

      if (!stream) {
        cleanupCall();
        return;
      }

      updateLocalStream(stream);
      updateLocalVideoEnabled(videoEnabled);

      const peer = createPeer();
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit('make-answer', {
        signal: answer,
        to: incomingCall.from,
      });

      // Notify peer of our initial video state
      socket.emit('media-state-changed', {
        to: incomingCall.from,
        videoEnabled,
      });

      setIncomingCall(null);
    } catch (err) {
      console.error("Failed to answer call:", err);
      endCall();
    }
  };

  // Toggle local video on/off mid-call
  const toggleLocalVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) return;

    const newEnabled = !isLocalVideoEnabledRef.current;
    videoTracks.forEach((track) => {
      track.enabled = newEnabled;
    });
    updateLocalVideoEnabled(newEnabled);

    // Notify remote peer
    if (socket && otherUserIdRef.current) {
      socket.emit('media-state-changed', {
        to: otherUserIdRef.current,
        videoEnabled: newEnabled,
      });
    }
  }, [socket]);

  const endCall = () => {
    if (socket && otherUserIdRef.current) {
      socket.emit('end-call', { to: otherUserIdRef.current });
    }

    cleanupCall();
  };

  const declineCall = () => {
    if (socket && incomingCall) {
      socket.emit('end-call', { to: incomingCall.from });
    }
    setIncomingCall(null);
    setCallStatus('idle');
  };

  const cleanupCall = (preserveWaiting = false) => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      updateLocalStream(null);
    }

    setRemoteStream(null);
    updateIsCallActive(false);
    setCallStatus('idle');
    setIncomingCall(null);
    otherUserIdRef.current = null;
    setConnectedUserName('');
    updateLocalVideoEnabled(false);
    setIsRemoteVideoEnabled(false);

    if (!preserveWaiting) {
      updateWaitingCall(null);
    }

    if (onCallEnded) onCallEnded();
  };

  const switchCall = async () => {
    const saved = waitingCallRef.current;
    if (!socket || !saved) return;

    // End current call
    if (otherUserIdRef.current) {
      socket.emit('end-call', { to: otherUserIdRef.current });
    }
    cleanupCall(true);

    // Now answer the waiting call
    setCallStatus('connected');
    otherUserIdRef.current = saved.from;
    setConnectedUserName(saved.name);
    updateIsCallActive(true);
    setIsRemoteVideoEnabled(saved.isVideo);
    updateWaitingCall(null);

    try {
      const { stream, videoEnabled } = await requestMediaWithFallback(saved.isVideo);

      if (!stream) {
        cleanupCall();
        return;
      }

      updateLocalStream(stream);
      updateLocalVideoEnabled(videoEnabled);

      const peer = createPeer();
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      await peer.setRemoteDescription(new RTCSessionDescription(saved.signal));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit('make-answer', {
        signal: answer,
        to: saved.from,
      });

      socket.emit('media-state-changed', {
        to: saved.from,
        videoEnabled,
      });
    } catch (err) {
      console.error('Failed to switch call:', err);
      endCall();
    }
  };

  const dismissWaitingCall = () => {
    const waiting = waitingCallRef.current;
    if (socket && waiting) {
      socket.emit('end-call', { to: waiting.from });
    }
    updateWaitingCall(null);
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('call-made', ({ signal, from, isVideo }) => {
      const call: IncomingCall = { from: from.id, name: from.name, signal, isVideo: isVideo ?? true };
      if (isCallActiveRef.current) {
        // Already in a call — route to waiting call
        updateWaitingCall(call);
      } else {
        setIncomingCall(call);
        setCallStatus('receiving');
      }
    });

    socket.on('answer-made', async ({ signal }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        setCallStatus('connected');
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (peerRef.current) {
        try {
          await peerRef.current.addIceCandidate(candidate);
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      }
    });

    socket.on('call-ended', ({ from }: { from: string }) => {
      // If the ended call is from the waiting caller, just clear waiting state
      if (waitingCallRef.current && waitingCallRef.current.from === from) {
        updateWaitingCall(null);
        return;
      }

      // If active peer ended but a waiting call exists, transition it to incomingCall
      const pending = waitingCallRef.current;
      if (pending) {
        cleanupCall(true);
        setIncomingCall(pending);
        setCallStatus('receiving');
        updateWaitingCall(null);
        return;
      }

      cleanupCall();
    });

    socket.on('media-state-changed', ({ videoEnabled }: { from: string; videoEnabled: boolean }) => {
      setIsRemoteVideoEnabled(videoEnabled);
    });

    return () => {
      socket.off('call-made');
      socket.off('answer-made');
      socket.off('ice-candidate');
      socket.off('call-ended');
      socket.off('media-state-changed');
    };
  }, [socket, createPeer, onCallEnded]);

  return {
    startCall,
    answerCall,
    endCall,
    declineCall,
    toggleLocalVideo,
    switchCall,
    dismissWaitingCall,
    localStream,
    remoteStream,
    callStatus,
    incomingCall,
    waitingCall,
    isCallActive,
    connectedUserName,
    isLocalVideoEnabled,
    isRemoteVideoEnabled,
    cameraPermission,
  };
};
