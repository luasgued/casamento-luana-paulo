// components.jsx — shared UI primitives. Exported to window at the end.
const { useState, useMemo, useRef, useEffect } = React;

// ---- formatting ---------------------------------------------------------
const brl = (n) => "R$ " + (n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const brlShort = (n) => {
  if (n >= 1000) return "R$ " + (n / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + "k";
  return brl(n);
};

// ---- primitives ---------------------------------------------------------
function Card({ children, className = "", style = {}, ...rest }) {
  return <div className={"card " + className} style={style} {...rest}>{children}</div>;
}

function SectionTitle({ kicker, title, action }) {
  return (
    <div className="sec-title">
      <div>
        {kicker && <div className="kicker">{kicker}</div>}
        <h2 className="serif">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Stat({ label, value, sub, accent }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className={"stat-value serif" + (accent ? " accent-ink" : "")}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function Progress({ value, max, tone = "ink", height = 8 }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  return (
    <div className="progress" style={{ height }}>
      <div className={"progress-bar tone-" + tone} style={{ width: pct + "%" }} />
    </div>
  );
}

const STATUS_MAP = {
  pago:        { label: "Pago",        tone: "good" },
  contratado:  { label: "Contratado",  tone: "good" },
  cotando:     { label: "Cotando",     tone: "warn" },
  "nao-iniciado": { label: "Não iniciado", tone: "muted" },
  previsto:    { label: "Previsto",    tone: "muted" },
  favorito:    { label: "Favorito",    tone: "accent" },
  analise:     { label: "Em análise",  tone: "warn" },
  descartado:  { label: "Descartado",  tone: "off" },
  confirmado:  { label: "Confirmado",  tone: "good" },
  pendente:    { label: "Pendente",    tone: "warn" },
  recusado:    { label: "Recusou",     tone: "off" },
};

function Badge({ status, children, tone }) {
  const m = STATUS_MAP[status] || { label: children, tone: tone || "muted" };
  return <span className={"badge tone-" + (tone || m.tone)}>{m.label || children}</span>;
}

function Stars({ score, size = 14 }) {
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={score + " de 5"}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= score ? "star on" : "star"}>{i <= score ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

function Avatar({ name, lado }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return <span className={"avatar lado-" + (lado === "Luana" ? "l" : "p")}>{initials}</span>;
}

// donut ring (svg) for budget overview
function Donut({ segments, size = 160, stroke = 18, centerLabel, centerSub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const dash = `${len} ${c - len}`;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={s.color} strokeWidth={stroke} strokeDasharray={dash}
              strokeDashoffset={-offset} transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="butt" />
          );
          offset += len;
          return el;
        })}
      </svg>
      {centerLabel && (
        <div className="donut-center">
          <div className="donut-label serif">{centerLabel}</div>
          {centerSub && <div className="donut-sub">{centerSub}</div>}
        </div>
      )}
    </div>
  );
}

// ---- reordenação por arrastar (drag-and-drop) ----------------------------
// Alça de arrastar (ponto de pega). Os handlers de drag são passados via props.
function DragHandle(props) {
  return (
    <span className="drag-handle" title="Arraste para reordenar" {...props}>
      <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden="true">
        <circle cx="3.5" cy="3" r="1.3" /><circle cx="8.5" cy="3" r="1.3" />
        <circle cx="3.5" cy="8" r="1.3" /><circle cx="8.5" cy="8" r="1.3" />
        <circle cx="3.5" cy="13" r="1.3" /><circle cx="8.5" cy="13" r="1.3" />
      </svg>
    </span>
  );
}

// Move o item com id `fromId` para a posição do item `toId` (insere antes dele).
function reorderList(arr, fromId, toId) {
  if (fromId == null || fromId === toId) return arr;
  const a = arr.slice();
  const fi = a.findIndex((x) => x.id === fromId);
  if (fi < 0) return arr;
  const [moved] = a.splice(fi, 1);
  const ti = a.findIndex((x) => x.id === toId);
  if (ti < 0) return arr;
  a.splice(ti, 0, moved);
  return a;
}

// Reordena por índice (para listas de strings, ex.: serviços).
function reorderIndex(arr, from, to) {
  if (from === to || from == null) return arr;
  const a = arr.slice();
  const [m] = a.splice(from, 1);
  a.splice(to, 0, m);
  return a;
}

// Hook que fornece os handlers de drag para a fonte (alça) e o alvo (linha/card).
// onReorder(de, para) recebe a chave (id ou índice) arrastada e a de destino.
function useDragSort(onReorder) {
  const dragKey = React.useRef(null);
  const [over, setOver] = React.useState(null);
  return {
    over,
    handleProps: (key) => ({
      draggable: true,
      onDragStart: (e) => {
        dragKey.current = key;
        if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", String(key)); } catch (_) {} }
      },
      onDragEnd: () => { dragKey.current = null; setOver(null); },
    }),
    targetProps: (key) => ({
      onDragOver: (e) => { e.preventDefault(); if (dragKey.current != null && over !== key) setOver(key); },
      onDragLeave: (e) => { if (e.currentTarget === e.target && over === key) setOver(null); },
      onDrop: (e) => { e.preventDefault(); if (dragKey.current != null) onReorder(dragKey.current, key); dragKey.current = null; setOver(null); },
    }),
  };
}

Object.assign(window, { brl, brlShort, Card, SectionTitle, Stat, Progress, Badge, Stars, Avatar, Donut, STATUS_MAP, DragHandle, reorderList, reorderIndex, useDragSort });
