const BASE = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('adminToken');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  
  if (res.status === 401 && path.includes('/admin')) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    window.location.href = '/admin/login';
    return;
  }
  return res;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

export function publicGet(path) {
  return fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json' } });
}

export function publicPost(path, body) {
  return fetch(`${BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

export function applicantRequest(path, options = {}) {
  const token = localStorage.getItem('applicant_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${BASE}${path}`, { ...options, headers });
}

export const applicantApi = {
  get: (path) => applicantRequest(path),
  post: (path, body) => applicantRequest(path, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
};
