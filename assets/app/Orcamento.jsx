// Orcamento.jsx — duas abas: Previsto × Realizado e Orçamento Final (fluxo mensal)
const ORC_STATUS = [
{ id: "nao-iniciado", label: "Não iniciado" },
{ id: "cotando", label: "Cotando" },
{ id: "contratado", label: "Contratado" }];


// meses de (início) até o mês do casamento, inclusive
function mesesAte(fimStr, startY, startM) {
  const fim = new Date(fimStr);
  const out = [];
  let d = new Date(startY, startM, 1);
  const cap = new Date(fim.getFullYear(), fim.getMonth(), 1);
  let guard = 0;
  while (d <= cap && guard < 48) {
    out.push({
      key: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"),
      mes: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      ano: d.getFullYear()
    });
    d.setMonth(d.getMonth() + 1);guard++;
  }
  return out;
}

const novoItem = () => ({
  id: "o" + Date.now(), nome: "", status: "nao-iniciado", previsto: 0, realizado: 0,
  fornecedor: "", contato: "", instagram: "", parcelas: "", pagamentos: {}
});

// ícones de ação
function PencilIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M11.3 2.7l2 2L5.5 12.5l-2.6.6.6-2.6 7.8-7.8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M10.2 3.8l2 2" stroke="currentColor" strokeWidth="1.3" /></svg>;
}
function TrashIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 4.5h10M6.5 4.5V3.2c0-.4.3-.7.7-.7h1.6c.4 0 .7.3.7.7v1.3M4.2 4.5l.5 8c0 .5.4.8.8.8h5c.4 0 .8-.3.8-.8l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function RowActions({ onEdit, onDelete }) {
  return (
    <span className="row-actions">
      <button className="icon-btn" title="Editar" onClick={onEdit}><PencilIcon /></button>
      <button className="icon-btn danger" title="Excluir" onClick={onDelete}><TrashIcon /></button>
    </span>);

}

