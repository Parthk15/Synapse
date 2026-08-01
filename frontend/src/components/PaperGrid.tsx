'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Paper } from '@/types';
import { fetchWithAuth } from '@/lib/api';
import { PaperCard } from './PaperCard';
import { Search, Library, RefreshCw } from 'lucide-react';

interface PaperGridProps {
  refreshTrigger: number;
  onPaperChange: () => void;
}

export function PaperGrid({ refreshTrigger, onPaperChange }: PaperGridProps) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadPapers = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/papers');
      if (res.ok) {
        const data = await res.json();
        setPapers(data);
      }
    } catch (err) {
      console.error('Error fetching papers:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPapers();
  }, [loadPapers, refreshTrigger]);

  // Polling mechanism: check paper status every 3 seconds if any paper is processing
  useEffect(() => {
    const hasProcessing = papers.some(p => p.status === 'processing' || p.status === 'uploaded');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      loadPapers();
    }, 3000);

    return () => clearInterval(interval);
  }, [papers, loadPapers]);

  const filteredPapers = papers.filter(
    p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header bar: Title, Search, Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Library className="h-5 w-5 text-indigo-400" />
            Paper Library
            <span className="text-xs font-mono text-zinc-400 font-normal bg-zinc-800/80 border border-zinc-700/60 px-2 py-0.5 rounded-full">
              {papers.length} {papers.length === 1 ? 'paper' : 'papers'}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Your uploaded research papers ready for page-aware retrieval
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search papers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500/50 focus:bg-zinc-900 focus:outline-none transition-all"
            />
          </div>

          <button
            onClick={() => {
              setIsLoading(true);
              loadPapers();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Refresh library"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid or Empty State */}
      {isLoading && papers.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-40 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 animate-pulse"
            />
          ))}
        </div>
      ) : filteredPapers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPapers.map(paper => (
            <PaperCard
              key={paper.id}
              paper={paper}
              onDeleteSuccess={() => {
                loadPapers();
                onPaperChange();
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/50 text-zinc-500 mb-3">
            <Library className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-300">
            {searchQuery ? 'No matching papers found' : 'No research papers uploaded'}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            {searchQuery
              ? 'Try searching for a different keyword or filename.'
              : 'Upload a PDF document above to begin chunking and vector embedding.'}
          </p>
        </div>
      )}
    </div>
  );
}
