const BASE = '/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),
  updateProfile: (token, payload) => request('/auth/me', { method: 'PUT', body: payload, token }),

  listTransactions: (token, params = '') => request(`/transactions${params}`, { token }),
  createTransaction: (token, payload) =>
    request('/transactions', { method: 'POST', body: payload, token }),
  deleteTransaction: (token, id) =>
    request(`/transactions/${id}`, { method: 'DELETE', token }),
  getAnalytics: (token, params = '') => request(`/transactions/analytics${params}`, { token }),

  listSubscriptions: (token) => request('/subscriptions', { token }),
  createSubscription: (token, payload) =>
    request('/subscriptions', { method: 'POST', body: payload, token }),
  cancelSubscription: (token, id) =>
    request(`/subscriptions/${id}`, { method: 'DELETE', token }),
};
