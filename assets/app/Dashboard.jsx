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
  const totalPrev = ORCAMENTO.reduce((s, c) => s + c.previsto, 0);
  const totalReal = ORCAMENTO.reduce((s, c) => s + c.realizado, 0);
  const pendente = ORCAMENTO.filter((c) => c.realizado === 0).reduce((s, c) => s + c.previsto, 0);
  const semForn = ORCAMENTO.filter((c) => c.realizado === 0).length;

  const HOJE_D = new Date("2026-06-12");
  const MESES_PT = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const mesKey = HOJE_D.getUTCFullYear() + "-" + String(HOJE_D.getUTCMonth() + 1).padStart(2, "0");
  const nomeMes = MESES_PT[HOJE_D.getUTCMonth()];
  const pagamentosMes = ORCAMENTO.filter((c) => (c.pagamentos || {})[mesKey] != null).length;
  const valorMes = ORCAMENTO.reduce((s, c) => s + (((c.pagamentos || {})[mesKey]) || 0), 0);

  const conf = CONVIDADOS.filter((g) => g.rsvp === "confirmado");

  const contratados = ORCAMENTO.filter((c) => c.fornecedor).length;
  const decidir = FORNECEDORES.filter((f) => f.status === "favorito" || f.status === "analise");

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
      <div className="kpi-grid kpi-3">
        <Card className="kpi clickable" onClick={() => go("orcamento")}>
          <div className="kpi-top"><span className="kpi-label">Orçamento previsto</span><span className="chev">→</span></div>
          <div className="kpi-value serif">{brl(totalPrev)}</div>
          <div className="kpi-foot"><Progress value={totalReal} max={totalPrev} /><span>{brl(totalReal)} já comprometido</span></div>
        </Card>
        <Card className="kpi clickable" onClick={() => go("fornecedores")}>
          <div className="kpi-top"><span className="kpi-label">Fornecedores fechados</span><span className="chev">→</span></div>
          <div className="kpi-value serif">{contratados}<span className="kpi-of"> / {ORCAMENTO.length}</span></div>
          <div className="kpi-foot"><Progress value={contratados} max={ORCAMENTO.length} tone="accent" /><span>{decidir.length} em decisão</span></div>
        </Card>
        <Card className="kpi clickable" onClick={() => go("tarefas")}>
          <div className="kpi-top"><span className="kpi-label">Tarefas em aberto</span><span className="chev">→</span></div>
          <div className="kpi-value serif">{abertas.length}<span className="kpi-of"> / {(tasks || []).length}</span></div>
          <div className="kpi-foot"><Progress value={(tasks || []).length - abertas.length} max={(tasks || []).length} tone="good" /><span>{atrasadas.length > 0 ? atrasadas.length + " atrasada(s)" : fazendo.length + " em andamento"}</span></div>
        </Card>
      </div>

      {/* two column — orçamento + tarefas */}
      <div className="two-col">
        <Card className="pad">
          <SectionTitle kicker="ORÇAMENTO" title="Onde estamos" action={<button className="link-btn" onClick={() => go("orcamento")}>Detalhar</button>} />
          <div className="budget-overview">
            <Donut segments={donutSegs} centerLabel={Math.round(totalReal / totalPrev * 100) + "%"} centerSub="comprometido" />
            <div className="budget-legend">
              <div className="leg-row"><span className="dot" style={{ background: "var(--accent)" }} /><div><div className="leg-v serif">{brl(totalReal)}</div><div className="leg-l">Realizado / contratado</div></div></div>
              <div className="leg-row"><span className="dot" style={{ background: "var(--line-strong)" }} /><div><div className="leg-v serif">{brl(totalPrev - totalReal)}</div><div className="leg-l">Ainda a contratar</div></div></div>
            </div>
          </div>
          <div className="budget-mes">
            <span className="bm-num serif">{pagamentosMes}</span>
            <span className="bm-txt">{pagamentosMes === 1 ? "pagamento previsto" : "pagamentos previstos"} para {nomeMes}{valorMes > 0 ? <span className="bm-val"> · {brl(valorMes)}</span> : null}</span>
          </div>
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

      {/* decisions strip */}
      <Card className="pad">
        <SectionTitle kicker="DECISÕES EM ABERTO" title="Fornecedores para escolher" action={<button className="link-btn" onClick={() => go("fornecedores")}>Ver comparativo</button>} />
        <div className="decision-strip">
          {decidir.map((f) =>
          <div key={f.id} className="decision-card" onClick={() => go("fornecedores")}>
              <div className="dc-cat">{(CATEGORIAS.find((c) => c.id === f.categoria) || {}).nome}</div>
              <div className="dc-name serif">{f.nome}</div>
              <div className="dc-row"><Stars score={f.scores.qualidade} /><span className="dc-price">{brl(f.preco)}</span></div>
              <Badge status={f.status} />
            </div>
          )}
        </div>
      </Card>

    </div>);

}

Object.assign(window, { Dashboard });