// Enderecos.jsx — endereços enviados pelos convidados na página pública Save
// the Date. Componente apresentacional: recebe os dados e callbacks por props
// do Convidados (que é dono da subscription e da lista de convidados).
function Enderecos({ enderecos, carregando, erro, convidados, onVincular, onDesvincular, onCriar, onRemover }) {
  const [busca, setBusca] = React.useState("");
  const [vinculando, setVinculando] = React.useState(null); // id do envio em vínculo
  const [buscaVinc, setBuscaVinc] = React.useState("");

  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : (t && t.seconds ? t.seconds * 1000 : 0));
  const fmtData = (t) => {
    const ms = tsMs(t);
    if (!ms) return "—";
    return new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const nomePorId = {};
  (convidados || []).forEach((g) => { nomePorId[g.id] = g.nome; });

  const lista = enderecos || [];
  const filtrados = lista.filter((g) => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return (g.nome || "").toLowerCase().includes(q) || (g.cidade || "").toLowerCase().includes(q);
  });
  const vinculadosCount = lista.filter((g) => g.convidadoId).length;

  const guestsFiltrados = () => {
    const q = buscaVinc.trim().toLowerCase();
    const base = (convidados || []).filter((g) => g.id);
    const arr = q ? base.filter((g) => (g.nome || "").toLowerCase().includes(q)) : base;
    return arr.slice(0, 8);
  };
  const abrirVinculo = (id) => { setVinculando(id); setBuscaVinc(""); };

  const exportarCsv = () => {
    const cols = ["nome", "telefone", "email", "cep", "rua", "numero", "complemento", "bairro", "cidade", "uf"];
    const esc = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const linhas = [["convidado_vinculado"].concat(cols).join(",")].concat(
      filtrados.map((g) => [esc(g.convidadoId ? (nomePorId[g.convidadoId] || "") : "")].concat(cols.map((c) => esc(g[c]))).join(","))
    );
    const blob = new Blob(["﻿" + linhas.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "enderecos-convidados.csv";
    document.body.appendChild(a); a.click(); a.remove();
  };

  if (carregando) return <Card className="pad"><div className="empty">Carregando endereços…</div></Card>;
  if (erro) return <Card className="pad"><div className="empty">{erro}</div></Card>;
  if (lista.length === 0) return (
    <Card className="pad empty-cat">
      <div className="empty-cat-title serif">Nenhum endereço recebido ainda</div>
      <div className="empty-cat-sub">Os endereços enviados pelos convidados em <b>silvaguedes.com/savethedate</b> aparecem aqui automaticamente, em tempo real.</div>
    </Card>
  );

  return (
    <React.Fragment>
      <div className="orc-summary">
        <Card className="pad orc-sum-card">
          <div className="stat-label">Endereços recebidos</div>
          <div className="orc-big serif">{lista.length}</div>
          <div className="stat-sub">{vinculadosCount} vinculado(s) a convidados</div>
        </Card>
      </div>

      <Card className="pad">
        <div className="guest-toolbar">
          <input className="search" placeholder="Buscar por nome ou cidade…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <button className="add-btn" onClick={exportarCsv}>Exportar CSV</button>
        </div>

        <div className="end-list">
          {filtrados.map((g) => {
            const linkedName = g.convidadoId ? nomePorId[g.convidadoId] : null;
            return (
              <div key={g.id} className={"end-card" + (g.convidadoId ? " vinculado" : "")}>
                <div className="end-top">
                  <div className="end-id">
                    <div className="end-nome serif">{g.nome || "—"}</div>
                    <div className="end-contato">{[g.telefone, g.email].filter(Boolean).join(" · ") || "sem contato"}</div>
                  </div>
                  <button className="icon-btn danger" title="Excluir envio" onClick={() => onRemover(g.id)}><TrashIcon /></button>
                </div>
                <div className="end-addr">
                  {[g.rua, g.numero].filter(Boolean).join(", ") || "sem rua"}{g.complemento ? " · " + g.complemento : ""}
                  <br />
                  {[g.bairro, [g.cidade, g.uf].filter(Boolean).join("/")].filter(Boolean).join(" — ")}{g.cep ? " · CEP " + g.cep : ""}
                </div>
                <div className="end-foot">
                  <span className="end-data">Enviado em {fmtData(g.criadoEm)}</span>
                  {g.convidadoId ? (
                    <span className="end-vinc">
                      <span className="end-vinc-badge">✓ {linkedName || "convidado removido"}</span>
                      <button className="mini-btn" onClick={() => onDesvincular(g)}>Desvincular</button>
                    </span>
                  ) : vinculando === g.id ? (
                    <div className="end-picker">
                      <input className="f-input end-picker-input" autoFocus placeholder="Buscar convidado…" value={buscaVinc} onChange={(e) => setBuscaVinc(e.target.value)} />
                      <div className="end-picker-list">
                        {guestsFiltrados().map((c) => (
                          <button key={c.id} className="end-picker-item" onClick={() => { onVincular(g, c.id); setVinculando(null); }}>{c.nome}</button>
                        ))}
                        {guestsFiltrados().length === 0 && <div className="end-picker-empty">Nenhum convidado encontrado.</div>}
                      </div>
                      <div className="end-picker-actions">
                        <button className="mini-btn" onClick={() => setVinculando(null)}>Cancelar</button>
                        <button className="mini-btn solid" onClick={() => { onCriar(g); setVinculando(null); }}>+ Criar convidado</button>
                      </div>
                    </div>
                  ) : (
                    <button className="mini-btn vincular-btn" onClick={() => abrirVinculo(g.id)}>+ Vincular a convidado</button>
                  )}
                </div>
              </div>
            );
          })}
          {filtrados.length === 0 && <div className="empty">Nenhum resultado para “{busca}”.</div>}
        </div>
      </Card>
    </React.Fragment>
  );
}

Object.assign(window, { Enderecos });
