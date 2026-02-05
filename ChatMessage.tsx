import React from 'react';
import { Message } from '../types';
import CitationBlock from './CitationBlock';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-9 w-9 rounded-md flex items-center justify-center text-white text-sm font-bold shadow-sm ${isUser ? 'bg-green-500 ml-2' : 'bg-blue-500 mr-2'}`}>
          {isUser ? 'Me' : 'AI'}
        </div>

        {/* Bubble */}
        <div
          className={`relative px-4 py-2.5 rounded-lg shadow-sm text-[15px] leading-6 break-words whitespace-pre-wrap ${
            isUser
              ? 'bg-msg-user text-black rounded-tr-none'
              : 'bg-msg-bot text-gray-800 rounded-tl-none'
          }`}
        >
          {message.content}
          
          {/* Citations for Assistant */}
          {!isUser && message.citations && (
            <CitationBlock citations={message.citations} />
          )}

          {/* Streaming Cursor */}
          {!isUser && message.isStreaming && (
             <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-gray-400 animate-pulse"></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;