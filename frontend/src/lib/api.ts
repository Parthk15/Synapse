const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  let accessToken = typeof window !== 'undefined' ? localStorage.getItem('synapse_access_token') : null;
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('synapse_refresh_token') : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // If 401 Unauthorized, try refreshing token
  if (response.status === 401 && refreshToken) {
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (refreshRes.ok) {
        const tokenData = await refreshRes.json();
        localStorage.setItem('synapse_access_token', tokenData.access_token);
        localStorage.setItem('synapse_refresh_token', tokenData.refresh_token);

        // Retry original request with new token
        headers['Authorization'] = `Bearer ${tokenData.access_token}`;
        response = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
        });
      } else {
        // Refresh failed, clear tokens
        localStorage.removeItem('synapse_access_token');
        localStorage.removeItem('synapse_refresh_token');
      }
    } catch (e) {
      console.error('Token refresh error:', e);
    }
  }

  return response;
}

export async function searchPapers(query: string, paperId?: string, topK = 5) {
  const res = await fetchWithAuth('/papers/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, paper_id: paperId, top_k: topK }),
  });
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function chatWithPaper(message: string, paperId?: string, chatHistory?: any[]) {
  const res = await fetchWithAuth('/papers/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, paper_id: paperId, chat_history: chatHistory }),
  });
  if (!res.ok) throw new Error('Chat failed');
  return res.json();
}

export async function fetchPaperSummary(paperId: string) {
  const res = await fetchWithAuth(`/papers/${paperId}/summary`);
  if (!res.ok) throw new Error('Summary fetch failed');
  return res.json();
}

export async function fetchPaperNotes(paperId: string) {
  const res = await fetchWithAuth(`/papers/${paperId}/notes`);
  if (!res.ok) throw new Error('Notes fetch failed');
  return res.json();
}

export async function createPaperNote(paperId: string, content: string, pageNumber?: number) {
  const res = await fetchWithAuth(`/papers/${paperId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, page_number: pageNumber }),
  });
  if (!res.ok) throw new Error('Note creation failed');
  return res.json();
}

export async function deletePaperNote(noteId: string) {
  const res = await fetchWithAuth(`/notes/${noteId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Note deletion failed');
}

export function getPaperPdfUrl(paperId: string): string {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  return `${API_BASE}/papers/${paperId}/pdf`;
}

