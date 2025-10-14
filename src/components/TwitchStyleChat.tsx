import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface TwitchStyleChatProps {
  groupId: string;
  isInRoom: boolean;
  onClose?: () => void;
}

const TwitchStyleChat: React.FC<TwitchStyleChatProps> = ({ groupId, isInRoom, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!groupId) return;

    fetchMessages();

    const chatChannel = supabase
      .channel(`chat-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'study_group_chat',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          
          // Fetch the profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .eq('user_id', newMsg.user_id)
            .single();

          const messageWithProfile = {
            ...newMsg,
            profiles: profile || { full_name: 'Anonymous' }
          };

          // Add the new message to the state in realtime
          setMessages(prev => [...prev, messageWithProfile]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [groupId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('study_group_chat')
      .select('id, user_id, message, created_at')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error || !data) return;

    const userIds = [...new Set(data.map(msg => msg.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    const messagesWithProfiles = data.map(msg => ({
      ...msg,
      profiles: profiles?.find(p => p.user_id === msg.user_id) || { full_name: 'Anonymous' }
    }));

    setMessages(messagesWithProfiles);
  };

  const sendMessage = async () => {
    if (!user || !newMessage.trim() || !isInRoom) return;

    const messageText = newMessage.trim();
    
    // Optimistically add message to UI immediately
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      message: messageText,
      created_at: new Date().toISOString(),
      profiles: { full_name: 'You' }
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    // Then save to database (realtime will update with the real message)
    await supabase
      .from('study_group_chat')
      .insert({
        group_id: groupId,
        user_id: user.id,
        message: messageText
      });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={cn(
      "fixed top-20 right-0 h-[calc(100vh-5rem)] w-80 bg-background border-l flex flex-col z-40 transition-transform duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "translate-x-full"
    )}>
      {/* Header */}
      <div className="bg-primary/10 border-b px-4 py-3 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-sm">Study Chat</h3>
          <p className="text-xs text-muted-foreground">
            {isInRoom ? 'Connected' : 'Join room to chat'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 -mt-1"
          onClick={() => {
            setIsOpen(false);
            setTimeout(() => onClose?.(), 300);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-2">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className={cn(
                    "text-xs font-semibold",
                    msg.user_id === user?.id ? "text-primary" : "text-foreground"
                  )}>
                    {msg.profiles?.full_name || 'Anonymous'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <p className="text-sm break-words">{msg.message}</p>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-3 bg-muted/30">
        <div className="flex gap-2">
          <Input
            placeholder={isInRoom ? "Send a message..." : "Join room to chat"}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isInRoom}
            className="flex-1 text-sm"
          />
          <Button 
            onClick={sendMessage} 
            size="icon"
            disabled={!isInRoom || !newMessage.trim()}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TwitchStyleChat;
