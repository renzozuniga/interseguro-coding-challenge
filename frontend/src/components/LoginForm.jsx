import { useState } from 'react';
import { login } from '../api/client';

/**
 * LoginForm renders a credential form and calls the Go API auth endpoint.
 * On success it invokes onLogin() so the parent can switch to the main view.
 *
 * @param {{ onLogin: () => void }} props
 */
export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: '120px auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: 4 }}>Sign in</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
          QR Decomposition API — demo credentials
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
            <span style={{ color: 'var(--text-muted)' }}>Username</span>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={inputStyle}
              autoComplete="username"
              required
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
            <span style={{ color: 'var(--text-muted)' }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="error-banner">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text)',
  padding: '8px 12px',
  fontSize: 14,
  outline: 'none',
  width: '100%',
};
