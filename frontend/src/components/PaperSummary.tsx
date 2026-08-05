'use client';

import React, { useState, useEffect } from 'react';
import { PaperSummary as IPaperSummary } from '../types';
import { fetchPaperSummary } from '../lib/api';

interface PaperSummaryProps {
  paperId: string;
}

export default function PaperSummary({ paperId }: PaperSummaryProps) {
  const [summary, setSummary] = useState<IPaperSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchPaperSummary(paperId);
        setSummary(data);
      } catch (e) {
        console.error('Failed to load paper summary:', e);
      } finally {
        setLoading(false);
      }
    }
    if (paperId) load();
  }, [paperId]);

  const handleCopy = () => {
    if (!summary) return;
    const text = `Executive Summary of ${summary.title}:\n${summary.executive_summary}\n\nKey Findings:\n- ${summary.key_findings.join('\n- ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-xl">
        Generating paper insights & executive summary...
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-xl">
        Could not load paper summary.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-semibold text-slate-100 text-base flex items-center gap-2">
            <span>🧠</span> Paper Summary & Insights
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-synthesized from {summary.total_pages} pages ({summary.total_chunks} text chunks)
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-all flex items-center gap-1.5"
        >
          <span>{copied ? '✓ Copied' : '📋 Copy Summary'}</span>
        </button>
      </div>

      {/* Executive Summary */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Executive Summary</h4>
        <p className="text-sm leading-relaxed bg-slate-800/40 p-4 rounded-lg border border-slate-800 text-slate-300">
          {summary.executive_summary}
        </p>
      </div>

      {/* Methodology */}
      {summary.methodology && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Methodology</h4>
          <p className="text-xs text-slate-300 bg-slate-800/20 p-3 rounded-lg border border-slate-800">
            {summary.methodology}
          </p>
        </div>
      )}

      {/* Key Findings */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Key Findings</h4>
        <ul className="space-y-2">
          {summary.key_findings.map((item, idx) => (
            <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800/80">
              <span className="text-purple-400 font-bold">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Takeaways */}
      {summary.takeaways && summary.takeaways.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Takeaways</h4>
          <div className="flex flex-wrap gap-2">
            {summary.takeaways.map((t, idx) => (
              <span key={idx} className="text-xs bg-amber-950/30 text-amber-300 border border-amber-800/40 px-3 py-1.5 rounded-full">
                💡 {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
