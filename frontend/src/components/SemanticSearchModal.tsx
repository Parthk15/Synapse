'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchResultChunk } from '../types';
import { searchPapers } from '../lib/api';

interface SemanticSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SemanticSearchModal({ isOpen, onClose }: SemanticSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    try {
      setLoading(true);
      const data = await searchPapers(query, undefined, 8);
      setResults(data.results || []);
      setSearched(true);
    } catch (err) {
      console.error('Semantic search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChunk = (paperId: string, pageNumber: number) => {
    onClose();
    router.push(`/papers/${paperId}?page=${pageNumber}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="p-4 border-b border-slate-800 bg-slate-900 flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ideas, equations, methodologies across all research papers..."
            autoFocus
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 font-sans text-base focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-semibold"
          >
            {loading ? 'Searching...' : 'Vector Search'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2 text-lg"
          >
            ✕
          </button>
        </form>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!searched ? (
            <div className="text-center py-12 text-slate-500 text-xs space-y-2">
              <p className="text-sm font-medium text-slate-400">Semantic AI Search</p>
              <p>Type any concept or question above to perform embedding similarity search.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No relevant paper sections matched your query "{query}".
            </div>
          ) : (
            results.map((res) => (
              <div
                key={res.chunk_id}
                onClick={() => handleSelectChunk(res.paper_id, res.page_number)}
                className="p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 rounded-xl cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-sm group-hover:text-blue-300 transition-colors truncate max-w-[70%]">
                    📄 {res.paper_title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[11px] bg-slate-700 text-slate-300 rounded">
                      Page {res.page_number}
                    </span>
                    <span className="px-2 py-0.5 text-[11px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded font-medium">
                      {(res.score * 100).toFixed(0)}% Match
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed font-sans bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                  "{res.text}"
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
