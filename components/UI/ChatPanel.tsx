'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { generateRandomName } from '@/lib/nameGenerator';
import { X, Send, RotateCw, Users } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  text: string;
  color: string;
  timestamp: string;
  isSystem?: boolean;
  isSelf?: boolean;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isNight: boolean;
}

// Generate a deterministic color based on name hash
const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
  ];
  return colors[Math.abs(hash) % colors.length];
};

export default function ChatPanel({ isOpen, onClose, isNight }: ChatPanelProps) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // User identity
  const [userToken, setUserToken] = useState('');
  const [anonymousName, setAnonymousName] = useState('');
  const [avatarColor, setAvatarColor] = useState('');

  // Messages and Input
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [onlineCount, setOnlineCount] = useState(1);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Refs for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Auto-scroll messages list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // 1. Initialize user token and random name
  useEffect(() => {
    // Generate or fetch userToken from localStorage
    let token = localStorage.getItem('morrow_chat_token');
    if (!token) {
      token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('morrow_chat_token', token);
    }
    setUserToken(token);

    // Generate or fetch name
    let name = localStorage.getItem('morrow_chat_name');
    if (!name) {
      name = generateRandomName(isNight);
      localStorage.setItem('morrow_chat_name', name);
    }
    setAnonymousName(name);
    setAvatarColor(getAvatarColor(name));
  }, [isNight]);

  // 2. Handle Joining Room (only called when drawer is open)
  const joinRoom = async (tokenToUse?: string) => {
    const activeToken = tokenToUse || userToken;
    if (!activeToken) return;

    try {
      setLoading(true);
      setErrorMsg(null);

      const response = await fetch('/api/chat/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userToken: activeToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to join chat room');
      }

      const data = await response.json();
      setRoomId(data.roomId);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error connecting to chat server');
    } finally {
      setLoading(false);
    }
  };

  // Trigger joinRoom or cleanup based on isOpen
  useEffect(() => {
    if (isOpen && userToken) {
      joinRoom();
    } else if (!isOpen) {
      // Clean up when chat is closed
      setRoomId(null);
      setMessages([]);
      setErrorMsg(null);
      setLoading(false);
    }
  }, [isOpen, userToken]);

  // 3. Heartbeat (Ping) Setup
  useEffect(() => {
    if (!roomId || !userToken || !isOpen) return;

    const pingServer = () => {
      fetch('/api/chat/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userToken, roomId }),
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.reJoinRequired) {
          console.warn('Chat session expired on server. Re-joining...');
          joinRoom();
        }
      })
      .catch((err) => console.error('Chat heartbeat ping failed:', err));
    };

    // Ping every 25 seconds
    const interval = setInterval(pingServer, 25000);
    return () => clearInterval(interval);
  }, [roomId, userToken, isOpen]);

  // 4. Leave Room Cleanup on Unload/Unmount or when closing
  useEffect(() => {
    if (!userToken) return;

    const leaveServer = () => {
      const blob = new Blob([JSON.stringify({ userToken })], { type: 'application/json' });
      navigator.sendBeacon('/api/chat/leave', blob);
    };

    window.addEventListener('beforeunload', leaveServer);

    return () => {
      window.removeEventListener('beforeunload', leaveServer);
      // Fallback API call on unmount/close
      if (roomId) {
        fetch('/api/chat/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userToken }),
        }).catch((err) => console.error('Leave room request failed on unmount:', err));
      }
    };
  }, [userToken, roomId]);

  // Handle leave when explicitly closing
  useEffect(() => {
    if (!isOpen && userToken && roomId) {
      fetch('/api/chat/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userToken }),
      }).catch((err) => console.error('Leave room request failed on close:', err));
    }
  }, [isOpen, userToken]);

  // 5. Connect and Subscribe to Supabase Realtime Broadcast & Presence
  useEffect(() => {
    if (!roomId || !userToken || !anonymousName || !isOpen) return;

    setIsSubscribing(true);

    // Create channel
    const channel = supabase.channel(`chat_room:${roomId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: userToken },
      },
    });

    channelRef.current = channel;

    // Listen to messages broadcast by others
    channel.on('broadcast', { event: 'message' }, ({ payload }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: payload.id,
          sender: payload.sender,
          text: payload.text,
          color: payload.color,
          timestamp: payload.timestamp,
          isSelf: false,
        },
      ]);
    });

    // Listen to presence events (sync, join, leave)
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Count unique users in the room
        const activeUsersCount = Object.keys(state).length;
        setOnlineCount(activeUsersCount > 0 ? activeUsersCount : 1);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Broadcast system join notification (only if it's not ourselves)
        if (key !== userToken) {
          newPresences.forEach((p: any) => {
            setMessages((prev) => [
              ...prev,
              {
                id: `system-join-${p.name}-${Date.now()}`,
                sender: 'System',
                text: `${p.name} joined the room`,
                color: '#888888',
                timestamp: new Date().toISOString(),
                isSystem: true,
              },
            ]);
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Broadcast system leave notification
        if (key !== userToken) {
          leftPresences.forEach((p: any) => {
            setMessages((prev) => [
              ...prev,
              {
                id: `system-leave-${p.name}-${Date.now()}`,
                sender: 'System',
                text: `${p.name} left the room`,
                color: '#888888',
                timestamp: new Date().toISOString(),
                isSystem: true,
              },
            ]);
          });
        }
      });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsSubscribing(false);
        // Track the user
        await channel.track({
          name: anonymousName,
          color: avatarColor,
          joinedAt: new Date().toISOString(),
        });
      }
    });

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
      channelRef.current = null;
    };
  }, [roomId, userToken, anonymousName, avatarColor, isOpen]);

  // 6. Send Message Action
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !channelRef.current || loading) return;

    const textToSend = inputText.trim().substring(0, 150);
    const messageId = Math.random().toString(36).substring(2, 9) + Date.now();
    const timestamp = new Date().toISOString();

    // Broadcast message to others
    channelRef.current.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        id: messageId,
        sender: anonymousName,
        text: textToSend,
        color: avatarColor,
        timestamp,
      },
    });

    // Add locally immediately (for instant responsiveness)
    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        sender: anonymousName,
        text: textToSend,
        color: avatarColor,
        timestamp,
        isSelf: true,
      },
    ]);

    setInputText('');
  };

  // 7. Reroll Anonymous Name
  const handleRerollName = async () => {
    if (loading) return;
    const newName = generateRandomName(isNight);
    setAnonymousName(newName);
    setAvatarColor(getAvatarColor(newName));
    localStorage.setItem('morrow_chat_name', newName);

    // Re-track our status on the channel with the new name
    if (channelRef.current) {
      await channelRef.current.track({
        name: newName,
        color: getAvatarColor(newName),
        joinedAt: new Date().toISOString(),
      });
    }
  };

  // Format message time (e.g. 11:34 PM)
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {
      return '';
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-screen w-full sm:w-[400px] z-[2000] flex flex-col border-l backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-out transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
      } ${
        isNight
          ? 'bg-[#0b0f19]/80 border-white/10 text-[#eae6db]'
          : 'bg-white/80 border-black/10 text-[#4a3e2e]'
      }`}
    >
      {/* Panel Header */}
      <div className={`p-4 flex items-center justify-between border-b ${isNight ? 'border-white/10' : 'border-black/10'}`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${roomId ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
            <h2 className="text-lg font-bold font-mono tracking-tight">
              Live Chat {roomId ? `#${roomId.slice(0, 4)}` : ''}
            </h2>
          </div>
          {roomId && (
            <div className="flex items-center gap-1.5 mt-0.5 text-xs opacity-75 font-mono">
              <Users className="h-3.5 w-3.5" />
              <span>{onlineCount} traveler{onlineCount !== 1 ? 's' : ''} online</span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-full transition-colors ${
            isNight ? 'hover:bg-white/10 text-[#eae6db]' : 'hover:bg-black/5 text-[#4a3e2e]'
          }`}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* User Name Bar */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between border-b text-xs font-mono select-none ${
          isNight ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
        }`}
      >
        <span className="opacity-70">Chatting as:</span>
        <div className="flex items-center gap-1.5 font-bold">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: avatarColor }}
          />
          <span className={isNight ? 'text-[#e3d3b4]' : 'text-[#c9a96e]'}>{anonymousName}</span>
          <button
            onClick={handleRerollName}
            className={`p-1 rounded-md transition-colors ${
              isNight ? 'hover:bg-white/10 text-white/70 hover:text-white' : 'hover:bg-black/10 text-black/60 hover:text-black'
            }`}
            title="Change nickname"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 flex flex-col justify-start">
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <div className={`w-8 h-8 border-3 rounded-full animate-spin ${isNight ? 'border-[#e3d3b4] border-t-transparent' : 'border-[#c9a96e] border-t-transparent'}`} />
            <span className="text-xs font-mono opacity-70 animate-pulse">Entering chatroom...</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <span className="text-red-500 font-mono text-sm mb-3">⚠️ {errorMsg}</span>
            <button
              onClick={() => joinRoom()}
              className="px-4 py-2 bg-[#c9a96e] text-[#fbf9f4] font-mono text-xs uppercase tracking-wider rounded-full hover:bg-[#b8985c] active:scale-[0.98] transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !errorMsg && (
          <>
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 p-4 font-mono text-xs select-none">
                <span>Room is quiet.</span>
                <span className="mt-1">Be the first to speak anonymously under the same skies.</span>
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.isSystem) {
                  return (
                    <div
                      key={msg.id}
                      className={`text-center font-mono text-[10px] italic py-1 my-1 px-4 leading-normal select-none rounded-full self-center ${
                        isNight ? 'text-[#a1a1aa]/60 bg-white/5' : 'text-[#7d6c56]/60 bg-black/5'
                      }`}
                    >
                      {msg.text}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'} space-y-1 animate-fade-in-slide-up`}
                  >
                    {!msg.isSelf && (
                      <div className="flex items-center gap-1.5 ml-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: msg.color }}
                        />
                        <span className="text-[10px] font-mono font-bold opacity-75">{msg.sender}</span>
                      </div>
                    )}
                    <div
                      className={`px-4 py-2.5 rounded-2xl max-w-[85%] break-words font-mono text-xs shadow-sm leading-relaxed ${
                        msg.isSelf
                          ? 'bg-[#c9a96e] text-white rounded-tr-none'
                          : isNight
                          ? 'bg-white/5 border border-white/5 text-[#eae6db] rounded-tl-none'
                          : 'bg-white/60 border border-black/5 text-[#4a3e2e] rounded-tl-none'
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                    <span className="text-[9px] font-mono opacity-50 px-1 select-none">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className={`p-4 border-t ${isNight ? 'border-white/10' : 'border-black/10 bg-white/20'}`}
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value.substring(0, 150))}
            placeholder={roomId ? "Share your thoughts anonymously..." : "Connecting..."}
            disabled={!roomId || loading}
            maxLength={150}
            className={`w-full font-mono text-xs pl-4 pr-12 py-3.5 rounded-full border focus:outline-none focus:ring-2 focus:ring-[#c9a96e] transition-all ${
              isNight
                ? 'bg-white/5 border-white/10 text-white placeholder-white/40'
                : 'bg-white border-black/10 text-[#4a3e2e] placeholder-black/40'
            }`}
          />
          <button
            type="submit"
            disabled={!roomId || !inputText.trim() || loading}
            className={`absolute right-1.5 p-2 rounded-full transition-all ${
              inputText.trim() && roomId && !loading
                ? 'bg-[#c9a96e] text-white hover:scale-105 active:scale-95'
                : 'text-gray-400 opacity-50 pointer-events-none'
            }`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-between items-center mt-2 px-1 text-[10px] font-mono opacity-50 select-none">
          <span>Max 150 characters</span>
          <span>{inputText.length}/150</span>
        </div>
      </form>
    </div>
  );
}
