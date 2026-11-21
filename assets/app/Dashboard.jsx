// Dashboard.jsx — Visão Geral
const { useState: useStateDash } = React;

function useCountdown(dateStr) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000 * 30);
    return () => clearInterval(t);
  }, []);
  const target = new Date(dateStr).getTime();
  const diff = Math.max(0, target - now);
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const meses = Math.floor(dias / 30.44);
  return { dias, meses };
}

function Dashboard({ go, tasks }) {
  const { dias, meses } = useCountdown(WEDDING.data);
  // Dados do banco compartilhado — refletem em tempo real o que é
  // editado/apagado nas telas de Orçamento, Convidados e Fornecedores.
  const [ORC] = useStore("orcamento", ORCAMENTO);
  const [GUESTS] = useStore("convidados", CONVIDADOS);
  const [VENDORS] = useStore("fornecedores", FORNECEDORES);
  const [CATS] = useStore("categorias", CATEGORIAS);
  const [CRONO] = useStore("cronograma", []);

  const totalPrev = ORC.reduce((s, c) => s + (+c.previsto || 0), 0);
  const totalReal = ORC.reduce((s, c) => s + (+c.realizado || 0), 0);
  const tetoTotal = WEDDING.orcamentoTotal;

  // "hoje" real — tudo que depende do mês vigente se atualiza sozinho a cada mês
  const HOJE_D = new Date();
  const MESES_PT = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const mesKey = HOJE_D.getFullYear() + "-" + String(HOJE_D.getMonth() + 1).padStart(2, "0");
  const nomeMes = MESES_PT[HOJE_D.getMonth()];
  const nomeMesCap = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);

  // pagamentos do mês vigente (aba Orçamento Final · fluxo de pagamento)
  const pagamentosMes = ORC.filter((c) => (c.pagamentos || {})[mesKey] != null).length;
  const valorMes = ORC.reduce((s, c) => s + (((c.pagamentos || {})[mesKey]) || 0), 0);

  // cronograma do mês vigente
  const cronoMes = CRONO.filter((i) => i.mes === mesKey);
  const cronoFeitos = cronoMes.filter((i) => i.feito).length;

  // ---- convidados ----
  const ehCriancaG = (g) => g.crianca || (g.idade != null && g.idade < 18);
  const ehNoivoOuPadrinho = (g) => {
    const grp = (g.grupo || "").toLowerCase().trim();
    return grp === "padrinhos" || grp === "padrinho" || grp === "noivos" || grp === "noivo" || grp === "noiva" || grp === "casal";
  };
  const totalConv = GUESTS.length;
  const criancas = GUESTS.filter(ehCriancaG).length;
  const adultos = totalConv - criancas;
  const principais = GUESTS.filter((g) => !g.principalId && !ehNoivoOuPadrinho(g)).length;
  const sdEnviados = GUESTS.filter((g) => g.saveTheDateEnviado).length;
  const convEnviados = GUESTS.filter((g) => g.conviteEnviado).length;
  const rsvpConfirmados = GUESTS.filter((g) => g.rsvp === "confirmado").length;
  const rsvpRecusados = GUESTS.filter((g) => g.rsvp === "recusado").length;

  const contratados = ORC.filter((c) => c.fornecedor).length;
  const decidir = VENDORS.filter((f) => f.status === "favorito" || f.status === "analise");

  const abertas = (tasks || []).filter((t) => t.status !== "done");
  const fazendo = (tasks || []).filter((t) => t.status === "doing");
  const atrasadas = abertas.filter((t) => new Date(t.prazo + "T00:00:00") < HOJE_D);
  const proximas = [...abertas].sort((a, b) => new Date(a.prazo) - new Date(b.prazo)).slice(0, 4);
  const cargaL = abertas.filter((t) => t.responsavel === "Luana" || t.responsavel === "Ambos").length;
  const cargaP = abertas.filter((t) => t.responsavel === "Paulo" || t.responsavel === "Ambos").length;

  const donutSegs = [
  { label: "Realizado", value: totalReal, color: "var(--accent)" },
  { label: "A contratar", value: Math.max(0, totalPrev - totalReal), color: "var(--line-strong)" }];


  const respCls = (r) => r === "Luana" ? "r-l" : r === "Paulo" ? "r-p" : "r-ambos";
  const respLabel = (r) => r === "Ambos" ? "L·P" : r[0];
  const fmtP = (d) => new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");

  return (
    <div className="screen">
      {/* Hero */}
      <div className="hero">
        <div className="hero-mono">PLANEJADOR DE CASAMENTO</div>
        <h1 className="hero-names serif">{WEDDING.noiva} <span className="amp">&</span> {WEDDING.noivo}</h1>
        <div className="hero-meta">{WEDDING.dataLabel} · {WEDDING.local}</div>
        <div className="brand-dots"><span></span><span></span><span></span></div>
        <div className="countdown">
          <div className="cd-num serif">{dias}</div>
          <div className="cd-unit">
            <div>dias para o grande dia</div>
            <div className="cd-sub">≈ {meses} meses · {abertas.length} tarefas em aberto</div>
          </div>
        </div>
      </div>

      {/* KPI row — gestão em primeiro plano */}
      <div className="kpi-grid">
        <Card className="kpi clickable" onClick={() => go("orcamento")}>
          <div className="kpi-top"><span className="kpi-label">Real × Orçamento</span><span className="chev">→</span></div>
          <div className="kpi-value serif">{brlShort(totalReal)}</div>
          <div className="kpi-foot"><Progress value={totalReal} max={tetoTotal} tone="accent" /><span>{tetoTotal ? Math.round(totalReal / tetoTotal * 100) : 0}% de {brlShort(tetoTotal)} gasto</span></div>
        </Card>
        <Card className="kpi clickable" onClick={() => go("orcamento")}>
          <div className="kpi-top"><span className="kpi-label">Pagamentos de {nomeMesCap}</span><span className="chev">→</span></div>
          <div className="kpi-value serif">{valorMes > 0 ? brlShort(valorMes) : "—"}</div>
          <div className="kpi-foot"><span>{pagamentosMes === 0 ? "nenhum pagamento previsto neste mês" : pagamentosMes + (pagamentosMes === 1 ? " pagamento a fazer" : " pagamentos a fazer")}</span></div>
        </Card>
        <Card className="kpi clickable" onClick={() => go("tarefas")}>
          <div className="kpi-top"><span className="kpi-label">Tarefas em aberto</span><span className="chev">→</span></div>
          <div className="kpi-value serif">{abertas.length}<span className="kpi-of"> / {(tasks || []).length}</span></div>
          <div className="kpi-foot"><Progress value={(tasks || []).length - abertas.length} max={(tasks || []).length} tone="good" /><span>{atrasadas.length > 0 ? atrasadas.length + " atrasada(s)" : fazendo.length + " em andamento"}</span></div>
        </Card>
        <Card className="kpi clickable" onClick={() => go("convidados")}>
          <div className="kpi-top"><span className="kpi-label">Convidados</span><span className="chev">→</span></div>
          <div className="kpi-value serif">{totalConv}</div>
          <div className="kpi-foot"><Progress value={rsvpConfirmados} max={totalConv} tone="good" /><span>{rsvpConfirmados} confirmaram o RSVP</span></div>
        </Card>
      </div>

      {/* two column — orçamento + tarefas */}
      <div className="two-col">
        <Card className="pad">
          <SectionTitle kicker="CRONOGRAMA" title={"Tarefas de " + nomeMesCap} action={<button className="link-btn" onClick={() => go("cronograma")}>Abrir</button>} />
          {cronoMes.length === 0 ?
          <div className="crono-empty-dash">
              <div className="ced-ico">🗓️</div>
              <div className="ced-txt">Nenhuma tarefa cadastrada para {nomeMes}.</div>
              <button className="link-btn" onClick={() => go("cronograma")}>Adicionar no cronograma →</button>
            </div> :

          <div className="crono-dash">
              <div className="crono-dash-head">
                <span className="cdh-num serif">{cronoFeitos}<span className="cdh-of">/{cronoMes.length}</span></span>
                <span className="cdh-lbl">{cronoFeitos === cronoMes.length ? "tudo concluído este mês 🎉" : "tarefas concluídas em " + nomeMes}</span>
              </div>
              <Progress value={cronoFeitos} max={cronoMes.length} tone="good" />
              <ul className="crono-dash-list">
                {cronoMes.slice(0, 6).map((i) =>
              <li key={i.id} className={"cdl-item" + (i.feito ? " feito" : "")}>
                    <span className={"cdl-check" + (i.feito ? " on" : "")}>{i.feito ? "✓" : ""}</span>
                    <span className="cdl-text">{i.titulo || "Tarefa sem título"}</span>
                  </li>
              )}
                {cronoMes.length > 6 &&
              <li className="cdl-more" onClick={() => go("cronograma")}>+ {cronoMes.length - 6} tarefa(s) — ver todas</li>}
              </ul>
            </div>
          }
        </Card>

        <Card className="pad">
          <SectionTitle kicker="PRÓXIMOS PRAZOS" title="Tarefas" action={<button className="link-btn" onClick={() => go("tarefas")}>Ver quadro</button>} />
          <div className="dash-carga">
            <span className="wl-item"><span className="resp-ini r-l">L</span>{cargaL} abertas</span>
            <span className="wl-item"><span className="resp-ini r-p">P</span>{cargaP} abertas</span>
          </div>
          <ul className="tasks">
            {proximas.map((t) => {
              const late = new Date(t.prazo + "T00:00:00") < HOJE_D;
              return (
                <li key={t.id} className="task" onClick={() => go("tarefas")}>
                  <span className={"resp-ini " + respCls(t.responsavel)}>{respLabel(t.responsavel)}</span>
                  <span className="task-text">{t.titulo}</span>
                  <span className={"task-prazo" + (late ? " late" : "")}>{late ? "⚠ " : ""}{fmtP(t.prazo)}</span>
                </li>);

            })}
          </ul>
        </Card>
      </div>

      {/* convidados */}
      <Card className="pad">
        <SectionTitle kicker="CONVIDADOS" title="Lista e confirmações" action={<button className="link-btn" onClick={() => go("convidados")}>Ver lista</button>} />
        <div className="dash-conv">
          <div className="dash-conv-tiles">
            <div className="dct"><div className="dct-n serif">{totalConv}</div><div className="dct-l">convidados</div></div>
            <div className="dct"><div className="dct-n serif">{principais}</div><div className="dct-l">principais</div></div>
            <div className="dct"><div className="dct-n serif">{adultos}</div><div className="dct-l">adultos</div></div>
            <div className="dct"><div className="dct-n serif">{criancas}</div><div className="dct-l">crianças</div></div>
          </div>
          <div className="dash-conv-bars">
            <div className="dcb">
              <div className="dcb-top"><span className="dcb-lbl">Save the Date</span><span className="dcb-cnt">{sdEnviados}<span className="dcb-of">/{totalConv}</span></span></div>
              <Progress value={sdEnviados} max={totalConv} tone="accent" />
              <div className="dcb-sub">enviados</div>
            </div>
            <div className="dcb">
              <div className="dcb-top"><span className="dcb-lbl">Convites</span><span className="dcb-cnt">{convEnviados}<span className="dcb-of">/{totalConv}</span></span></div>
              <Progress value={convEnviados} max={totalConv} tone="ink" />
              <div className="dcb-sub">enviados</div>
            </div>
            <div className="dcb">
              <div className="dcb-top"><span className="dcb-lbl">RSVP</span><span className="dcb-cnt">{rsvpConfirmados}<span className="dcb-of">/{totalConv}</span></span></div>
              <Progress value={rsvpConfirmados} max={totalConv} tone="good" />
              <div className="dcb-sub">confirmados{rsvpRecusados > 0 ? " · " + rsvpRecusados + " recusaram" : ""}</div>
            </div>
          </div>
        </div>
      </Card>

    </div>);

}

Object.assign(window, { Dashboard });