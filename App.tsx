import React, { useState, useRef, useEffect } from 'react';
import { AppConfig, Message, Citation, StoredConversation } from './types';
import { streamDifyMessage } from './services/difyService';
import ChatMessage from './components/ChatMessage';
import HistoryDrawer from './components/HistoryDrawer';

const LOCAL_STORAGE_KEY_HISTORY = 'dify_chat_history';
const LOCAL_STORAGE_KEY_USER_ID = 'dify_chat_user_id';

// Fixed configuration
const APP_CONFIG: AppConfig = {
  apiKey: 'app-FtKIw4FOM49BLxtC0W26J6Mn',
  baseUrl: 'https://api.dify.ai',
};

const App: React.FC = () => {
  // --- State ---
  // Initialize UserId synchronously to ensure it's available for the first request
  const [userId] = useState<string>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_USER_ID);
    if (stored) return stored;
    
    const newId = 'web-user-' + Math.floor(Math.random() * 1000000);
    localStorage.setItem(LOCAL_STORAGE_KEY_USER_ID, newId);
    return newId;
  });
  
  // UI State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  
  // History State
  const [history, setHistory] = useState<StoredConversation[]>([]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // 1. Initialize App (Load History)
  useEffect(() => {
    // History
    const savedHistory = localStorage.getItem(LOCAL_STORAGE_KEY_HISTORY);
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
      } catch (e) { console.error('Error parsing history', e); }
    }
    
    // Set initial welcome message if no chat loaded
    if (messages.length === 0) {
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: 'Hello! Start a new conversation or check history.',
            timestamp: Date.now(),
        }]);
    }
  }, []);

  // 2. Auto Scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 3. Persist History when messages or conversationId changes
  useEffect(() => {
    if (!conversationId || messages.length <= 1) return; // Don't save empty/welcome chats

    setHistory(prevHistory => {
      const existingIndex = prevHistory.findIndex(h => h.id === conversationId);
      const now = Date.now();
      
      // Determine title from first user message
      const firstUserMsg = messages.find(m => m.role === 'user');
      const title = firstUserMsg ? firstUserMsg.content.substring(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '') : 'New Conversation';

      const updatedConversation: StoredConversation = {
        id: conversationId,
        title: title,
        messages: messages,
        updatedAt: now,
      };

      let newHistory;
      if (existingIndex >= 0) {
        newHistory = [...prevHistory];
        newHistory[existingIndex] = updatedConversation;
        // Move to top
        newHistory.sort((a, b) => b.updatedAt - a.updatedAt);
      } else {
        newHistory = [updatedConversation, ...prevHistory];
      }
      
      localStorage.setItem(LOCAL_STORAGE_KEY_HISTORY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, [messages, conversationId]);

  // --- Handlers ---

  const loadConversation = (conv: StoredConversation) => {
    setConversationId(conv.id);
    setMessages(conv.messages);
    setIsHistoryOpen(false);
  };

  const startNewChat = () => {
    setConversationId(undefined);
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Started a new conversation.',
      timestamp: Date.now(),
    }]);
    setIsHistoryOpen(false);
  };

  const deleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem(LOCAL_STORAGE_KEY_HISTORY, JSON.stringify(newHistory));
    
    if (conversationId === id) {
        startNewChat();
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    const botMsgId = (Date.now() + 1).toString();
    const botMsg: Message = {
      id: botMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
    setIsLoading(true);

    await streamDifyMessage(
      userMsg.content,
      APP_CONFIG,
      conversationId,
      userId,
      // onData
      (textChunk, _msgId, convId) => {
        // IMPORTANT: Dify assigns conversation ID on the first response
        if (convId && convId !== conversationId) {
            setConversationId(convId);
        }
        
        setMessages(prev => prev.map(msg => {
          if (msg.id === botMsgId) {
            return { ...msg, content: msg.content + textChunk };
          }
          return msg;
        }));
      },
      // onCitation
      (citations: Citation[]) => {
        setMessages(prev => prev.map(msg => {
          if (msg.id === botMsgId) {
            return { ...msg, citations };
          }
          return msg;
        }));
      },
      // onComplete
      () => {
        setIsLoading(false);
        setMessages(prev => prev.map(msg => {
          if (msg.id === botMsgId) {
            return { ...msg, isStreaming: false };
          }
          return msg;
        }));
      },
      // onError
      (err) => {
        setIsLoading(false);
        setMessages(prev => prev.map(msg => {
          if (msg.id === botMsgId) {
            return { ...msg, content: msg.content + `\n\n[Error: ${err}]`, isStreaming: false };
          }
          return msg;
        }));
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] max-w-md mx-auto bg-wechat-bg shadow-2xl overflow-hidden relative">
      
      {/* Header */}
      <div className="bg-gray-100 border-b border-gray-200 h-14 flex items-center justify-between px-4 sticky top-0 z-10 shrink-0">
        
        {/* Left: History Toggle */}
        <div className="flex items-center space-x-2">
            <button 
                onClick={() => setIsHistoryOpen(true)}
                className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                title="History"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h1 className="font-semibold text-gray-800">DPM</h1>
        </div>

        {/* Right: New Chat */}
        <div className="flex items-center space-x-1">
            <button 
                onClick={startNewChat}
                className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                title="New Chat"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
            </button>
        </div>
      </div>

      {/* Message Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 no-scrollbar"
      >
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-gray-100 px-4 py-3 border-t border-gray-200 sticky bottom-0 shrink-0 safe-area-padding">
        <div className="flex items-end space-x-2 bg-white rounded-xl p-2 shadow-sm">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 max-h-32 min-h-[40px] bg-transparent border-none focus:ring-0 resize-none py-2 px-1 text-sm text-gray-800 placeholder-gray-400 no-scrollbar"
            rows={1}
            style={{ height: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
              input.trim() 
                ? 'bg-wechat-green text-white hover:bg-green-600' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
               <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            )}
          </button>
        </div>
        <div className="text-center mt-2">
            <span className="text-[10px] text-gray-400">Powered by GYL</span>
        </div>
      </div>

      {/* Drawers */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        conversations={history}
        activeConversationId={conversationId}
        onSelectConversation={loadConversation}
        onDeleteConversation={deleteConversation}
        onNewChat={startNewChat}
      />
    </div>
  );
};

export default App;