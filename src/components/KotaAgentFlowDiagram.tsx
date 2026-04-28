import React from 'react';

const P = '#07b6d5';
const P_DIM = 'rgba(7,182,213,0.12)';
const P_BORDER = 'rgba(7,182,213,0.45)';
const NODE_BG = 'rgba(255,255,255,0.03)';
const NODE_BORDER = 'rgba(255,255,255,0.1)';
const TEXT = 'rgba(255,255,255,0.92)';
const MUTED = 'rgba(255,255,255,0.42)';
const LINE = 'rgba(255,255,255,0.15)';

function Node({ cx, cy, w = 220, h = 46, label, sub, highlight = false }: {
  cx: number; cy: number; w?: number; h?: number;
  label: string; sub?: string; highlight?: boolean;
}) {
  return (
    <g>
      <rect
        x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={10}
        fill={highlight ? P_DIM : NODE_BG}
        stroke={highlight ? P_BORDER : NODE_BORDER}
        strokeWidth={1}
      />
      <text x={cx} y={sub ? cy - 5 : cy + 5} textAnchor="middle"
        fill={highlight ? P : TEXT} fontSize={13} fontWeight={highlight ? 600 : 500}>
        {label}
      </text>
      {sub && (
        <text x={cx} y={cy + 12} textAnchor="middle" fill={MUTED} fontSize={11}>
          {sub}
        </text>
      )}
    </g>
  );
}

export default function KotaAgentFlowDiagram() {
  const userC    = { x: 350, y: 44 };
  const routerC  = { x: 350, y: 132 };
  const generalC = { x: 175, y: 228 };
  const workflowC= { x: 525, y: 228 };
  const contractC= { x: 350, y: 326 };

  // 6 output pills
  const pillLabels = ['text', 'list', 'table', 'chart', 'document', 'action'];
  const pillW = 82;
  const pillGap = 8;
  const totalW = pillLabels.length * pillW + (pillLabels.length - 1) * pillGap;
  const pillStart = (700 - totalW) / 2;
  const pillCenters = pillLabels.map((_, i) => pillStart + i * (pillW + pillGap) + pillW / 2);
  const pillY = 416;
  const pillTop = pillY - 14;

  // Line endpoints — all terminate at node edges, never pass through nodes
  const userBot    = userC.y + 23;
  const routerTop  = routerC.y - 23;
  const routerBot  = routerC.y + 23;
  const generalTop = generalC.y - 23;
  const generalBot = generalC.y + 23;
  const workflowTop= workflowC.y - 23;
  const workflowBot= workflowC.y + 23;
  const contractTop= contractC.y - 23;
  const contractBot= contractC.y + 23;

  return (
    <div style={{
      width: '100%', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.015)',
      padding: '28px 20px 20px',
    }}>
      <svg viewBox="0 0 700 454" style={{ width: '100%', height: 'auto' }}>
        <defs>
          <marker id="afd-arr" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill={LINE} />
          </marker>
        </defs>

        {/* ── LINES (drawn before nodes so nodes sit on top) ── */}

        {/* User → Router */}
        <line x1={userC.x} y1={userBot} x2={routerC.x} y2={routerTop}
          stroke={LINE} strokeWidth={1.5} strokeDasharray="5 4"
          markerEnd="url(#afd-arr)" />

        {/* Router → General */}
        <line x1={routerC.x - 28} y1={routerBot} x2={generalC.x + 16} y2={generalTop}
          stroke={LINE} strokeWidth={1.5} strokeDasharray="5 4"
          markerEnd="url(#afd-arr)" />

        {/* Router → Workflow */}
        <line x1={routerC.x + 28} y1={routerBot} x2={workflowC.x - 16} y2={workflowTop}
          stroke={LINE} strokeWidth={1.5} strokeDasharray="5 4"
          markerEnd="url(#afd-arr)" />

        {/* General → Contract */}
        <line x1={generalC.x + 16} y1={generalBot} x2={contractC.x - 90} y2={contractTop}
          stroke={LINE} strokeWidth={1.5} strokeDasharray="5 4"
          markerEnd="url(#afd-arr)" />

        {/* Workflow → Contract */}
        <line x1={workflowC.x - 16} y1={workflowBot} x2={contractC.x + 90} y2={contractTop}
          stroke={LINE} strokeWidth={1.5} strokeDasharray="5 4"
          markerEnd="url(#afd-arr)" />

        {/* Contract → pills (fan-out) */}
        {pillCenters.map((px, i) => (
          <line key={i}
            x1={contractC.x} y1={contractBot}
            x2={px} y2={pillTop}
            stroke={LINE} strokeWidth={1} />
        ))}

        {/* ── NODES (drawn after lines — sit on top) ── */}
        <Node cx={userC.x}     cy={userC.y}     w={200} label="User Message"          sub="incoming request" />
        <Node cx={routerC.x}   cy={routerC.y}   w={250} label="Router Agent"          sub="intent classification" highlight />
        <Node cx={generalC.x}  cy={generalC.y}  w={210} label="General Agent"         sub="single-turn · 6 surfaces" />
        <Node cx={workflowC.x} cy={workflowC.y} w={210} label="Workflow Agent"        sub="multi-step reasoning loop" />
        <Node cx={contractC.x} cy={contractC.y} w={320} label="Generative UI Contract" sub="typed JSON → React components" highlight />

        {/* ── OUTPUT PILLS ── */}
        {pillLabels.map((label, i) => {
          const px = pillCenters[i];
          const isAction = label === 'action';
          return (
            <g key={label}>
              <rect x={px - pillW / 2} y={pillTop} width={pillW} height={28} rx={14}
                fill={isAction ? P_DIM : NODE_BG}
                stroke={isAction ? P_BORDER : NODE_BORDER}
                strokeWidth={1} />
              <text x={px} y={pillTop + 18} textAnchor="middle"
                fill={isAction ? P : MUTED} fontSize={11} fontWeight={isAction ? 600 : 400}>
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.32)', marginTop: 12, marginBottom: 0 }}>
        Router classifies every request. Surface context is injected at request time — same agent, different context window.
      </p>
    </div>
  );
}
