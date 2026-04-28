import React from 'react';

const P = '#07b6d5';
const P_DIM = 'rgba(7,182,213,0.12)';
const P_BORDER = 'rgba(7,182,213,0.45)';
const NODE_BG = 'rgba(255,255,255,0.03)';
const NODE_BORDER = 'rgba(255,255,255,0.1)';
const TEXT = 'rgba(255,255,255,0.92)';
const MUTED = 'rgba(255,255,255,0.45)';
const LINE = 'rgba(255,255,255,0.12)';

function Node({
  cx, cy, w = 220, h = 46, label, sub, highlight = false, dim = false,
}: {
  cx: number; cy: number; w?: number; h?: number;
  label: string; sub?: string; highlight?: boolean; dim?: boolean;
}) {
  return (
    <g>
      <rect
        x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={10}
        fill={highlight ? P_DIM : NODE_BG}
        stroke={highlight ? P_BORDER : NODE_BORDER}
        strokeWidth={1}
        opacity={dim ? 0.6 : 1}
      />
      <text x={cx} y={sub ? cy - 5 : cy + 5} textAnchor="middle"
        fill={highlight ? P : TEXT} fontSize={13} fontWeight={highlight ? 600 : 500}
        opacity={dim ? 0.7 : 1}>
        {label}
      </text>
      {sub && (
        <text x={cx} y={cy + 12} textAnchor="middle" fill={MUTED} fontSize={11} opacity={dim ? 0.6 : 1}>
          {sub}
        </text>
      )}
    </g>
  );
}

function StepLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fill={MUTED} fontSize={10} letterSpacing="0.08em">
      {text.toUpperCase()}
    </text>
  );
}

function Particle({ pathId, dur, begin, color = P }: {
  pathId: string; dur: string; begin: string; color?: string;
}) {
  return (
    <circle r={3} fill={color} opacity={0.9}>
      <animateMotion dur={dur} repeatCount="indefinite" begin={begin}>
        <mpath href={`#${pathId}`} />
      </animateMotion>
    </circle>
  );
}

