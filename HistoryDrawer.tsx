import React from 'react';
import { StoredConversation } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: StoredConversation[];
  activeConversationId: string | undefined;
  onSelectConversation: (conversation: StoredConversation) => void;
  onDeleteConversation: (e: React.MouseEvent, id: string) => void;
  onNewChat: () => void;
}

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
}) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">History</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 bg-wechat-green text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span className="font-medium text-sm">New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          {conversations.length === 0 ? (
            <div className="text-center text-gray-400 text-sm mt-10">
              No history yet.
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                    onSelectConversation(conv);
                    onClose();
                }}
                className={`group relative p-3 rounded-lg cursor-pointer transition-colors border ${
                  activeConversationId === conv.id
                    ? 'bg-white border-green-500 shadow-sm'
                    : 'bg-white border-gray-100 hover:bg-gray-100 hover:border-gray-200'
                }`}
              >
                <h3 className="text-sm font-medium text-gray-800 truncate pr-6">
                  {conv.title || 'New Conversation'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(conv.updatedAt).toLocaleDateString()} {new Date(conv.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>

                <button
                  onClick={(e) => onDeleteConversation(e, conv.id)}
                  className="absolute right-2 top-3 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default HistoryDrawer;