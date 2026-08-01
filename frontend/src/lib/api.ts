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
