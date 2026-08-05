'use client';

import React, { useState, useEffect } from 'react';
import { PaperNote } from '../types';
import { fetchPaperNotes, createPaperNote, deletePaperNote } from '../lib/api';

interface PaperNotesProps {
  paperId: string;
}

export default function PaperNotes({ paperId }: PaperNotesProps) {
  const [notes, setNotes] = useState<PaperNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [pageNumber, setPageNumber] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await fetchPaperNotes(paperId);
      setNotes(data);
    } catch (err: any) {
      setError('Could not load notes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paperId) {
      loadNotes();
    }
  }, [paperId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    try {
      setSubmitting(true);
      const newNote = await createPaperNote(
        paperId,
        content,
        pageNumber !== '' ? Number(pageNumber) : undefined
      );
      setNotes((prev) => [newNote, ...prev]);
      setContent('');
      setPageNumber('');
    } catch (err) {
      setError('Failed to save note.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await deletePaperNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      setError('Failed to delete note.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
          <span>📝</span> Research Notes & Annotations ({notes.length})
        </h3>
      </div>

      {/* Note Creation Form */}
      <form onSubmit={handleAddNote} className="p-4 border-b border-slate-800 bg-slate-900/40 space-y-3">
        {error && <div className="text-xs text-red-400">{error}</div>}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your observations, questions, or key takeaways..."
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Page #:</span>
            <input
              type="number"
              min={1}
              value={pageNumber}
              onChange={(e) => setPageNumber(e.target.value ? Number(e.target.value) : '')}
              placeholder="Opt."
              className="w-20 bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg font-medium text-xs transition-all shadow-md"
          >
            Save Note
          </button>
        </div>
      </form>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-6">Loading research notes...</div>
        ) : notes.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-10">
            No notes added yet. Record key observations or annotations above!
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg space-y-2 relative group hover:border-slate-600 transition-all"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-slate-500">
                  {new Date(note.created_at).toLocaleDateString()} {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {note.page_number && (
                  <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded border border-blue-700/40 font-medium">
                    Page {note.page_number}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {note.content}
              </p>
              <button
                onClick={() => handleDelete(note.id)}
                className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="Delete note"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
