import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { X, Send, MessageSquare } from 'lucide-react';

interface GlobalChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalChatDrawer: React.FC<GlobalChatDrawerProps> = ({ isOpen, onClose }) => {
  const { cultivator, chatMessages, sendChatMessage } = useGame();
  const [activeChannel, setActiveChannel] = useState<'global' | 'sect'>('global');
  const [inputMessage, setInputMessage] = useState('');

  if (!isOpen || !cultivator) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendChatMessage(inputMessage.trim(), activeChannel);
    setInputMessage('');
  };

  const filteredMessages = chatMessages.filter((msg) =>
    activeChannel === 'global' ? true : msg.channel === 'sect'
  );

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-stone-900 border-l border-stone-800 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <h3 className="font-cinzel text-sm font-bold text-amber-100">
            Canal de Transmisión del Jianghu
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Channel Selector */}
      <div className="flex border-b border-stone-800 bg-stone-950/60 text-xs font-medium">
        <button
          onClick={() => setActiveChannel('global')}
          className={`flex-1 py-2.5 text-center transition-colors cursor-pointer ${
            activeChannel === 'global'
              ? 'text-amber-300 font-semibold border-b-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Mundo Jianghu
        </button>
        <button
          onClick={() => setActiveChannel('sect')}
          className={`flex-1 py-2.5 text-center transition-colors cursor-pointer ${
            activeChannel === 'sect'
              ? 'text-amber-300 font-semibold border-b-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Canal de Secta
        </button>
      </div>

      {/* Message Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
        {filteredMessages.length === 0 ? (
          <div className="text-center text-stone-500 py-8">
            El río de Qi fluye en silencio. Envía un mensaje a los cultivadores del reino.
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg border text-xs ${
                msg.senderId === cultivator.id
                  ? 'bg-amber-950/30 border-amber-600/30 ml-4'
                  : 'bg-stone-950/80 border-stone-800 mr-4'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1">
                <span className="font-semibold text-amber-300">
                  {msg.senderName} ({msg.realm})
                </span>
                <span className="text-stone-500 font-mono">{msg.sectName}</span>
              </div>
              <p className="text-stone-200 break-words leading-relaxed">{msg.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-stone-800 bg-stone-950/90 flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Escribe en el canal ${activeChannel === 'global' ? 'Jianghu' : 'de tu Secta'}...`}
          maxLength={140}
          className="flex-1 px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim()}
          className="px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 font-bold rounded-lg cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
