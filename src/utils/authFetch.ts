const API_BASE_URL = 'http://localhost:8080';

export async function authFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  let accessToken = localStorage.getItem('accessToken');
  let refreshToken = localStorage.getItem('refreshToken');

  const doFetch = (token: string | null) => fetch(input, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });

  let response = await doFetch(accessToken);

  if (response.status === 401 && refreshToken) {
    const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshRes.ok) {
      const refreshJson = await refreshRes.json();
      const data = refreshJson.data;
      if (data && data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        response = await doFetch(data.accessToken);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        alert('Your session has expired. Please login again.');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      alert('Your session has expired. Please login again.');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
} 