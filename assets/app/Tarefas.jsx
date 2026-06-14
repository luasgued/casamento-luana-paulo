// Tarefas.jsx — quadro Kanban com responsável (Luana / Paulo / Ambos)
const COLS = [
  { id: "todo",  nome: "A fazer", tone: "todo" },
  { id: "doing", nome: "Fazendo", tone: "doing" },
  { id: "done",  nome: "Feito",   tone: "done" },
];
const RESP = ["Luana", "Paulo", "Ambos"];
const AREAS = ["Fornecedores", "Orçamento", "Convidados", "Dia da Noiva", "Papelaria", "Cerimônia", "Geral"];
const HOJE = new Date("2026-06-12");

function fmtPrazo(d) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}
function venceu(t) { return t.status !== "done" && new Date(t.prazo + "T00:00:00") < HOJE; }

function RespTag({ resp, onClick }) {
  const cls = resp === "Luana" ? "r-l" : resp === "Paulo" ? "r-p" : "r-ambos";
  const label = resp === "Ambos" ? "L·P" : resp[0];
  return (
    <button className={"resp-tag " + cls} onClick={onClick} title={"Responsável: " + resp + " — clique para alternar"}>
      <span className="resp-ini">{label}</span>{resp}
    </button>
  );
}

function Tarefas({ tasks, setTasks }) {
  const [fResp, setFResp] = React.useState("Todos");
  const [over, setOver] = React.useState(null);
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState({ titulo: "", responsavel: "Ambos", area: "Fornecedores", prazo: "", prioridade: "media" });
  const dragId = React.useRef(null);

  const visivel = (t) => fResp === "Todos" || t.responsavel === fResp || t.responsavel === "Ambos";
  const move = (id, status) => setTasks((ts) => ts.map((t) => t.id === id ? { ...t, status } : t));
  const cycleResp = (id) => setTasks((ts) => ts.map((t) => t.id === id ? { ...t, responsavel: RESP[(RESP.indexOf(t.responsavel) + 1) % 3] } : t));
  const del = (id) => setTasks((ts) => ts.filter((t) => t.id !== id));
  const addTask = () => {
    if (!draft.titulo.trim()) return;
    const novo = { ...draft, id: "t" + Date.now(), status: "todo", prazo: draft.prazo || "2026-09-01" };
    setTasks((ts) => [novo, ...ts]);
    setDraft({ titulo: "", responsavel: "Ambos", area: "Fornecedores", prazo: "", prioridade: "media" });
    setAdding(false);
  };

  const counts = COLS.reduce((o, c) => (o[c.id] = tasks.filter((t) => t.status === c.id && visivel(t)).length, o), {});
  const minhas = (quem) => tasks.filter((t) => t.status !== "done" && (t.responsavel === quem || t.responsavel === "Ambos")).length;

  return (
    <div className="screen">
      <SectionTitle kicker="PLANEJAMENTO" title="Tarefas"
        action={<button className="add-btn" onClick={() => setAdding(true)}>+ Nova tarefa</button>} />

      {/* responsável filter + workload */}
      <div className="kanban-toolbar">
        <div className="seg">
          {["Todos", "Luana", "Paulo"].map((r) => (
            <button key={r} className={"seg-btn" + (fResp === r ? " on" : "")} onClick={() => setFResp(r)}>{r}</button>
          ))}
        </div>
        <div className="workload">
          <span className="wl-item"><span className="resp-ini r-l">L</span>{minhas("Luana")} tarefas abertas</span>
          <span className="wl-item"><span className="resp-ini r-p">P</span>{minhas("Paulo")} tarefas abertas</span>
        </div>
      </div>

      {/* add form */}
      {adding && (
        <Card className="pad add-task-form">
          <div className="atf-row">
            <input autoFocus className="f-input" placeholder="Descreva a tarefa…" value={draft.titulo}
              onChange={(e) => setDraft({ ...draft, titulo: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") addTask(); if (e.key === "Escape") setAdding(false); }} />
          </div>
          <div className="atf-row atf-controls">
            <label className="atf-field"><span>Responsável</span>
              <select className="f-input" value={draft.responsavel} onChange={(e) => setDraft({ ...draft, responsavel: e.target.value })}>
                {RESP.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="atf-field"><span>Área</span>
              <select className="f-input" value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })}>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <label className="atf-field"><span>Prioridade</span>
              <select className="f-input" value={draft.prioridade} onChange={(e) => setDraft({ ...draft, prioridade: e.target.value })}>
                <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
              </select>
            </label>
            <label className="atf-field"><span>Prazo</span>
              <input type="date" className="f-input" value={draft.prazo} onChange={(e) => setDraft({ ...draft, prazo: e.target.value })} />
            </label>
            <div className="atf-actions">
              <button className="mini-btn" onClick={() => setAdding(false)}>Cancelar</button>
              <button className="add-btn solid" onClick={addTask}>Adicionar</button>
            </div>
          </div>
        </Card>
      )}

      {/* board */}
      <div className="kanban">
        {COLS.map((col) => (
          <div key={col.id}
            className={"kcol" + (over === col.id ? " over" : "")}
            onDragOver={(e) => { e.preventDefault(); setOver(col.id); }}
            onDragLeave={(e) => { if (e.currentTarget === e.target) setOver(null); }}
            onDrop={() => { if (dragId.current) move(dragId.current, col.id); dragId.current = null; setOver(null); }}>
            <div className={"kcol-head tone-" + col.tone}>
              <span className="kcol-dot" /><span className="kcol-name">{col.nome}</span><span className="kcol-count">{counts[col.id]}</span>
            </div>
            <div className="kcol-body">
              {tasks.filter((t) => t.status === col.id && visivel(t)).map((t) => (
                <div key={t.id} className={"kcard" + (venceu(t) ? " late" : "")} draggable
                  onDragStart={() => { dragId.current = t.id; }}
                  onDragEnd={() => { dragId.current = null; setOver(null); }}>
                  <div className="kcard-top">
                    <span className={"prio prio-" + t.prioridade} title={"Prioridade " + t.prioridade} />
                    <span className="kcard-area">{t.area}</span>
                    <button className="kcard-del" onClick={() => del(t.id)} title="Remover">✕</button>
                  </div>
                  <div className={"kcard-title" + (t.status === "done" ? " done" : "")}>{t.titulo}</div>
                  <div className="kcard-foot">
                    <RespTag resp={t.responsavel} onClick={() => cycleResp(t.id)} />
                    <span className={"kcard-prazo" + (venceu(t) ? " late" : "")}>{venceu(t) ? "⚠ " : ""}{fmtPrazo(t.prazo)}</span>
                  </div>
                </div>
              ))}
              {counts[col.id] === 0 && <div className="kcol-empty">Arraste tarefas para cá</div>}
            </div>
          </div>
        ))}
      </div>
      <div className="kanban-hint">Arraste os cartões entre as colunas · clique no responsável para alternar entre Luana, Paulo e ambos.</div>
    </div>
  );
}

Object.assign(window, { Tarefas });
