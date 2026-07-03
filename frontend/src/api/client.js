/**
 * Thin API client wrapping fetch with auth header injection and uniform error handling.
 * All functions throw an Error with a human-readable message on failure so React
 * components can display them without knowing HTTP status codes.
 *
 * VITE_API_BASE_URL: when set (e.g. in Vercel), requests go to that origin.
 * When empty (local dev / Docker), relative URLs are used so Vite proxy / nginx handle routing.
 */

/** Base URL prefix — empty string means "same origin" (dev/Docker). */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

/** @returns {string | null} JWT stored in sessionStorage, or null if not logged in. */
function getToken() {
  return sessionStorage.getItem('jwt');
}

/** @param {string} token */
export function storeToken(token) {
  sessionStorage.setItem('jwt', token);
}

export function clearToken() {
  sessionStorage.removeItem('jwt');
}

export function isAuthenticated() {
  return Boolean(getToken());
}

/**
 * Authenticates and stores the returned JWT in sessionStorage.
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<void>}
 */
export async function login(username, password) {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `login failed (HTTP ${res.status})`);
  }

  storeToken(data.token);
}

/**
 * Sends a matrix to the Go API for QR decomposition.
 * The Go API calls the Node.js stats service internally and returns a combined result.
 *
 * @param {number[][]} matrix - Rectangular m×n matrix with m >= n.
 * @returns {Promise<{ q: number[][], r: number[][], stats: object }>}
 */
export async function decomposeQR(matrix) {
  const token = getToken();
  if (!token) throw new Error('not authenticated');

  const res = await fetch(`${API_BASE}/api/v1/qr-decompose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ matrix }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `request failed (HTTP ${res.status})`);
  }

  return data;
}
