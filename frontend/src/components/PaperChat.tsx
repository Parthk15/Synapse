'use client';

import React, { useState } from 'react';
import { ChatMessage, CitationSource } from '../types';
import { chatWithPaper } from '../lib/api';

interface PaperChatProps {
  paperId?: string;
  paperTitle?: string;
}

export default function PaperChat({ paperId, paperTitle }: PaperChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I am your AI Research Assistant. Ask me anything about ${paperTitle ? `"${paperTitle}"` : 'your research paper library'}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState<CitationSource | null>(null);

  const suggestedQuestions = [
    'What is the core contribution of this paper?',
    'Summarize the methodology used.',
    'What are the key results and findings?',
  ];

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== '1')
        .map((m) => ({ role: m.role, content: m.content }));

      const data = await chatWithPaper(queryText, paperId, history);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        citations: data.citations || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚠️ Failed to generate AI response. Please verify backend connection and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-semibold text-slate-100 text-sm">AI Research Assistant</h3>
        </div>
        {paperTitle && (
          <span className="text-xs text-slate-400 truncate max-w-[200px]" title={paperTitle}>
            📄 {paperTitle}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-700/60">
                  <div className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1">
                    <span>📌</span> Verified Citations ({msg.citations.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.citations.map((cite, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveCitation(cite)}
                        className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-blue-300 rounded border border-blue-500/30 transition-colors flex items-center gap-1"
                      >
                        <span>Page {cite.page_number}</span>
                        <span className="text-slate-400">({(cite.relevance_score * 100).toFixed(0)}%)</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs py-2 px-3 bg-slate-800/40 rounded-lg w-fit">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
            <span>Analyzing research text...</span>
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      {messages.length < 3 && (
        <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-900/40 flex flex-wrap gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-blue-900/40 text-slate-300 hover:text-blue-300 rounded-full border border-slate-700 hover:border-blue-500/40 transition-all text-left truncate max-w-full"
            >
              ✨ {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 border-t border-slate-800 bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about equations, findings, methodology..."
            disabled={loading}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg font-medium text-sm transition-all shadow-md flex items-center justify-center min-w-[70px]"
          >
            Send
          </button>
        </form>
      </div>

      {/* Citation Preview Modal */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-semibold text-slate-100 text-base flex items-center gap-2">
                <span>📌</span> Citation Snippet
              </h4>
              <button
                onClick={() => setActiveCitation(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-blue-400 font-medium">
              Page {activeCitation.page_number} • Chunk #{activeCitation.chunk_index} • Relevance Score: {(activeCitation.relevance_score * 100).toFixed(1)}%
            </div>
            <div className="p-3 bg-slate-800/80 rounded-lg text-slate-200 text-sm leading-relaxed font-mono border border-slate-700/50 max-h-60 overflow-y-auto">
              "{activeCitation.text_snippet}"
            </div>
            <div className="text-right">
              <button
                onClick={() => setActiveCitation(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
