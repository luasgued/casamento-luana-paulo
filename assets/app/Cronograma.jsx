// Cronograma.jsx — calendário mês a mês (2 anos antes do casamento) com uma
// lista de tarefas por mês. Os itens ficam no banco compartilhado (useStore).
const CR_MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const CR_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function Cronograma() {
  const [itens, setItens] = useStore("cronograma", []);

  const wd = new Date(WEDDING.data);
  const minDate = new Date(wd.getFullYear() - 2, wd.getMonth(), 1); // 2 anos antes
  const maxDate = new Date(wd.getFullYear(), wd.getMonth(), 1);     // mês do casamento
  const hoje = new Date();
  const clamp = (d) => (d < minDate ? new Date(minDate) : d > maxDate ? new Date(maxDate) : d);
  const [ref, setRef] = React.useState(() => clamp(new Date(hoje.getFullYear(), hoje.getMonth(), 1)));

  const ano = ref.getFullYear();
  const mes = ref.getMonth();
  const mesKey = ano + "-" + String(mes + 1).padStart(2, "0");

  const podeVoltar = new Date(ano, mes, 1) > minDate;
  const podeAvancar = new Date(ano, mes, 1) < maxDate;
  const navegar = (delta) => setRef((r) => clamp(new Date(r.getFullYear(), r.getMonth() + delta, 1)));
  const irHoje = () => setRef(clamp(new Date(hoje.getFullYear(), hoje.getMonth(), 1)));

  // células do calendário
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < primeiroDiaSemana; i++) cells.push(null);
  for (let d = 1; d <= diasNoMes; d++) cells.push(d);
  const ehHoje = (d) => d && ano === hoje.getFullYear() && mes === hoje.getMonth() && d === hoje.getDate();
  const diaCasamento = (ano === wd.getFullYear() && mes === wd.getMonth()) ? wd.getDate() : null;

  const mesesAteCasamento = (wd.getFullYear() - ano) * 12 + (wd.getMonth() - mes);

  // itens do mês
  const itensDoMes = itens.filter((i) => i.mes === mesKey);
  const feitos = itensDoMes.filter((i) => i.feito).length;
  const addItem = () => setItens((ls) => [...ls, { id: "cr" + Date.now(), mes: mesKey, titulo: "", feito: false }]);
  const updItem = (id, patch) => setItens((ls) => ls.map((i) => i.id === id ? Object.assign({}, i, patch) : i));
  const delItem = (id) => setItens((ls) => ls.filter((i) => i.id !== id));

  return (
    <div className="screen">
      <SectionTitle kicker="PLANEJAMENTO" title="Cronograma"
        action={<button className="add-btn" onClick={irHoje}>Mês atual</button>} />

      <Card className="pad">
        <div className="cr-nav">
          <button className="cr-nav-btn" disabled={!podeVoltar} onClick={() => navegar(-1)} title="Mês anterior">‹</button>
          <div className="cr-nav-title">
            <div className="cr-mes serif">{CR_MESES[mes]} <span className="cr-ano">{ano}</span></div>
            <div className="cr-sub">
              {mesesAteCasamento <= 0 ? "Mês do casamento 💍" : "Faltam " + mesesAteCasamento + (mesesAteCasamento === 1 ? " mês" : " meses") + " para o casamento"}
            </div>
          </div>
          <button className="cr-nav-btn" disabled={!podeAvancar} onClick={() => navegar(1)} title="Próximo mês">›</button>
        </div>

        <div className="cr-layout">
          <div className="cr-cal">
            <div className="cr-week">{CR_SEMANA.map((d) => <span key={d}>{d}</span>)}</div>
            <div className="cr-days">
              {cells.map((d, i) => (
                <div key={i} className={"cr-day" + (d ? "" : " empty") + (ehHoje(d) ? " hoje" : "") + (d && d === diaCasamento ? " casamento" : "")}>
                  {d ? <span className="cr-day-n">{d}</span> : null}
                  {d && d === diaCasamento ? <span className="cr-day-mark">💍</span> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="cr-list">
            <div className="cr-list-head">
              <span className="cr-list-title">Tarefas de {CR_MESES[mes]}</span>
              {itensDoMes.length > 0 && <span className="cr-list-count">{feitos}/{itensDoMes.length} feitas</span>}
            </div>
            <div className="cr-items">
              {itensDoMes.map((i) => (
                <div key={i.id} className={"cr-item" + (i.feito ? " feito" : "")}>
                  <input type="checkbox" checked={!!i.feito} onChange={(e) => updItem(i.id, { feito: e.target.checked })} />
                  <input className="f-input" value={i.titulo} onChange={(e) => updItem(i.id, { titulo: e.target.value })} placeholder="Descreva a tarefa do mês…" />
                  <button className="srv-del" title="Remover" onClick={() => delItem(i.id)}>✕</button>
                </div>
              ))}
              {itensDoMes.length === 0 && <div className="cr-empty">Nenhuma tarefa para este mês. Adicione a primeira abaixo.</div>}
              <button className="srv-add" onClick={addItem}>+ Adicionar item</button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { Cronograma });
