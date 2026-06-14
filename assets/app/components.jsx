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

// ---- reordenação (mover para cima/baixo) — funciona em celular e desktop ----
function ReorderButtons({ onUp, onDown, upDisabled, downDisabled, vertical, stopPropagation }) {
  const wrap = (fn) => (e) => { if (stopPropagation) e.stopPropagation(); fn && fn(); };
  return (
    <span className={"reorder-btns" + (vertical ? " vertical" : "")}>
      <button type="button" className="reorder-btn" title="Mover para cima" disabled={upDisabled} onClick={wrap(onUp)}>▲</button>
      <button type="button" className="reorder-btn" title="Mover para baixo" disabled={downDisabled} onClick={wrap(onDown)}>▼</button>
    </span>
  );
}

Object.assign(window, { brl, brlShort, Card, SectionTitle, Stat, Progress, Badge, Stars, Avatar, Donut, STATUS_MAP, ReorderButtons });
