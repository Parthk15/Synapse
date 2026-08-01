import React from 'react';
import { PaperStatus } from '@/types';
import { CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: PaperStatus;
  errorMessage?: string | null;
}

export function StatusBadge({ status, errorMessage }: StatusBadgeProps) {
  switch (status) {
    case 'ready':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Ready</span>
        </span>
      );

    case 'processing':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-400 border border-indigo-500/20 animate-pulse">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
          <span>Processing...</span>
        </span>
      );

    case 'failed':
      return (
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 border border-rose-500/20"
          title={errorMessage || 'Processing failed'}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Failed</span>
        </span>
      );

    case 'uploaded':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-400 border border-zinc-700">
          <Clock className="h-3.5 w-3.5" />
          <span>Queued</span>
        </span>
      );
  }
}
