/**
 * MatrixDisplay renders a labeled 2-D matrix as a styled HTML table.
 *
 * @param {{ label: string, matrix: number[][] }} props
 */
export default function MatrixDisplay({ label, matrix }) {
  if (!matrix || matrix.length === 0) return null;

  return (
    <div>
      <h3 style={{ marginBottom: 12, fontSize: 15 }}>
        <span className="badge badge-blue" style={{ marginRight: 8, fontSize: 13 }}>{label}</span>
        {matrix.length} × {matrix[0].length}
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                {row.map((val, j) => (
                  <td key={j} style={cellStyle(val)}>
                    {formatVal(val)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatVal(v) {
  // Show up to 6 significant figures; avoid scientific notation for values near 1.
  if (v === 0) return '0';
  const abs = Math.abs(v);
  if (abs >= 0.001 && abs < 1e6) {
    return parseFloat(v.toPrecision(6)).toString();
  }
  return v.toExponential(3);
}

const tableStyle = {
  borderCollapse: 'collapse',
  fontFamily: 'var(--mono)',
  fontSize: 13,
};

function cellStyle(val) {
  const isNearZero = Math.abs(val) < 1e-10;
  return {
    border: '1px solid var(--border)',
    padding: '6px 14px',
    textAlign: 'right',
    whiteSpace: 'nowrap',
    color: isNearZero ? 'var(--text-muted)' : 'var(--text)',
    background: isNearZero ? 'rgba(255,255,255,0.02)' : 'transparent',
    minWidth: 80,
  };
}
