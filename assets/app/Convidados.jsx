// Convidados.jsx — lista de convidados editável
const GRUPOS_BASE = Array.from(new Set(CONVIDADOS.map((g) => g.grupo)));

const EMPTY_GUEST = () => ({
  id: null, nome: "", lado: "Luana", idade: 30, grupo: GRUPOS_BASE[0] || "Família",
  acompanhante: false, crianca: false, mesa: null, restricao: "", rsvp: "pendente",
});

function Convidados() {
  const [lista, setLista] = useStore("convidados", CONVIDADOS);
  const [busca, setBusca] = React.useState("");
  const [fLado, setFLado] = React.useState("todos");
  const [fGrupo, setFGrupo] = React.useState("todos");
  const [form, setForm] = React.useState(null);
  const [pagina, setPagina] = React.useState(1);
  const POR_PAGINA = 15;

  const grupos = ["todos", ...Array.from(new Set(lista.map((g) => g.grupo)))];

  const totalLuana = lista.filter((g) => g.lado === "Luana").length;
  const totalPaulo = lista.filter((g) => g.lado === "Paulo").length;
  const pctLuana = lista.length ? Math.round((totalLuana / lista.length) * 100) : 0;
  const pctPaulo = lista.length ? 100 - pctLuana : 0;

  const ehCrianca = (g) => g.crianca || (g.idade != null && g.idade < 18);
  const totalCriancas = lista.filter(ehCrianca).length;
  const totalAdultos = lista.length - totalCriancas;
  const pctAdultos = lista.length ? Math.round((totalAdultos / lista.length) * 100) : 0;
  const pctCriancas = lista.length ? 100 - pctAdultos : 0;

  const filtrados = lista.filter((g) => {
    if (busca && !g.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    if (fLado !== "todos" && g.lado !== fLado) return false;
    if (fGrupo !== "todos" && g.grupo !== fGrupo) return false;
    return true;
  });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  React.useEffect(() => { setPagina(1); }, [busca, fLado, fGrupo]);
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const paginados = filtrados.slice(inicio, inicio + POR_PAGINA);

  const openAdd = () => setForm(EMPTY_GUEST());
  const openEdit = (g) => setForm({ ...g });

  const salvar = (g) => {
    setLista((ls) => {
      if (g.id) return ls.map((x) => (x.id === g.id ? g : x));
      const novo = { ...g, id: "g" + Date.now() };
      return [novo, ...ls];
    });
    setForm(null);
  };
  const remover = (id) => {
    setLista((ls) => ls.filter((g) => g.id !== id));
    setForm(null);
  };

  return (
    <div className="screen">
      <SectionTitle kicker="CONVIDADOS" title="Lista de convidados"
        action={<button className="add-btn" onClick={openAdd}>+ Adicionar convidado</button>} />

      {/* totalizer */}
      <div className="orc-summary">
        <Card className="pad orc-sum-card">
          <div className="stat-label">Convidados</div>
          <div className="orc-big serif">{lista.length}</div>
          <div className="stat-sub">no total da lista</div>
        </Card>
        <Card className="pad orc-sum-card">
          <div className="stat-label">Por anfitrião</div>
          <div className="gt-bar">
            <div className="gt-seg lado-l" style={{ width: pctLuana + "%" }} />
            <div className="gt-seg lado-p" style={{ width: pctPaulo + "%" }} />
          </div>
          <div className="gt-legend">
            <span className="gt-leg"><span className="gt-key lado-l" />Luana <b>{totalLuana}</b><span className="gt-pct">{pctLuana}%</span></span>
            <span className="gt-leg"><span className="gt-key lado-p" />Paulo <b>{totalPaulo}</b><span className="gt-pct">{pctPaulo}%</span></span>
          </div>
        </Card>
        <Card className="pad orc-sum-card">
          <div className="stat-label">Por faixa</div>
          <div className="gt-bar">
            <div className="gt-seg faixa-a" style={{ width: pctAdultos + "%" }} />
            <div className="gt-seg faixa-c" style={{ width: pctCriancas + "%" }} />
          </div>
          <div className="gt-legend">
            <span className="gt-leg"><span className="gt-key faixa-a" />Adultos <b>{totalAdultos}</b><span className="gt-pct">{pctAdultos}%</span></span>
            <span className="gt-leg"><span className="gt-key faixa-c" />Crianças <b>{totalCriancas}</b><span className="gt-pct">{pctCriancas}%</span></span>
          </div>
        </Card>
      </div>

      {/* filters */}
      <Card className="pad">
        <div className="guest-toolbar">
          <input className="search" placeholder="Buscar convidado…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <div className="seg">
            {["todos", "Luana", "Paulo"].map((l) => <button key={l} className={"seg-btn" + (fLado === l ? " on" : "")} onClick={() => setFLado(l)}>{l === "todos" ? "Ambos" : "Lado " + l}</button>)}
          </div>
          <select className="select" value={fGrupo} onChange={(e) => setFGrupo(e.target.value)}>
            {grupos.map((g) => <option key={g} value={g}>{g === "todos" ? "Todos os grupos" : g}</option>)}
          </select>
        </div>

        {/* guest table */}
        <div className="guest-table">
          <div className="guest-head">
            <span>Convidado</span>
            <span>Lado</span>
            <span>Tipo</span>
            <span>Grupo</span>
            <span></span>
          </div>
          {paginados.map((g) => (
            <div key={g.id} className="guest-row">
              <span className="guest-name"><Avatar name={g.nome} lado={g.lado} />{g.nome}</span>
              <span className="muted-cell">{g.lado}</span>
              <span className="muted-cell">{(g.crianca || (g.idade != null && g.idade < 18)) ? "Criança" : "Adulto"}</span>
              <span className="muted-cell">{g.grupo}</span>
              <span className="guest-actions">
                <RowActions onEdit={() => openEdit(g)} onDelete={() => remover(g.id)} />
              </span>
            </div>
          ))}
          {filtrados.length === 0 && <div className="empty">Nenhum convidado com esses filtros.</div>}
        </div>
        <div className="guest-pager">
          <span className="guest-foot-hint">
            {filtrados.length === 0 ? "0" : (inicio + 1) + "–" + (inicio + paginados.length)} de {filtrados.length} convidados{filtrados.length !== lista.length ? " (filtrados)" : ""}
          </span>
          {totalPaginas > 1 && (
            <div className="pager">
              <button className="pager-btn" disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)}>‹</button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
                <button key={p} className={"pager-num" + (p === paginaAtual ? " on" : "")} onClick={() => setPagina(p)}>{p}</button>
              ))}
              <button className="pager-btn" disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)}>›</button>
            </div>
          )}
        </div>
      </Card>

      {form && <GuestForm draft={form} grupos={GRUPOS_BASE} onCancel={() => setForm(null)} onSave={salvar} onRemove={remover} />}
    </div>
  );
}

