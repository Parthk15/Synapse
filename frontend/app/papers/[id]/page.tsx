'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import PaperChat from '@/components/PaperChat';
import PaperNotes from '@/components/PaperNotes';
import PaperSummary from '@/components/PaperSummary';
import StatusBadge from '@/components/StatusBadge';
import { PaperDetail } from '@/types';
import { fetchWithAuth, getPaperPdfUrl } from '@/lib/api';


export default function PaperDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const paperId = params.id as string;
  const initialPage = searchParams.get('page');

  const [paper, setPaper] = useState<PaperDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'summary' | 'notes'>('chat');
  const [viewMode, setViewMode] = useState<'pdf' | 'text'>('pdf');

  useEffect(() => {
    async function loadPaper() {
      try {
        setLoading(true);
        const res = await fetchWithAuth(`/papers/${paperId}`);
        if (!res.ok) throw new Error('Paper not found');
        const data = await res.json();
        setPaper(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load paper details');
      } finally {
        setLoading(false);
      }
    }

    if (paperId) {
      loadPaper();
    }
  }, [paperId]);

  const pdfUrl = paper ? getPaperPdfUrl(paper.id) : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6 text-slate-400 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading paper workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-slate-200">Paper Not Found</h2>
          <p className="text-sm text-slate-400 max-w-md">{error}</p>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            ← Return to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col h-screen overflow-hidden">
      <Header />

      {/* Sub-Header Bar */}
      <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center space-x-4 min-w-0">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-medium shrink-0"
          >
            <span>←</span> Library
          </Link>
          <div className="h-4 w-px bg-slate-800 shrink-0" />
          <h1 className="text-base font-bold text-slate-100 truncate" title={paper.title}>
            {paper.title}
          </h1>
          <StatusBadge status={paper.status} />
        </div>

        {/* Action Tabs */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="bg-slate-800 p-1 rounded-lg flex space-x-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🤖 AI Chat
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'summary'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🧠 Summary
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'notes'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📝 Notes
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Split View */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left Column: PDF Preview / Document Pane */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>📄 Document Viewer</span>
              <span className="text-slate-600">•</span>
              <span>{paper.page_count} Pages</span>
              <span className="text-slate-600">•</span>
              <span>{paper.chunks_count} Text Chunks</span>
              {initialPage && (
                <span className="px-2 py-0.5 bg-blue-900/60 text-blue-300 rounded font-medium">
                  Jump to Page {initialPage}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 bg-slate-950 relative overflow-hidden">
            <iframe
              src={pdfUrl}
              className="w-full h-full border-none"
              title={paper.title}
            />
          </div>
        </div>

        {/* Right Column: AI Assistant / Summary / Notes Side Panel */}
        <div className="w-[450px] shrink-0 flex flex-col h-full overflow-hidden">
          {activeTab === 'chat' && (
            <PaperChat paperId={paper.id} paperTitle={paper.title} />
          )}
          {activeTab === 'summary' && (
            <div className="h-full overflow-y-auto pr-1">
              <PaperSummary paperId={paper.id} />
            </div>
          )}
          {activeTab === 'notes' && (
            <PaperNotes paperId={paper.id} />
          )}
        </div>
      </div>
    </div>
  );
}