function Orcamento() {
  const [linhas, setLinhas] = useStore("orcamento", ORCAMENTO);
  const [aba, setAba] = React.useState("previsto");
  const [edit, setEdit] = React.useState(null); // item draft for card

  const totalPrev = linhas.reduce((s, c) => s + (+c.previsto || 0), 0);
  const totalReal = linhas.reduce((s, c) => s + (+c.realizado || 0), 0);
  const diff = totalPrev - totalReal;

  // teto fixo do casamento e saldo considerando apenas itens contratados
  const tetoTotal = WEDDING.orcamentoTotal;
  const contratadoComprometido = linhas.
  filter((c) => c.status === "contratado").
  reduce((s, c) => s + (+c.realizado || 0 || +c.previsto || 0), 0);
  const saldoTeto = tetoTotal - contratadoComprometido;

  // comprometimento futuro: itens ainda não fechados
  const emCotacao = linhas.filter((c) => c.status === "cotando").reduce((s, c) => s + (+c.previsto || 0), 0);
  const naoIniciado = linhas.filter((c) => c.status === "nao-iniciado").reduce((s, c) => s + (+c.previsto || 0), 0);
  const projetado = contratadoComprometido + emCotacao + naoIniciado;
  const livre = Math.max(0, tetoTotal - projetado);
  const acima = Math.max(0, projetado - tetoTotal);
  const base = Math.max(tetoTotal, projetado);
  const pct = (v) => (base ? v / base * 100 : 0) + "%";
  const alloc = [
  { k: "Contratado", v: contratadoComprometido, cls: "a-contratado" },
  { k: "Em cotação", v: emCotacao, cls: "a-cotacao" },
  { k: "Não iniciado", v: naoIniciado, cls: "a-naoini" },
  acima > 0 ? { k: "Acima do teto", v: acima, cls: "a-acima" } : { k: "Saldo livre", v: livre, cls: "a-livre" }];


  const setStatus = (id, status) => setLinhas((ls) => ls.map((c) => c.id === id ? { ...c, status } : c));
  const salvar = (draft) => {
    setLinhas((ls) => ls.some((c) => c.id === draft.id) ?
    ls.map((c) => c.id === draft.id ? draft : c) :
    [...ls, draft]);
    setEdit(null);
  };
  const remover = (id) => {setLinhas((ls) => ls.filter((c) => c.id !== id));setEdit(null);};
  // reordena a linha na lista mestre (reflete nas duas abas)
  const mover = (id, dir) => setLinhas((ls) => {
    const i = ls.findIndex((c) => c.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= ls.length) return ls;
    const arr = [...ls];[arr[i], arr[j]] = [arr[j], arr[i]];return arr;
  });

  return (
    <div className="screen">
      <SectionTitle kicker="FINANÇAS" title="Orçamento" />

      {/* comprometimento do orçamento — visão principal */}
      <Card className="pad orc-alloc">
        <div className="alloc-head">
          <div>
            <div className="kicker">COMPROMETIMENTO DO ORÇAMENTO</div>
            <div className="alloc-title serif">{Math.round(projetado / tetoTotal * 100)}% do teto projetado</div>
          </div>
          <div className="alloc-teto">
            <div className="alloc-teto-v serif">{brl(projetado)}<span> / {brl(tetoTotal)}</span></div>
            <div className="alloc-teto-l">{acima > 0 ? brl(acima) + " acima do teto" : brl(livre) + " ainda livres"}</div>
          </div>
        </div>
        <div className="alloc-bar">
          {alloc.map((a) => a.v > 0 &&
          <div key={a.k} className={"alloc-seg " + a.cls} style={{ width: pct(a.v) }} title={a.k + ": " + brl(a.v)} />
          )}
        </div>
        <div className="alloc-legend">
          {alloc.map((a) =>
          <div key={a.k} className="alloc-leg-item">
              <span className={"alloc-dot " + a.cls} />
              <span className="alloc-leg-k">{a.k}</span>
              <span className="alloc-leg-v">{brl(a.v)}</span>
            </div>
          )}
        </div>
      </Card>

      {/* totalizadores — secundários, compactos */}
      <div className="orc-summary">
        <Card className="pad orc-sum-card">
          <div className="stat-label">Orçamento total</div>
          <div className="orc-big serif">{brl(tetoTotal)}</div>
          <div className="stat-sub">verba definida para o casamento</div>
        </Card>
        <Card className="pad orc-sum-card">
          <div className="stat-label">Realizado × Previsto</div>
          <div className="orc-big serif">{brl(totalReal)}<span className="orc-of"> / {brl(totalPrev)}</span></div>
          <div className="orc-prevbar"><div className="orc-prevbar-fill" style={{ width: Math.min(100, totalPrev ? totalReal / totalPrev * 100 : 0) + "%" }} /></div>
          <div className="stat-sub">{totalPrev ? Math.round(totalReal / totalPrev * 100) : 0}% do previsto já realizado</div>
        </Card>
        <Card className={"pad orc-sum-card highlight " + (saldoTeto >= 0 ? "tone-good" : "tone-off")}>
          <div className="stat-label">{saldoTeto >= 0 ? "Saldo disponível" : "Acima do teto"}</div>
          <div className="orc-big serif">{(saldoTeto < 0 ? "−" : "") + brl(Math.abs(saldoTeto))}</div>
          <div className="stat-sub">{brl(contratadoComprometido)} já contratados de {brl(tetoTotal)}</div>
        </Card>
      </div>

      {/* tabs */}
      <div className="orc-tabs">
        <button className={"orc-tab" + (aba === "previsto" ? " active" : "")} onClick={() => setAba("previsto")}>Previsto × Realizado</button>
        <button className={"orc-tab" + (aba === "final" ? " active" : "")} onClick={() => setAba("final")}>Orçamento Final · Fluxo de pagamento</button>
      </div>

      {aba === "previsto" ?
      <AbaPrevisto linhas={linhas} setStatus={setStatus} onEdit={setEdit} onDelete={remover} onMove={mover} onAdd={() => setEdit(novoItem())} totalPrev={totalPrev} totalReal={totalReal} diff={diff} /> :
      <AbaFinal linhas={linhas} setLinhas={setLinhas} onEditItem={setEdit} onDelete={remover} onAdd={() => setEdit({ ...novoItem(), status: "contratado" })} />}

      {edit && <ItemCard draft={edit} onCancel={() => setEdit(null)} onSave={salvar} onRemove={remover} />}
    </div>);

}