function GuestForm({ draft, grupos, onCancel, onSave, onRemove }) {
  const [d, setD] = React.useState(draft);
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const podeSalvar = d.nome.trim();
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-kicker">{d.id ? "EDITAR CONVIDADO" : "NOVO CONVIDADO"}</div>
            <div className="modal-title serif">{d.nome || "Cadastro de convidado"}</div>
          </div>
          <button className="modal-x" onClick={onCancel}>✕</button>
        </div>

        <div className="form-body">
          <div className="field">
            <label>Nome completo</label>
            <input className="f-input" value={d.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex: Ana Oliveira" />
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Lado</label>
              <select className="f-input" value={d.lado} onChange={(e) => set("lado", e.target.value)}>
                <option value="Luana">Luana</option>
                <option value="Paulo">Paulo</option>
              </select>
            </div>
            <div className="field">
              <label>Grupo</label>
              <input className="f-input" list="grupos-list" value={d.grupo} onChange={(e) => set("grupo", e.target.value)} placeholder="Ex: Família" />
              <datalist id="grupos-list">{grupos.map((g) => <option key={g} value={g} />)}</datalist>
            </div>
          </div>
          <div className="field">
            <label>Tipo</label>
            <div className="seg">
              <button className={"seg-btn" + (!d.crianca ? " on" : "")} onClick={() => set("crianca", false)}>Adulto</button>
              <button className={"seg-btn" + (d.crianca ? " on" : "")} onClick={() => set("crianca", true)}>Criança</button>
            </div>
          </div>
        </div>

        <div className="modal-foot">
          {d.id ? <button className="link-danger" onClick={() => onRemove(d.id)}>Excluir convidado</button> : <span></span>}
          <div className="vc-foot-btns">
            <button className="mini-btn" onClick={onCancel}>Cancelar</button>
            <button className={"add-btn solid" + (podeSalvar ? "" : " disabled")} disabled={!podeSalvar} onClick={() => onSave({ ...d, idade: d.idade === "" ? null : d.idade })}>
              {d.id ? "Salvar alterações" : "Adicionar convidado"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Convidados });