export default function KotaKnowledgeBaseDiagram() {
  // Left column: ingestion pipeline (x=200)
  const LX = 200;
  // Right column: retrieval pipeline (x=500)
  const RX = 500;

  // Y positions (shared between columns at store level)
  const storeY = 280;

  // Left column nodes (top to bottom)
  const sourcesY = 50;
  const processY = 152;
  const embedY = 216; // hidden - merged into process
  // pgvector = storeY

  // Right column nodes (bottom to top - retrieval flows upward)
  const queryY = storeY; // same level as store
  const contextY = 182;
  const llmY = 90;

  // Response below the diagram — we'll add it differently
  const responseY = 368;

  return (
    <div style={{
      width: '100%', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.015)',
      padding: '28px 20px 20px',
    }}>
      <svg viewBox="0 0 700 430" style={{ width: '100%', height: 'auto' }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="kbd-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Left column — ingestion flows DOWN */}
          <path id="kbd-p1" d={`M ${LX} ${sourcesY + 23} L ${LX} ${processY - 23}`} />
          <path id="kbd-p2" d={`M ${LX} ${processY + 23} L ${LX} ${storeY - 23}`} />

          {/* Horizontal: Agent Query → pgvector (right to left) */}
          <path id="kbd-p3" d={`M ${RX - 110} ${storeY} L ${LX + 110} ${storeY}`} />

          {/* Right column — retrieval flows UP */}
          <path id="kbd-p4" d={`M ${RX} ${storeY - 23} L ${RX} ${contextY + 23}`} />
          <path id="kbd-p5" d={`M ${RX} ${contextY - 23} L ${RX} ${llmY + 23}`} />

          {/* LLM → Response (down) */}
          <path id="kbd-p6" d={`M ${RX} ${llmY + 23} L ${RX} ${responseY - 23}`} />
        </defs>

        {/* ── LEFT COLUMN LINES ── */}
        <line x1={LX} y1={sourcesY + 23} x2={LX} y2={processY - 23}
          stroke={LINE} strokeWidth={1.5} strokeDasharray="5 4" />
        <line x1={LX} y1={processY + 23} x2={LX} y2={storeY - 23}
          stroke={LINE} strokeWidth={1.5} strokeDasharray="5 4" />

        {/* ── HORIZONTAL CONNECTOR ── */}
        <line x1={LX + 110} y1={storeY} x2={RX - 110} y2={storeY}
          stroke={LINE} strokeWidth={1.5} strokeDasharray="5 4" />

        {/* ── RIGHT COLUMN LINES ── */}
        <line x1={RX} y1={storeY - 23} x2={RX} y2={contextY + 23}
          stroke={LINE} strokeWidth={1.5} strokeDasharray="5 4" />
        <line x1={RX} y1={contextY - 23} x2={RX} y2={llmY + 23}
          stroke={LINE} strokeWidth={1.5} strokeDasharray="5 4" />
        <line x1={RX} y1={llmY + 23} x2={RX} y2={responseY - 23}
          stroke={LINE} strokeWidth={1.5} strokeDasharray="5 4" />

        {/* ── STEP LABELS ── */}
        <StepLabel x={LX + 58} y={sourcesY + 46} text="chunk + embed" />
        <StepLabel x={LX + 68} y={processY + 46} text="vector store" />
        <StepLabel x={350} y={storeY - 32} text="semantic search" />
        <StepLabel x={RX + 68} y={storeY - 32} text="retrieved context" />

        {/* ── ANIMATED PARTICLES ── */}
        <g filter="url(#kbd-glow)">
          {/* Ingestion: downward */}
          <Particle pathId="kbd-p1" dur="1.8s" begin="0s" />
          <Particle pathId="kbd-p2" dur="1.8s" begin="0.4s" />
          {/* Query: right to left (into pgvector) */}
          <Particle pathId="kbd-p3" dur="1.6s" begin="0.2s" color="rgba(255,255,255,0.6)" />
          {/* Retrieval: upward */}
          <Particle pathId="kbd-p4" dur="1.8s" begin="0.7s" />
          <Particle pathId="kbd-p5" dur="1.8s" begin="1.0s" />
          {/* Response: downward */}
          <Particle pathId="kbd-p6" dur="1.6s" begin="1.3s" />
        </g>

        {/* ── LEFT COLUMN NODES ── */}
        <Node cx={LX} cy={sourcesY} w={250} label="Business Data" sub="products · pricing · clients · brand voice" />
        <Node cx={LX} cy={processY} w={230} label="Chunk + Embed" sub="via OpenRouter embeddings" />
        <Node cx={LX} cy={storeY} w={220} label="pgvector store" sub="Supabase · business-scoped" highlight />

        {/* ── RIGHT COLUMN NODES ── */}
        <Node cx={RX} cy={queryY} w={220} label="Agent Query" sub="decides what it needs" />
        <Node cx={RX} cy={contextY} w={220} label="Retrieved Context" sub="top-k relevant chunks" />
        <Node cx={RX} cy={llmY} w={220} label="LLM + Context" sub="grounded generation" highlight />

        {/* ── RESPONSE ── */}
        <Node cx={RX} cy={responseY} w={220} label="Response" sub="via Generative UI contract" highlight />

        {/* Column labels at top */}
        <text x={LX} y={14} textAnchor="middle" fill={MUTED} fontSize={10} letterSpacing="0.1em">
          INGESTION
        </text>
        <text x={RX} y={14} textAnchor="middle" fill={MUTED} fontSize={10} letterSpacing="0.1em">
          RETRIEVAL
        </text>

        {/* Divider line between columns */}
        <line x1={350} y1={20} x2={350} y2={410} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      </svg>

      <p style={{
        textAlign: 'center', fontSize: 12,
        color: 'rgba(255,255,255,0.35)',
        marginTop: 12, marginBottom: 0,
      }}>
        Data ingests on the left. At query time, the agent decides what it needs — retrieval happens silently before any output is generated.
      </p>
    </div>
  );
}
