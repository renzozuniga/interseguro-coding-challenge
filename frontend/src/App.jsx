import { useState } from 'react';
import { isAuthenticated, clearToken, decomposeQR } from './api/client';
import LoginForm from './components/LoginForm';
import MatrixInput from './components/MatrixInput';
import MatrixDisplay from './components/MatrixDisplay';
import StatsDisplay from './components/StatsDisplay';

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    setAuthed(true);
  }

  function handleLogout() {
    clearToken();
    setAuthed(false);
    setResult(null);
    setError('');
  }

  async function handleSubmit(matrix) {
    setError('');
    // Do NOT clear result here — keep the previous output visible while the
    // new computation runs. Clearing eagerly makes it look like the button
    // did nothing (panel disappears, no feedback, panel reappears).
    setLoading(true);

    try {
      const data = await decomposeQR(matrix);
      setResult(data); // atomically replace old result with the new one
    } catch (err) {
      setError(err.message);
      if (err.message.includes('401') || err.message.toLowerCase().includes('token')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!authed) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>QR Decomposition</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            Householder reflections · Go API + Node.js stats
          </p>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ fontSize: 13 }}>
          Sign out
        </button>
      </header>

      {/* Input */}
      <MatrixInput
        onSubmit={handleSubmit}
        onReset={() => { setResult(null); setError(''); }}
        loading={loading}
      />

      {/* Error */}
      {error && (
        <div className="error-banner" style={{ marginTop: 20 }}>
          {error}
        </div>
      )}

      {/* Results — stay mounted while recomputing so the user can see them update */}
      {result && (
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>

          <div className="card" style={{ position: 'relative', opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <h2 style={{ margin: 0 }}>Factored Matrices</h2>
              {loading && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Recomputing…</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
              <MatrixDisplay label="Q" matrix={result.q} />
              <MatrixDisplay label="R" matrix={result.r} />
            </div>
          </div>

          <div className="card" style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            <h2 style={{ marginBottom: 24 }}>
              Statistics{' '}
              <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 14 }}>
                computed by Node.js API
              </span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
              <StatsDisplay label="Q" stats={result.stats?.q} />
              <StatsDisplay label="R" stats={result.stats?.r} />
            </div>
          </div>

          <details className="card" style={{ fontSize: 13 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', userSelect: 'none' }}>
              Raw JSON response
            </summary>
            <pre style={{
              marginTop: 16,
              background: 'var(--surface2)',
              borderRadius: 6,
              padding: 16,
              overflow: 'auto',
              fontFamily: 'var(--mono)',
              fontSize: 12,
              color: 'var(--text)',
              lineHeight: 1.6,
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
