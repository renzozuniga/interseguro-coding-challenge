import { useState } from 'react';

const DEFAULT_MATRIX = '1 2\n3 4\n5 6';

/**
 * MatrixInput renders a textarea where the user types a matrix row by row,
 * space-separated (e.g. "1 2\n3 4\n5 6" for a 3×2 matrix).
 * On submit it parses the text and calls onSubmit(matrix: number[][]).
 *
 * @param {{ onSubmit: (matrix: number[][]) => void, loading: boolean }} props
 */
export default function MatrixInput({ onSubmit, onReset, loading }) {
  const [raw, setRaw] = useState(DEFAULT_MATRIX);
  const [parseError, setParseError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setParseError('');

    const result = parseMatrix(raw);
    if (result.error) {
      setParseError(result.error);
      return;
    }

    onSubmit(result.matrix);
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: 4 }}>Input Matrix</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
        Enter each row on its own line, values space-separated. Requires m ≥ n (more rows than columns).
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <textarea
          value={raw}
          onChange={e => { setRaw(e.target.value); setParseError(''); }}
          rows={8}
          placeholder={'1 2 3\n4 5 6\n7 8 9'}
          style={{
            background: 'var(--surface2)',
            border: `1px solid ${parseError ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius: 6,
            color: 'var(--text)',
            padding: '10px 14px',
            fontSize: 14,
            resize: 'vertical',
            outline: 'none',
            lineHeight: 1.8,
          }}
        />

        {parseError && <div className="error-banner">{parseError}</div>}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Computing…' : 'Compute QR'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => { setRaw(DEFAULT_MATRIX); setParseError(''); onReset?.(); }}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Parses the textarea content into a 2-D numeric array.
 * Returns { matrix } on success or { error } on failure.
 *
 * @param {string} raw
 * @returns {{ matrix?: number[][], error?: string }}
 */
function parseMatrix(raw) {
  const lines = raw.trim().split('\n').filter(l => l.trim() !== '');

  if (lines.length === 0) {
    return { error: 'matrix must not be empty' };
  }

  const matrix = [];
  let cols = null;

  for (let i = 0; i < lines.length; i++) {
    const tokens = lines[i].trim().split(/\s+/);
    const row = tokens.map(Number);

    if (row.some(isNaN)) {
      return { error: `row ${i + 1} contains non-numeric values` };
    }

    if (cols === null) {
      cols = row.length;
    } else if (row.length !== cols) {
      return { error: `row ${i + 1} has ${row.length} value(s), expected ${cols} (matrix must be rectangular)` };
    }

    matrix.push(row);
  }

  const m = matrix.length;
  const n = cols;
  if (m < n) {
    return { error: `matrix has ${m} row(s) and ${n} column(s) — need at least as many rows as columns (m ≥ n) for QR decomposition` };
  }

  return { matrix };
}
