'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { UploadDropzone } from '@/components/UploadDropzone';
import { PaperGrid } from '@/components/PaperGrid';
import { Loader2, FileText, Cpu, Database, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-xs font-mono text-zinc-500">Loading Synapse Workspace...</p>
        </div>
      </div>
    );
  }

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Upload & Workspace intro section */}
        <section className="space-y-6">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
              Research Workspace
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Upload your research papers below. Synapse extracts page structure, generates vector embeddings, and prepares your paper library for conversational grounding.
            </p>
          </div>

          <UploadDropzone onUploadSuccess={handleUploadSuccess} />
        </section>

        {/* Pipeline Info Banner */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4 text-xs text-zinc-400">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-zinc-200 block">Page-Aware Extraction</span>
              <span>Preserves precise page locations with PyMuPDF</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-zinc-200 block">Vector Chunking</span>
              <span>Creates ~400 word chunks linked to page metadata</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-zinc-200 block">PostgreSQL + pgvector</span>
              <span>Stored directly in vector DB for zero-drift retrieval</span>
            </div>
          </div>
        </section>

        {/* Paper Library Grid Section */}
        <section className="pt-2">
          <PaperGrid refreshTrigger={refreshTrigger} onPaperChange={() => {}} />
        </section>
      </main>
    </div>
  );
}
