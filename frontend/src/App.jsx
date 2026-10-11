import { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const colors = {
  bg: '#080f1d',
  panel: '#111e30',
  border: '#263951',
  text: '#f1f5f9',
  muted: '#a8bad1',
  blue: '#38bdf8',
  purple: '#a78bfa',
  green: '#34d399',
  red: '#fb7185',
  yellow: '#fbbf24'
};

function Panel({ title, subtitle, children }) {
  return (
    <section style={{
      background: colors.panel,
      border: `1px solid ${colors.border}`,
      borderRadius: 18,
      padding: 24,
      minWidth: 0,
      boxSizing: 'border-box'
    }}>
      <h2 style={{
        color: colors.text,
        fontSize: 20,
        margin: '0 0 8px'
      }}>
        {title}
      </h2>

      {subtitle && (
        <p style={{
          color: colors.muted,
          margin: '0 0 22px',
          fontSize: 13
        }}>
          {subtitle}
        </p>
      )}

      {children}
    </section>
  );
}

function LevelCard({ title, subtitle, value, color, icon, label }) {
  const amount = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <section style={{
      background: `linear-gradient(145deg, ${colors.panel}, #14263c)`,
      border: `1px solid ${colors.border}`,
      borderRadius: 18,
      padding: 24,
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12
      }}>
        <div>
          <div style={{
            color: colors.muted,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.5
          }}>
            {subtitle}
          </div>

          <h2 style={{
            color: colors.text,
            fontSize: 21,
            margin: '10px 0'
          }}>
            {title}
          </h2>
        </div>

        <span style={{
          fontSize: 25,
          padding: 12,
          borderRadius: 14,
          background: '#ffffff0d'
        }}>
          {icon}
        </span>
      </div>

      <div style={{
        color,
        fontSize: 'clamp(42px, 5vw, 58px)',
        fontWeight: 800,
        margin: '20px 0',
        letterSpacing: -2
      }}>
        {amount.toFixed(1)}%
      </div>

      <div style={{
        height: 10,
        background: '#293a50',
        borderRadius: 20,
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${amount}%`,
          background: color,
          borderRadius: 20,
          transition: 'width 0.4s'
        }} />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 8,
        marginTop: 14,
        color: colors.muted,
        fontSize: 13
      }}>
        <span>{label}</span>
        <span>{amount.toFixed(0)} / 100</span>
      </div>
    </section>
  );
}

function LineGraph({ values, color, label }) {
  const data = values
    .filter(item => Number.isFinite(Number(item.value)))
    .slice(-20);

  const width = 700;
  const height = 250;
  const left = 42;
  const right = 16;
  const top = 20;
  const bottom = 38;
  const graphWidth = width - left - right;
  const graphHeight = height - top - bottom;

  const points = data.map((item, index) => {
    const x = data.length < 2
      ? left + graphWidth / 2
      : left + index * graphWidth / (data.length - 1);

    const value = Math.max(0, Math.min(100, Number(item.value)));
    const y = top + graphHeight - (value / 100) * graphHeight;
    const time = item.time || item.timestamp;

    return { x, y, value, time };
  });

  const path = points
    .map((point, index) =>
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    )
    .join(' ');

  const formatTime = time => {
    if (!time) return 'Time unavailable';

    const date = new Date(time);

    return Number.isNaN(date.getTime())
      ? 'Time unavailable'
      : date.toLocaleString();
  };

  const labelIndexes = data.length <= 3
    ? data.map((_, i) => i)
    : [...new Set([
        0,
        Math.floor((data.length - 1) / 2),
        data.length - 1
      ])];

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
        style={{
          width: '100%',
          display: 'block',
          overflow: 'visible'
        }}
      >
        {[0, 25, 50, 75, 100].map(level => {
          const y = top + graphHeight - (level / 100) * graphHeight;

          return (
            <g key={level}>
              <line
                x1={left}
                y1={y}
                x2={width - right}
                y2={y}
                stroke="#34445a"
                strokeDasharray="4 5"
              />

              <text
                x={left - 9}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill={colors.muted}
              >
                {level}
              </text>
            </g>
          );
        })}

        {points.length > 1 && (
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={color}
            stroke={colors.panel}
            strokeWidth="1.5"
          >
            <title>
              {`${label}: ${point.value.toFixed(1)}%\n${formatTime(point.time)}`}
            </title>
          </circle>
        ))}

        {points.length === 0 && (
          <text
            x={width / 2}
            y={height / 2}
            textAnchor="middle"
            fill={colors.muted}
            fontSize="14"
          >
            No readings yet
          </text>
        )}

        {labelIndexes.map(index => {
          const point = points[index];

          if (!point) return null;

          const anchor = index === 0
            ? 'start'
            : index === points.length - 1
              ? 'end'
              : 'middle';

          return (
            <text
              key={`time-${index}`}
              x={point.x}
              y={height - 7}
              textAnchor={anchor}
              fontSize="10"
              fill={colors.muted}
            >
              {point.time
                ? new Date(point.time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : `#${index + 1}`}
            </text>
          );
        })}
      </svg>

      <div style={{ color, fontSize: 12, marginTop: 4 }}>
        ● {label}
      </div>

      <div style={{
        color: colors.muted,
        fontSize: 11,
        marginTop: 6
      }}>
        Hover over a point to see its percentage and exact reading time.
      </div>
    </div>
  );
}

