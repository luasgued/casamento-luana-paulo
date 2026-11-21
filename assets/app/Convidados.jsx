// Convidados.jsx — lista de convidados editável
// classificações padrão + as que já existem nos dados semente
const GRUPOS_PADRAO = ["Família", "Amigos", "Trabalho", "Padrinhos"];
const GRUPOS_BASE = Array.from(new Set([...GRUPOS_PADRAO, ...CONVIDADOS.map((g) => g.grupo)]));

const EMPTY_GUEST = () => ({
  id: null, nome: "", lado: "Luana", idade: 30, grupo: GRUPOS_BASE[0] || "Família",
  acompanhante: false, crianca: false, mesa: null, restricao: "", rsvp: "pendente",
  email: "", telefone: "", endereco: "", principalId: null,
  saveTheDateEnviado: false, conviteEnviado: false,
});

const RSVP_OPCOES = [
  { id: "pendente", label: "Pendente" },
  { id: "confirmado", label: "Confirmado" },
  { id: "recusado", label: "Recusou" },
];

function Convidados() {
  const [lista, setLista] = useStore("convidados", CONVIDADOS);
  const [busca, setBusca] = React.useState("");
  const [fLado, setFLado] = React.useState("todos");
  const [fGrupo, setFGrupo] = React.useState("todos");
  const [fStatus, setFStatus] = React.useState("todos");
  const [form, setForm] = React.useState(null);
  const [pagina, setPagina] = React.useState(1);
  const POR_PAGINA = 15;

  // contagens de status (envios e RSVP)
  const sdEnviados = lista.filter((g) => g.saveTheDateEnviado).length;
  const convEnviados = lista.filter((g) => g.conviteEnviado).length;
  const rsvpConfirmados = lista.filter((g) => g.rsvp === "confirmado").length;
  // nome do convidado principal por id (para mostrar o vínculo)
  const nomePorId = {};
  lista.forEach((g) => { nomePorId[g.id] = g.nome; });

  // ---- endereços recebidos (via página pública Save the Date) ----
  const [aba, setAba] = React.useState("convidados");
  const [enderecos, setEnderecos] = React.useState([]);
  const [endCarregando, setEndCarregando] = React.useState(true);
  const [endErro, setEndErro] = React.useState("");
  React.useEffect(() => {
    if (typeof firebase === "undefined" || !firebase.apps || !firebase.apps.length) {
      setEndErro("Os endereços ficam disponíveis apenas no modo nuvem (Firebase)."); setEndCarregando(false); return;
    }
    const unsub = firebase.firestore().collection("enderecos").onSnapshot(
      (snap) => {
        const arr = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
        arr.sort((a, b) => ((b.criadoEm && b.criadoEm.seconds) || 0) - ((a.criadoEm && a.criadoEm.seconds) || 0));
        setEnderecos(arr); setEndCarregando(false); setEndErro("");
      },
      (e) => { setEndErro(e.message || String(e)); setEndCarregando(false); }
    );
    return unsub;
  }, []);

  // monta um endereço legível a partir dos campos do envio
  const montarEndereco = (s) => [
    [s.rua, s.numero].filter(Boolean).join(", "),
    s.complemento, s.bairro,
    [s.cidade, s.uf].filter(Boolean).join("/"),
    s.cep ? "CEP " + s.cep : "",
  ].filter(Boolean).join(" · ");

  // vincula um envio a um convidado existente (e copia os dados recebidos)
  const vincularEndereco = (sub, guestId) => {
    if (typeof firebase !== "undefined" && firebase.apps.length) {
      firebase.firestore().collection("enderecos").doc(sub.id).update({ convidadoId: guestId }).catch(() => {});
    }
    setLista((ls) => ls.map((g) => g.id === guestId ? {
      ...g,
      email: sub.email || g.email || "",
      telefone: sub.telefone || g.telefone || "",
      endereco: montarEndereco(sub) || g.endereco || "",
    } : g));
  };
  const desvincularEndereco = (sub) => {
    if (typeof firebase !== "undefined" && firebase.apps.length) {
      firebase.firestore().collection("enderecos").doc(sub.id).update({ convidadoId: firebase.firestore.FieldValue.delete() }).catch(() => {});
    }
  };
  // cria um novo convidado a partir de um envio e já vincula
  const criarConvidadoDeEndereco = (sub) => {
    const id = "g" + Date.now();
    const novo = Object.assign(EMPTY_GUEST(), { id, nome: sub.nome || "Convidado", email: sub.email || "", telefone: sub.telefone || "", endereco: montarEndereco(sub) });
    setLista((ls) => [novo, ...ls]);
    if (typeof firebase !== "undefined" && firebase.apps.length) {
      firebase.firestore().collection("enderecos").doc(sub.id).update({ convidadoId: id }).catch(() => {});
    }
  };
  const removerEndereco = (id) => {
    if (typeof firebase !== "undefined" && firebase.apps.length) {
      firebase.firestore().collection("enderecos").doc(id).delete().catch(() => {});
    }
  };

  const grupos = ["todos", ...Array.from(new Set(lista.map((g) => g.grupo)))];
  // grupos disponíveis no formulário: padrão + os já usados pelos convidados
  const gruposForm = Array.from(new Set([...GRUPOS_BASE, ...lista.map((g) => g.grupo)].filter(Boolean)));

  const ehCrianca = (g) => g.crianca || (g.idade != null && g.idade < 18);
  const totalCriancas = lista.filter(ehCrianca).length;
  const totalAdultos = lista.length - totalCriancas;
  const pctAdultos = lista.length ? Math.round((totalAdultos / lista.length) * 100) : 0;
  const pctCriancas = lista.length ? 100 - pctAdultos : 0;

  // totalizador e quebra por anfitrião consideram apenas adultos
  const totalLuana = lista.filter((g) => g.lado === "Luana" && !ehCrianca(g)).length;
  const totalPaulo = lista.filter((g) => g.lado === "Paulo" && !ehCrianca(g)).length;
  const pctLuana = totalAdultos ? Math.round((totalLuana / totalAdultos) * 100) : 0;
  const pctPaulo = totalAdultos ? 100 - pctLuana : 0;

  const passaStatus = (g) => {
    switch (fStatus) {
      case "sd-pendente": return !g.saveTheDateEnviado;
      case "sd-enviado": return !!g.saveTheDateEnviado;
      case "conv-pendente": return !g.conviteEnviado;
      case "conv-enviado": return !!g.conviteEnviado;
      case "rsvp-confirmado": return g.rsvp === "confirmado";
      case "rsvp-pendente": return g.rsvp !== "confirmado";
      default: return true;
    }
  };
  const filtrados = lista.filter((g) => {
    if (busca && !g.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    if (fLado !== "todos" && g.lado !== fLado) return false;
    if (fGrupo !== "todos" && g.grupo !== fGrupo) return false;
    if (!passaStatus(g)) return false;
    return true;
  });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  React.useEffect(() => { setPagina(1); }, [busca, fLado, fGrupo, fStatus]);
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
        action={aba === "convidados" ? <button className="add-btn" onClick={openAdd}>+ Adicionar convidado</button> : null} />

      <div className="orc-tabs">
        <button className={"orc-tab" + (aba === "convidados" ? " active" : "")} onClick={() => setAba("convidados")}>Convidados</button>
        <button className={"orc-tab" + (aba === "enderecos" ? " active" : "")} onClick={() => setAba("enderecos")}>Endereços recebidos{enderecos.length ? " (" + enderecos.length + ")" : ""}</button>
      </div>

      {aba === "enderecos" ? (
        <Enderecos enderecos={enderecos} carregando={endCarregando} erro={endErro} convidados={lista}
          onVincular={vincularEndereco} onDesvincular={desvincularEndereco} onCriar={criarConvidadoDeEndereco} onRemover={removerEndereco} />
      ) : (
      <React.Fragment>
      {/* totalizer */}
      <div className="orc-summary">
        <Card className="pad orc-sum-card">
          <div className="stat-label">Convidados</div>
          <div className="orc-big serif">{totalAdultos}</div>
          <div className="stat-sub">adultos na lista{totalCriancas > 0 ? " · " + totalCriancas + " criança(s)" : ""}</div>
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

      {/* resumo de envios e confirmações */}
      <Card className="pad status-summary">
        <div className="ss-item">
          <div className="ss-top"><span className="ss-label">Save the Date</span><span className="ss-count">{sdEnviados}<span className="ss-of">/{lista.length}</span></span></div>
          <div className="ss-bar"><div className="ss-fill tone-sd" style={{ width: (lista.length ? sdEnviados / lista.length * 100 : 0) + "%" }} /></div>
          <div className="ss-sub">enviados</div>
        </div>
        <div className="ss-item">
          <div className="ss-top"><span className="ss-label">Convites</span><span className="ss-count">{convEnviados}<span className="ss-of">/{lista.length}</span></span></div>
          <div className="ss-bar"><div className="ss-fill tone-cv" style={{ width: (lista.length ? convEnviados / lista.length * 100 : 0) + "%" }} /></div>
          <div className="ss-sub">enviados</div>
        </div>
        <div className="ss-item">
          <div className="ss-top"><span className="ss-label">RSVP</span><span className="ss-count">{rsvpConfirmados}<span className="ss-of">/{lista.length}</span></span></div>
          <div className="ss-bar"><div className="ss-fill tone-rsvp" style={{ width: (lista.length ? rsvpConfirmados / lista.length * 100 : 0) + "%" }} /></div>
          <div className="ss-sub">confirmados</div>
        </div>
      </Card>

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
          <select className="select" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
            <option value="todos">Todos os status</option>
            <option value="sd-pendente">Save the Date pendente</option>
            <option value="sd-enviado">Save the Date enviado</option>
            <option value="conv-pendente">Convite pendente</option>
            <option value="conv-enviado">Convite enviado</option>
            <option value="rsvp-confirmado">RSVP confirmado</option>
            <option value="rsvp-pendente">RSVP não confirmado</option>
          </select>
        </div>

        {/* guest table */}
        <div className="guest-table guest-table-v2">
          <div className="guest-head">
            <span>Convidado</span>
            <span>Lado</span>
            <span>Grupo</span>
            <span>Status</span>
            <span></span>
          </div>
          {paginados.map((g) => (
            <div key={g.id} className="guest-row">
              <span className="guest-name">
                <Avatar name={g.nome} lado={g.lado} />
                <span className="guest-name-txt">
                  <span className="guest-name-main">{g.nome}</span>
                  <span className="guest-name-sub">
                    {(g.crianca || (g.idade != null && g.idade < 18)) ? "Criança" : "Adulto"}
                    {g.principalId && nomePorId[g.principalId] ? <span className="guest-sub-link"> · ↳ {nomePorId[g.principalId]}</span> : null}
                  </span>
                </span>
              </span>
              <span className="muted-cell">{g.lado}</span>
              <span className="muted-cell">{g.grupo}</span>
              <span className="guest-status">
                <span className={"st-chip" + (g.saveTheDateEnviado ? " on" : "")} title={g.saveTheDateEnviado ? "Save the Date enviado" : "Save the Date pendente"}>SD</span>
                <span className={"st-chip" + (g.conviteEnviado ? " on" : "")} title={g.conviteEnviado ? "Convite enviado" : "Convite pendente"}>Convite</span>
                <span className={"st-chip rsvp-" + (g.rsvp || "pendente")} title={"RSVP: " + (g.rsvp || "pendente")}>RSVP</span>
              </span>
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
      </React.Fragment>
      )}

      {form && <GuestForm draft={form} grupos={gruposForm} convidados={lista} onCancel={() => setForm(null)} onSave={salvar} onRemove={remover} />}
    </div>
  );
}

function GuestForm({ draft, grupos, convidados, onCancel, onSave, onRemove }) {
  const [d, setD] = React.useState(draft);
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const podeSalvar = d.nome.trim();
  // candidatos a "convidado principal" (todos, menos ele mesmo)
  const principais = (convidados || []).filter((c) => c.id && c.id !== d.id);
  // opções do seletor de grupo = lista recebida + o grupo atual (se for custom)
  const opcoesGrupo = Array.from(new Set([...grupos, ...(d.grupo ? [d.grupo] : [])].filter(Boolean)));
  // começa no modo "novo grupo" se o convidado não tem grupo definido
  const [novoGrupo, setNovoGrupo] = React.useState(!d.grupo);
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
              {novoGrupo ? (
                <div className="grupo-novo">
                  <input className="f-input" autoFocus value={d.grupo} onChange={(e) => set("grupo", e.target.value)} placeholder="Nome do novo grupo (ex: Faculdade)" />
                  {opcoesGrupo.length > 0 && (
                    <button type="button" className="mini-btn" onClick={() => { setNovoGrupo(false); if (!opcoesGrupo.includes(d.grupo)) set("grupo", opcoesGrupo[0]); }}>Escolher da lista</button>
                  )}
                </div>
              ) : (
                <select className="f-input" value={d.grupo} onChange={(e) => {
                  if (e.target.value === "__novo__") { setNovoGrupo(true); set("grupo", ""); }
                  else set("grupo", e.target.value);
                }}>
                  {opcoesGrupo.map((g) => <option key={g} value={g}>{g}</option>)}
                  <option value="__novo__">+ Adicionar novo grupo…</option>
                </select>
              )}
            </div>
          </div>
          <div className="field">
            <label>Tipo</label>
            <div className="seg">
              <button className={"seg-btn" + (!d.crianca ? " on" : "")} onClick={() => set("crianca", false)}>Adulto</button>
              <button className={"seg-btn" + (d.crianca ? " on" : "")} onClick={() => set("crianca", true)}>Criança</button>
            </div>
          </div>

          <div className="form-sep">Contato</div>
          <div className="form-grid">
            <div className="field">
              <label>E-mail</label>
              <input className="f-input" type="email" value={d.email || ""} onChange={(e) => set("email", e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="field">
              <label>Telefone</label>
              <input className="f-input" value={d.telefone || ""} onChange={(e) => set("telefone", e.target.value)} placeholder="(11) 90000-0000" />
            </div>
          </div>
          <div className="field">
            <label>Endereço</label>
            <textarea className="f-input" rows="2" value={d.endereco || ""} onChange={(e) => set("endereco", e.target.value)} placeholder="Rua, número, bairro, cidade/UF, CEP"></textarea>
          </div>
          <div className="field">
            <label>Convidado principal (atrelar a outro convidado)</label>
            <select className="f-input" value={d.principalId || ""} onChange={(e) => set("principalId", e.target.value || null)}>
              <option value="">— Nenhum (é um convidado principal) —</option>
              {principais.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          <div className="form-sep">Acompanhamento</div>
          <div className="field">
            <label>RSVP (confirmação de presença)</label>
            <div className="seg">
              {RSVP_OPCOES.map((o) => (
                <button key={o.id} className={"seg-btn" + (d.rsvp === o.id ? " on" : "")} onClick={() => set("rsvp", o.id)}>{o.label}</button>
              ))}
            </div>
          </div>
          <label className="check-row">
            <input type="checkbox" checked={!!d.saveTheDateEnviado} onChange={(e) => set("saveTheDateEnviado", e.target.checked)} />
            <span>Save the Date já enviado</span>
          </label>
          <label className="check-row">
            <input type="checkbox" checked={!!d.conviteEnviado} onChange={(e) => set("conviteEnviado", e.target.checked)} />
            <span>Convite já enviado</span>
          </label>
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
