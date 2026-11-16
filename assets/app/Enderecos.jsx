// Enderecos.jsx — endereços enviados pelos convidados na página pública
// Save the Date (coleção "enderecos" no Firestore). Só leitura/gestão do casal.
function Enderecos() {
  const [lista, setLista] = React.useState(null); // null = carregando
  const [erro, setErro] = React.useState("");
  const [busca, setBusca] = React.useState("");

  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : (t && t.seconds ? t.seconds * 1000 : 0));
  const fmtData = (t) => {
    const ms = tsMs(t);
    if (!ms) return "—";
    return new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  React.useEffect(() => {
    if (typeof firebase === "undefined" || !firebase.apps || !firebase.apps.length) {
      setErro("Os endereços ficam disponíveis apenas no modo nuvem (Firebase configurado).");
      setLista([]);
      return;
    }
    const db = firebase.firestore();
    const unsub = db.collection("enderecos").onSnapshot(
      (snap) => {
        const arr = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
        arr.sort((a, b) => tsMs(b.criadoEm) - tsMs(a.criadoEm));
        setLista(arr);
        setErro("");
      },
      (e) => { setErro(e.message || String(e)); setLista([]); }
    );
    return unsub;
  }, []);

  const remover = (id) => {
    firebase.firestore().collection("enderecos").doc(id).delete().catch((e) => setErro(e.message));
  };

  const filtrados = (lista || []).filter((g) => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return (g.nome || "").toLowerCase().includes(q) || (g.cidade || "").toLowerCase().includes(q);
  });

  const exportarCsv = () => {
    const cols = ["nome", "telefone", "email", "cep", "rua", "numero", "complemento", "bairro", "cidade", "uf"];
    const esc = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const linhas = [cols.join(",")].concat(filtrados.map((g) => cols.map((c) => esc(g[c])).join(",")));
    const blob = new Blob(["﻿" + linhas.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "enderecos-convidados.csv";
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div className="screen">
      <SectionTitle kicker="SAVE THE DATE" title="Endereços recebidos"
        action={lista && lista.length > 0 ? <button className="add-btn" onClick={exportarCsv}>Exportar CSV</button> : null} />

      {lista === null && <Card className="pad"><div className="empty">Carregando endereços…</div></Card>}

      {erro && <Card className="pad"><div className="empty">{erro}</div></Card>}

      {lista && lista.length === 0 && !erro && (
        <Card className="pad empty-cat">
          <div className="empty-cat-title serif">Nenhum endereço ainda</div>
          <div className="empty-cat-sub">Os endereços enviados pelos convidados em <b>silvaguedes.com/savethedate</b> aparecem aqui automaticamente, em tempo real.</div>
        </Card>
      )}

      {lista && lista.length > 0 && (
        <React.Fragment>
          <div className="orc-summary">
            <Card className="pad orc-sum-card">
              <div className="stat-label">Total recebido</div>
              <div className="orc-big serif">{lista.length}</div>
              <div className="stat-sub">endereço(s) de convidados</div>
            </Card>
          </div>

          <Card className="pad">
            <div className="guest-toolbar">
              <input className="search" placeholder="Buscar por nome ou cidade…" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>

            <div className="end-list">
              {filtrados.map((g) => (
                <div key={g.id} className="end-card">
                  <div className="end-top">
                    <div className="end-id">
                      <div className="end-nome serif">{g.nome || "—"}</div>
                      <div className="end-contato">{[g.telefone, g.email].filter(Boolean).join(" · ") || "sem contato"}</div>
                    </div>
                    <button className="icon-btn danger" title="Excluir" onClick={() => remover(g.id)}><TrashIcon /></button>
                  </div>
                  <div className="end-addr">
                    {[g.rua, g.numero].filter(Boolean).join(", ") || "sem rua"}{g.complemento ? " · " + g.complemento : ""}
                    <br />
                    {[g.bairro, [g.cidade, g.uf].filter(Boolean).join("/")].filter(Boolean).join(" — ")}{g.cep ? " · CEP " + g.cep : ""}
                  </div>
                  <div className="end-data">Enviado em {fmtData(g.criadoEm)}</div>
                </div>
              ))}
              {filtrados.length === 0 && <div className="empty">Nenhum resultado para “{busca}”.</div>}
            </div>
          </Card>
        </React.Fragment>
      )}
    </div>
  );
}

Object.assign(window, { Enderecos });