function App() {
  const [overheadLevel, setOverheadLevel] = useState(0);

  const [boreLevel, setBoreLevel] = useState(() => {
    const saved = localStorage.getItem('manualBoreLevel');
    return saved === null ? 90 : Number(saved);
  });

  const [boreInput, setBoreInput] = useState(() => {
    const saved = localStorage.getItem('manualBoreLevel');
    return saved === null ? '90' : saved;
  });

  const [boreHistory, setBoreHistory] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('manualBoreHistory') || '[]'
      );
    } catch {
      return [];
    }
  });

  const [status, setStatus] = useState('Waiting for ESP32 data');
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [saving, setSaving] = useState(false);

  const refreshHistory = async () => {
    const response = await axios.get(`${API}/history`);
    setHistory(response.data.data ?? []);
  };

  useEffect(() => {
    let active = true;

    const fetchLatest = async () => {
      try {
        const response = await axios.get(`${API}/latest`);

        if (!active) return;

        setOverheadLevel(
          Number(response.data.overheadLevel ?? 0)
        );

        setStatus(response.data.status ?? 'NORMAL');
        setLastUpdated(new Date());
        setError('');
      } catch {
        if (active) setError('Backend connection failed');
      }
    };

    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API}/history`);

        if (active) setHistory(response.data.data ?? []);
      } catch {
        if (active) console.error('Could not load history');
      }
    };

    fetchLatest();
    fetchHistory();

    const latestTimer = setInterval(fetchLatest, 2000);
    const historyTimer = setInterval(fetchHistory, 5000);

    return () => {
      active = false;
      clearInterval(latestTimer);
      clearInterval(historyTimer);
    };
  }, []);

  const saveBorewell = async event => {
    event.preventDefault();

    const value = Number(boreInput);

    if (
      boreInput.trim() === '' ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 100
    ) {
      setNotice('Enter a value between 0 and 100.');
      return;
    }

    setSaving(true);
    setNotice('');

    try {
      const response = await axios.post(`${API}/manual-borewell`, {
        boreLevel: value
      });

      if (!response.data.success) {
        throw new Error('Borewell reading could not be saved.');
      }

      const nextHistory = [
        ...boreHistory,
        { value, time: new Date().toISOString() }
      ].slice(-50);

      setBoreLevel(value);
      setBoreInput(String(value));
      setBoreHistory(nextHistory);

      localStorage.setItem('manualBoreLevel', String(value));
      localStorage.setItem(
        'manualBoreHistory',
        JSON.stringify(nextHistory)
      );

      await refreshHistory();

      setNotice(`Borewell level saved: ${value}%.`);
    } catch (err) {
      setNotice(
        err.response?.data?.message ||
        err.message ||
        'Could not save borewell level.'
      );
    } finally {
      setSaving(false);
    }
  };

  const pumpCommand =
    boreLevel < 15
      ? 'LOCKED'
      : overheadLevel < 20
        ? 'ON'
        : overheadLevel >= 95
          ? 'OFF'
          : 'STANDBY';

  const overheadGraph = history
    .slice(0, 20)
    .reverse()
    .map(item => ({
      value: item.overheadLevel,
      timestamp: item.timestamp
    }));

  const boreGraph = boreHistory.map(item => ({
    value: item.value,
    time: item.time
  }));

  const textMuted = {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 1.7
  };

  const alertBox = {
    padding: 16,
    borderRadius: 12,
    fontWeight: 800,
    marginBottom: 12
  };

  return (
    <main style={{
      minHeight: '100vh',
      padding: 'clamp(14px, 3vw, 34px)',
      boxSizing: 'border-box',
      background: colors.bg,
      color: colors.text,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif'
    }}>
      <header style={{
        padding: 'clamp(22px, 4vw, 38px)',
        borderRadius: 20,
        border: `1px solid ${colors.border}`,
        background: 'linear-gradient(120deg, #14263c, #123c54)',
        marginBottom: 24
      }}>
        <div style={{
          color: colors.blue,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 3
        }}>
          AQUASENSE · IOT MONITORING
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 18
        }}>
          <div>
            <h1 style={{
              color: '#ffffff',
              fontSize: 'clamp(26px, 4vw, 40px)',
              margin: '14px 0 8px',
              lineHeight: 1.2
            }}>
              Smart Water Management
            </h1>

            <p style={{ ...textMuted, margin: 0 }}>
              Live monitoring · Manual source management · Water history
            </p>
          </div>

          <span style={{
            color: error ? colors.red : colors.green,
            background: '#07131d',
            padding: '12px 16px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 13
          }}>
            ● {error ? 'Backend Offline' : 'Dashboard Connected'}
          </span>
        </div>
      </header>

      {error && (
        <div style={{
          background: '#421d2a',
          color: '#fecdd3',
          padding: 16,
          borderRadius: 12,
          marginBottom: 20
        }}>
          {error}. Make sure your backend server is running.
        </div>
      )}

      {/* WATER LEVEL ALERTS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
        gap: 12,
        marginBottom: 20
      }}>
        {overheadLevel < 20 && (
          <div role="alert" style={{
            ...alertBox,
            background: '#421d2a',
            border: `1px solid ${colors.red}`,
            color: '#fecdd3'
          }}>
            ⚠ LOW WATER ALERT — Overhead tank is at {overheadLevel.toFixed(1)}%.
            <div style={{ fontWeight: 400, fontSize: 13, marginTop: 6 }}>
              Water level is below the 20% threshold.
            </div>
          </div>
        )}

        {overheadLevel >= 95 && (
          <div role="status" style={{
            ...alertBox,
            background: '#3b2f12',
            border: `1px solid ${colors.yellow}`,
            color: colors.yellow
          }}>
            ⚠ TANK ALMOST FULL — Overhead tank is at {overheadLevel.toFixed(1)}%.
            <div style={{ fontWeight: 400, fontSize: 13, marginTop: 6 }}>
              The tank has reached the 95% warning threshold.
            </div>
          </div>
        )}

        {boreLevel < 15 && (
          <div role="alert" style={{
            ...alertBox,
            background: '#421d2a',
            border: `1px solid ${colors.red}`,
            color: '#fecdd3'
          }}>
            ⚠ LOW BOREWELL ALERT — Manual source level is {boreLevel.toFixed(1)}%.
            <div style={{ fontWeight: 400, fontSize: 13, marginTop: 6 }}>
              Check the manually entered borewell level.
            </div>
          </div>
        )}

        {overheadLevel >= 20 &&
          overheadLevel < 95 &&
          boreLevel >= 15 &&
          !error && (
            <div role="status" style={{
              ...alertBox,
              background: '#103528',
              border: `1px solid ${colors.green}`,
              color: colors.green
            }}>
              ✓ ALL LEVELS NORMAL
              <div style={{ fontWeight: 400, fontSize: 13, marginTop: 6 }}>
                Overhead tank and manually entered borewell level are within configured ranges.
              </div>
            </div>
          )}
      </div>

      {/* LEVEL CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))',
        gap: 20
      }}>
        <LevelCard
          title="Overhead Tank"
          subtitle="LIVE SENSOR"
          value={overheadLevel}
          color={overheadLevel < 20 ? colors.red : colors.blue}
          icon="💧"
          label={
            overheadLevel < 20
              ? 'Low water level'
              : overheadLevel >= 95
                ? 'Tank nearly full'
                : 'Water available'
          }
        />

        <LevelCard
          title="Borewell Source"
          subtitle="MANUAL VALUE"
          value={boreLevel}
          color={boreLevel < 15 ? colors.red : colors.purple}
          icon="🌊"
          label={
            boreLevel < 15
              ? 'Low source level'
              : 'Manually maintained'
          }
        />
      </div>

      {/* SYSTEM STATUS AND PUMP COMMAND */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
        gap: 20,
        marginTop: 20
      }}>
        <Panel title="System Status" subtitle="Current overhead tank condition">
          <div style={{
            color: overheadLevel < 20
              ? colors.red
              : overheadLevel >= 95
                ? colors.yellow
                : colors.green,
            fontSize: 22,
            fontWeight: 800,
            overflowWrap: 'anywhere'
          }}>
            {overheadLevel < 20
              ? 'LOW WATER'
              : overheadLevel >= 95
                ? 'TANK ALMOST FULL'
                : status}
          </div>

          <p style={textMuted}>
            {overheadLevel < 20
              ? 'Low overhead water detected.'
              : overheadLevel >= 95
                ? 'Tank full threshold reached.'
                : 'Overhead level is within the configured range.'}
          </p>

          <p style={{ ...textMuted, marginBottom: 0 }}>
            Last update: {lastUpdated
              ? lastUpdated.toLocaleTimeString()
              : 'Waiting for sensor'}
          </p>
        </Panel>

        <Panel title="Pump Command" subtitle="Software command based on water level">
          <div style={{
            color: pumpCommand === 'ON'
              ? colors.yellow
              : pumpCommand === 'OFF'
                ? colors.green
                : pumpCommand === 'LOCKED'
                  ? colors.red
                  : colors.blue,
            fontSize: 34,
            fontWeight: 800
          }}>
            {pumpCommand}
          </div>

          <p style={textMuted}>
            {pumpCommand === 'LOCKED'
              ? 'Source level is low. Pump operation should be prevented.'
              : 'This is the software command only. It does not confirm that the physical pump motor is running.'}
          </p>
        </Panel>
      </div>

      {/* GRAPHS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        gap: 20,
        marginTop: 20
      }}>
        <Panel
          title="Overhead Tank Trend"
          subtitle="Latest saved sensor readings · Percentage"
        >
          <LineGraph
            values={overheadGraph}
            color={colors.blue}
            label="Overhead level (%)"
          />
        </Panel>

        <Panel
          title="Borewell Trend"
          subtitle="Manual readings saved in this browser"
        >
          <LineGraph
            values={boreGraph}
            color={colors.purple}
            label="Manual borewell level (%)"
          />
        </Panel>
      </div>

      {/* MANUAL BOREWELL CONTROL */}
      <section style={{
        background: colors.panel,
        border: `1px solid ${colors.border}`,
        borderRadius: 18,
        padding: 24,
        marginTop: 20
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <h2 style={{ color: colors.text, margin: '0 0 8px' }}>
              Borewell Level Control
            </h2>

            <p style={{ ...textMuted, margin: 0 }}>
              Change the percentage manually.
            </p>
          </div>

          <span style={{
            color: colors.purple,
            background: '#292143',
            padding: '9px 13px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 800
          }}>
            MANUAL MODE
          </span>
        </div>

        <form onSubmit={saveBorewell} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: 14,
          alignItems: 'end',
          marginTop: 24
        }}>
          <label style={{ color: colors.text, fontSize: 14 }}>
            Borewell water level (%)

            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={boreInput}
              onChange={event => setBoreInput(event.target.value)}
              style={{
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                marginTop: 9,
                padding: 13,
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                background: colors.bg,
                color: '#ffffff',
                fontSize: 16
              }}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            style={{
              border: 0,
              borderRadius: 10,
              padding: 15,
              background: colors.blue,
              color: '#06111e',
              fontWeight: 800,
              fontSize: 14,
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save Borewell Level'}
          </button>
        </form>

        {notice && (
          <p style={{
            color: notice.toLowerCase().includes('could not') ||
              notice.startsWith('Enter')
              ? colors.red
              : colors.green,
            overflowWrap: 'anywhere'
          }}>
            {notice}
          </p>
        )}

        <p style={{ ...textMuted, marginBottom: 0 }}>
          Manual values are saved to MongoDB and the browser graph.
        </p>
      </section>

      {/* HISTORY TABLE */}
      <div style={{ marginTop: 20 }}>
        <Panel
          title="Water Reading History"
          subtitle={`Latest ${Math.min(history.length, 20)} records from MongoDB`}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              minWidth: 600,
              borderCollapse: 'collapse',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{ background: '#203149' }}>
                  {['No.', 'Overhead', 'Borewell', 'Source', 'Status', 'Time'].map(item => (
                    <th key={item} style={{
                      padding: 14,
                      color: '#ffffff',
                      fontSize: 12,
                      letterSpacing: 0.5
                    }}>
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{
                      padding: 24,
                      textAlign: 'center',
                      color: colors.muted
                    }}>
                      No saved readings yet.
                    </td>
                  </tr>
                ) : history.slice(0, 20).map((item, index) => (
                  <tr
                    key={item._id || index}
                    style={{ borderBottom: `1px solid ${colors.border}` }}
                  >
                    <td style={{ padding: 14, color: colors.text }}>
                      {index + 1}
                    </td>

                    <td style={{ padding: 14, color: colors.blue }}>
                      {item.overheadLevel ?? 'N/A'}%
                    </td>

                    <td style={{ padding: 14, color: colors.purple }}>
                      {item.boreLevel ?? 'N/A'}%
                    </td>

                    <td style={{
                      padding: 14,
                      color: item.source === 'MANUAL'
                        ? colors.purple
                        : colors.green,
                      fontWeight: 700
                    }}>
                      {item.source ?? 'ESP32'}
                    </td>

                    <td style={{
                      padding: 14,
                      color: colors.text,
                      overflowWrap: 'anywhere'
                    }}>
                      {item.status ?? 'N/A'}
                    </td>

                    <td style={{
                      padding: 14,
                      color: colors.muted,
                      fontSize: 12,
                      whiteSpace: 'nowrap'
                    }}>
                      {item.timestamp
                        ? new Date(item.timestamp).toLocaleString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <footer style={{
        textAlign: 'center',
        color: colors.muted,
        fontSize: 12,
        padding: '28px 0 8px'
      }}>
        AquaSense · Smart Water Management System
      </footer>
    </main>
  );
}

export default App;