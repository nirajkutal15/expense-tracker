// ================================================================
//  API — Authenticated fetch wrapper
// ================================================================
async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 401) { handleLogout(); throw new Error('Session expired'); }
  return res;
}
