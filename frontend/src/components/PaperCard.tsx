'use client';

import React, { useState } from 'react';
import { Paper } from '@/types';
import { StatusBadge } from './StatusBadge';
import { FileText, Trash2, Calendar, BookOpen, Layers } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

interface PaperCardProps {
  paper: Paper;
  onDeleteSuccess: () => void;
}

export function PaperCard({ paper, onDeleteSuccess }: PaperCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${paper.title}"?`)) return;

    setIsDeleting(true);
    try {
      const res = await fetchWithAuth(`/papers/${paper.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onDeleteSuccess();
      }
    } catch (err) {
      console.error('Failed to delete paper:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-sm hover:border-zinc-700 hover:bg-zinc-900/90 transition-all duration-200 shadow-sm hover:shadow-md">
      <div>
        {/* Header line: Status + Actions */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <StatusBadge status={paper.status} errorMessage={paper.error_message} />

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-500 hover:text-rose-400 rounded-md hover:bg-zinc-800 focus:outline-none"
            title="Delete paper"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Paper title & file */}
        <div className="space-y-1">
          <h4 className="font-semibold text-zinc-100 text-base leading-snug line-clamp-2 tracking-tight group-hover:text-indigo-300 transition-colors">
            {paper.title}
          </h4>
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 truncate">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{paper.filename}</span>
          </div>
        </div>
      </div>

      {/* Footer stats */}
      <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-zinc-500" />
          <span>{paper.page_count > 0 ? `${paper.page_count} pages` : 'Pending pages'}</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-zinc-500">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(paper.uploaded_at)}</span>
        </div>
      </div>
    </div>
  );
}