// ---- Aba 1: Previsto × Realizado ---------------------------------------
function AbaPrevisto({ linhas, setStatus, onEdit, onDelete, onMove, onAdd, totalPrev, totalReal, diff }) {
  return (
    <Card className="pad">
      <div className="orc-bar">
        <SectionTitle kicker="POR ITEM" title="Previsto × Realizado" />
        <button className="add-btn" onClick={onAdd}>+ Adicionar item</button>
      </div>
      <div className="orc-scroll">
        <div className="orc2-table">
          <div className="orc2-head">
            <span>Item</span>
            <span style={{ textAlign: "center" }}>Status</span>
            <span className="num">PREVISÃO</span>
            <span className="num">REAL</span>
            <span className="num">Diferença</span>
            <span></span>
          </div>
          {linhas.map((c, i) => {
            const saldo = (+c.previsto || 0) - (+c.realizado || 0);
            const m = STATUS_MAP[c.status] || { tone: "muted" };
            return (
              <div key={c.id} className="orc2-row">
                <span className="orc-cat">
                  <span className="orc-cat-name">{c.nome}</span>
                  <span className="orc-cat-sub">{c.fornecedor || "sem fornecedor definido"}</span>
                </span>
                <span>
                  <select className={"status-select tone-" + m.tone} value={c.status} onChange={(e) => setStatus(c.id, e.target.value)}>
                    {ORC_STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </span>
                <span className="num">{c.previsto ? brl(c.previsto) : <span className="dash">—</span>}</span>
                <span className="num">{c.realizado ? brl(c.realizado) : <span className="dash">—</span>}</span>
                <span className={"num saldo " + (saldo < 0 ? "neg" : saldo > 0 ? "pos" : "")}>
                  {c.realizado ? (saldo < 0 ? "−" : "+") + brl(Math.abs(saldo)) : <span className="dash">—</span>}
                </span>
                <span className="orc-actions">
                  <ReorderButtons vertical onUp={() => onMove(c.id, -1)} onDown={() => onMove(c.id, 1)} upDisabled={i === 0} downDisabled={i === linhas.length - 1} />
                  <RowActions onEdit={() => onEdit({ ...c })} onDelete={() => onDelete(c.id)} />
                </span>
              </div>);

          })}
          <div className="orc2-foot">
            <span>Total</span>
            <span></span>
            <span className="num">{brl(totalPrev)}</span>
            <span className="num">{brl(totalReal)}</span>
            <span className={"num saldo " + (diff < 0 ? "neg" : "pos")}>{(diff < 0 ? "−" : "+") + brl(Math.abs(diff))}</span>
            <span></span>
          </div>
        </div>
      </div>
      <div className="orc-legend">
        <span className="orc-legend-hint">Clique no <b>status</b> para alterar entre Não iniciado · Cotando · Contratado. Use <b>Editar</b> para abrir o item e ajustar valores e dados do fornecedor.</span>
      </div>
    </Card>);

}

// ---- Aba 2: Orçamento Final (fluxo mensal) -----------------------------
function AbaFinal({ linhas, setLinhas, onEditItem, onDelete, onAdd }) {
  const fechados = linhas.filter((c) => c.status === "contratado");
  const meses = mesesAte(WEDDING.data, 2026, 0); // a partir de jan/2026 até o mês do casamento
  const [cell, setCell] = React.useState(null); // {id, mes}
  const [val, setVal] = React.useState("");

  const totalItem = (c) => meses.reduce((s, m) => s + (+(c.pagamentos || {})[m.key] || 0), 0);
  const totalMes = (mk) => fechados.reduce((s, c) => s + (+(c.pagamentos || {})[mk] || 0), 0);
  const totalGeral = fechados.reduce((s, c) => s + totalItem(c), 0);

  const startEdit = (id, mk, cur) => {setCell({ id, mes: mk });setVal(cur ? String(cur) : "");};
  const commit = () => {
    if (!cell) return;
    setLinhas((ls) => ls.map((c) => {
      if (c.id !== cell.id) return c;
      const pg = { ...(c.pagamentos || {}) };
      const n = +val || 0;
      if (n > 0) pg[cell.mes] = n;else delete pg[cell.mes];
      return { ...c, pagamentos: pg };
    }));
    setCell(null);setVal("");
  };

  // reordena entre os itens contratados (troca posição na lista mestre)
  const moverFechado = (id, dir) => setLinhas((ls) => {
    const fech = ls.filter((c) => c.status === "contratado");
    const fi = fech.findIndex((c) => c.id === id), tj = fi + dir;
    if (fi < 0 || tj < 0 || tj >= fech.length) return ls;
    const arr = [...ls];
    const ia = arr.findIndex((c) => c.id === fech[fi].id);
    const ib = arr.findIndex((c) => c.id === fech[tj].id);
    [arr[ia], arr[ib]] = [arr[ib], arr[ia]];
    return arr;
  });

  // ano agrupado para cabeçalho
  const anos = [];
  meses.forEach((m) => {const a = anos.find((x) => x.ano === m.ano);if (a) a.span++;else anos.push({ ano: m.ano, span: 1 });});

  return (
    <Card className="pad">
      <div className="orc-bar">
        <SectionTitle kicker="FORNECEDORES FECHADOS" title="Fluxo de pagamento até o casamento" />
        <button className="add-btn" onClick={onAdd}>+ Adicionar item</button>
      </div>

      {fechados.length === 0 ?
      <div className="orc-empty">Nenhum item contratado ainda. Marque um item como <b>Contratado</b> na aba anterior, ou adicione um item fechado aqui.</div> :

      <div className="orc-scroll">
          <table className="cash">
            <thead>
              <tr className="cash-years">
                <th className="cash-item sticky-l" rowSpan="2">ITEM</th>
                <th className="cash-total num" rowSpan="2">Valor total</th>
                <th className="cash-acts" rowSpan="2"></th>
                {anos.map((a) => <th key={a.ano} colSpan={a.span} className="cash-year">{a.ano}</th>)}
              </tr>
              <tr className="cash-months">
                {meses.map((m) => <th key={m.key} className="cash-m num">{m.mes}</th>)}
              </tr>
            </thead>
            <tbody>
              {fechados.map((c, i) =>
            <tr key={c.id}>
                  <td className="cash-item sticky-l">
                    <span className="cash-cat">
                      <span className="cash-name">{c.nome}</span>
                      <span className="cash-forn-sub">{c.fornecedor || "sem fornecedor definido"}</span>
                    </span>
                  </td>
                  <td className="cash-total num serif">{brl(totalItem(c))}</td>
                  <td className="cash-acts">
                    <ReorderButtons vertical onUp={() => moverFechado(c.id, -1)} onDown={() => moverFechado(c.id, 1)} upDisabled={i === 0} downDisabled={i === fechados.length - 1} />
                    <RowActions onEdit={() => onEditItem({ ...c })} onDelete={() => onDelete(c.id)} />
                  </td>
                  {meses.map((m) => {
                const v = (c.pagamentos || {})[m.key];
                const isEd = cell && cell.id === c.id && cell.mes === m.key;
                return (
                  <td key={m.key} className={"cash-cell num" + (v ? " has" : "")}>
                        {isEd ?
                    <input autoFocus className="cash-input" type="number" value={val}
                    onChange={(e) => setVal(e.target.value)} onBlur={commit}
                    onKeyDown={(e) => {if (e.key === "Enter") commit();if (e.key === "Escape") {setCell(null);setVal("");}}} /> :

                    <button className="cash-cellbtn" onClick={() => startEdit(c.id, m.key, v)}>{v ? brlShort(v) : ""}</button>
                    }
                      </td>);

              })}
                </tr>
            )}
              <tr className="cash-foot">
                <td className="cash-item sticky-l">Total · {fechados.length} itens</td>
                <td className="cash-total num serif">{brl(totalGeral)}</td>
                <td className="cash-acts"></td>
                {meses.map((m) => {
                const t = totalMes(m.key);
                return <td key={m.key} className={"cash-cell num" + (t ? " has" : "")}>{t ? brlShort(t) : ""}</td>;
              })}
              </tr>
            </tbody>
          </table>
        </div>
      }
      <div className="orc-legend">
        <span className="orc-legend-hint">Clique em qualquer célula de mês para lançar/editar um pagamento · clique no <b>nome do item</b> para editar fornecedor e dados. O total recalcula sozinho.</span>
      </div>
    </Card>);

}

// ---- Card de edição de item --------------------------------------------
function ItemCard({ draft, onCancel, onSave, onRemove }) {
  const [d, setD] = React.useState(draft);
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const existe = ORCAMENTO.some((c) => c.id === d.id) || !String(d.id).startsWith("o");
  const saldo = (+d.previsto || 0) - (+d.realizado || 0);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-kicker">{d.nome ? "EDITAR ITEM" : "NOVO ITEM"}</div>
            <div className="modal-title serif">{d.nome || "Item do orçamento"}</div>
          </div>
          <button className="modal-x" onClick={onCancel}>✕</button>
        </div>

        <div className="form-body">
          <div className="form-grid">
            <div className="field">
              <label>Nome do item</label>
              <input className="f-input" value={d.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex: Buffet & Gastronomia" />
            </div>
            <div className="field">
              <label>Status</label>
              <select className="f-input" value={d.status} onChange={(e) => set("status", e.target.value)}>
                {ORC_STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Previsão de gastos</label>
              <input className="f-input" type="number" value={d.previsto} onChange={(e) => set("previsto", +e.target.value || 0)} placeholder="0" />
            </div>
            <div className="field">
              <label>Gastos reais</label>
              <input className="f-input" type="number" value={d.realizado} onChange={(e) => set("realizado", +e.target.value || 0)} placeholder="0" />
            </div>
          </div>

          <div className={"item-diff " + (saldo < 0 ? "neg" : "pos")}>
            Diferença: <b>{(saldo < 0 ? "−" : "+") + brl(Math.abs(saldo))}</b> {saldo < 0 ? "acima do previsto" : "de saldo"}
          </div>

          <div className="form-sep">Dados do fornecedor</div>
          <div className="form-grid">
            <div className="field">
              <label>Fornecedor</label>
              <input className="f-input" value={d.fornecedor || ""} onChange={(e) => set("fornecedor", e.target.value)} placeholder="Nome do fornecedor" />
            </div>
            <div className="field">
              <label>Contato</label>
              <input className="f-input" value={d.contato || ""} onChange={(e) => set("contato", e.target.value)} placeholder="Nome · (11) 9 0000-0000" />
            </div>
            <div className="field">
              <label>Instagram</label>
              <div className="ig-input-wrap">
                <span className="ig-at">@</span>
                <input className="f-input ig-input" value={(d.instagram || "").replace(/^@/, "")} onChange={(e) => set("instagram", e.target.value ? "@" + e.target.value.replace(/^@/, "") : "")} placeholder="perfil_do_fornecedor" />
              </div>
            </div>
            <div className="field">
              <label>Forma de pagamento</label>
              <input className="f-input" value={d.parcelas || ""} onChange={(e) => set("parcelas", e.target.value)} placeholder="Ex: 30% sinal + 4x" />
            </div>
          </div>
        </div>

        <div className="modal-foot">
          {existe ? <button className="link-danger" onClick={() => onRemove(d.id)}>Remover item</button> : <span></span>}
          <div className="vc-foot-btns">
            <button className="mini-btn" onClick={onCancel}>Cancelar</button>
            <button className={"add-btn solid" + (d.nome.trim() ? "" : " disabled")} disabled={!d.nome.trim()} onClick={() => onSave(d)}>
              {d.nome ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </div>
      </div>
    </div>);

}

Object.assign(window, { Orcamento, RowActions, PencilIcon, TrashIcon });