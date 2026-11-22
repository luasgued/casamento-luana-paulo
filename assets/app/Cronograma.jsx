// Cronograma.jsx — calendário mês a mês (2 anos antes do casamento) com uma
// lista de tarefas por mês + eventos por data (clique em um dia para cadastrar).
// Tudo fica no banco compartilhado (useStore).
const CR_MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const CR_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// tipos de evento com cores (o último, "outro", é o padrão de fallback)
const CR_TIPOS = [
  { id: "casamento", label: "Dia do casamento", cor: "#c02a3c" },
  { id: "prewedding", label: "Pré-wedding", cor: "#1b47a4" },
  { id: "maquiagem", label: "Teste de maquiagem", cor: "#c23f93" },
  { id: "vestido", label: "Prova de vestido", cor: "#7a3cc0" },
  { id: "degustacao", label: "Degustação", cor: "#c07a1b" },
  { id: "reuniao", label: "Reunião / Visita", cor: "#1b8f6a" },
  { id: "outro", label: "Outro", cor: "#6b7280" },
];
const crTipo = (id) => CR_TIPOS.find((t) => t.id === id) || CR_TIPOS[CR_TIPOS.length - 1];
const crCor = (id) => crTipo(id).cor;
const crLabel = (id) => crTipo(id).label;
const pad2 = (n) => String(n).padStart(2, "0");

function Cronograma() {
  const [itens, setItens] = useStore("cronograma", []);
  const [eventos, setEventos] = useStore("eventos", []);

  const wd = new Date(WEDDING.data);
  const minDate = new Date(wd.getFullYear() - 2, wd.getMonth(), 1); // 2 anos antes
  const maxDate = new Date(wd.getFullYear(), wd.getMonth(), 1);     // mês do casamento
  const hoje = new Date();
  const clamp = (d) => (d < minDate ? new Date(minDate) : d > maxDate ? new Date(maxDate) : d);
  const [ref, setRef] = React.useState(() => clamp(new Date(hoje.getFullYear(), hoje.getMonth(), 1)));
  const [modalData, setModalData] = React.useState(null); // "AAAA-MM-DD" do dia aberto

  const ano = ref.getFullYear();
  const mes = ref.getMonth();
  const mesKey = ano + "-" + pad2(mes + 1);
  const diaKey = (d) => mesKey + "-" + pad2(d);

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

  // tarefas do mês
  const itensDoMes = itens.filter((i) => i.mes === mesKey);
  const feitos = itensDoMes.filter((i) => i.feito).length;
  const addItem = () => setItens((ls) => [...ls, { id: "cr" + Date.now(), mes: mesKey, titulo: "", feito: false }]);
  const updItem = (id, patch) => setItens((ls) => ls.map((i) => i.id === id ? Object.assign({}, i, patch) : i));
  const delItem = (id) => setItens((ls) => ls.filter((i) => i.id !== id));

  // eventos (por data)
  const eventosDoDia = (d) => d ? eventos.filter((e) => e.data === diaKey(d)) : [];
  const eventosDoMes = eventos.filter((e) => e.data.slice(0, 7) === mesKey).sort((a, b) => a.data.localeCompare(b.data));
  const addEvento = (data) => setEventos((ls) => [...ls, { id: "ev" + Date.now(), data, titulo: "", tipo: data === diaKey(diaCasamento) ? "casamento" : "prewedding" }]);
  const updEvento = (id, patch) => setEventos((ls) => ls.map((e) => e.id === id ? Object.assign({}, e, patch) : e));
  const delEvento = (id) => setEventos((ls) => ls.filter((e) => e.id !== id));

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
              {cells.map((d, i) => {
                const evs = eventosDoDia(d);
                return (
                  <div key={i}
                    className={"cr-day" + (d ? " clickable" : " empty") + (ehHoje(d) ? " hoje" : "") + (d && d === diaCasamento ? " casamento" : "")}
                    onClick={d ? () => setModalData(diaKey(d)) : undefined}
                    title={d ? "Clique para cadastrar um evento" : undefined}>
                    {d ? <span className="cr-day-n">{d}</span> : null}
                    {d && d === diaCasamento ? <span className="cr-day-mark">💍</span> : null}
                    {evs.length > 0 &&
                      <span className="cr-day-dots">
                        {evs.slice(0, 3).map((e) => <span key={e.id} className="cr-day-dot" style={{ background: crCor(e.tipo) }} />)}
                      </span>}
                  </div>);
              })}
            </div>
            <div className="cr-cal-hint">Clique em um dia para cadastrar um evento</div>
          </div>

          <div className="cr-list">
            {/* eventos do mês */}
            <div className="cr-list-head">
              <span className="cr-list-title">Eventos de {CR_MESES[mes]}</span>
              {eventosDoMes.length > 0 && <span className="cr-list-count">{eventosDoMes.length}</span>}
            </div>
            <div className="cr-ev-month">
              {eventosDoMes.length === 0 ?
                <div className="cr-ev-empty">Nenhum evento neste mês. Clique em um dia do calendário para cadastrar (pré-wedding, teste de maquiagem, dia do casamento…).</div> :
                eventosDoMes.map((e) =>
                  <button key={e.id} className="cr-ev-month-item" onClick={() => setModalData(e.data)}>
                    <span className="cr-ev-daybox" style={{ borderColor: crCor(e.tipo) }}><span className="cr-ev-dnum">{Number(e.data.slice(8, 10))}</span></span>
                    <span className="cr-ev-info">
                      <span className="cr-ev-ititle">{e.titulo || crLabel(e.tipo)}</span>
                      <span className="cr-ev-itype"><span className="cr-ev-dot" style={{ background: crCor(e.tipo) }} />{crLabel(e.tipo)}</span>
                    </span>
                  </button>)}
            </div>

            {/* tarefas do mês */}
            <div className="cr-list-head cr-list-head-2">
              <span className="cr-list-title">Tarefas de {CR_MESES[mes]}</span>
              {itensDoMes.length > 0 && <span className="cr-list-count">{feitos}/{itensDoMes.length} feitas</span>}
            </div>
            <div className="cr-items">
              {itensDoMes.map((i) =>
                <div key={i.id} className={"cr-item" + (i.feito ? " feito" : "")}>
                  <input type="checkbox" checked={!!i.feito} onChange={(e) => updItem(i.id, { feito: e.target.checked })} />
                  <input className="f-input" value={i.titulo} onChange={(e) => updItem(i.id, { titulo: e.target.value })} placeholder="Descreva a tarefa do mês…" />
                  <button className="srv-del" title="Remover" onClick={() => delItem(i.id)}>✕</button>
                </div>)}
              {itensDoMes.length === 0 && <div className="cr-empty">Nenhuma tarefa para este mês. Adicione a primeira abaixo.</div>}
              <button className="srv-add" onClick={addItem}>+ Adicionar item</button>
            </div>
          </div>
        </div>
      </Card>

      {modalData &&
        <CrEventModal
          data={modalData}
          eventos={eventos.filter((e) => e.data === modalData)}
          onAdd={() => addEvento(modalData)}
          onUpd={updEvento}
          onDel={delEvento}
          onClose={() => setModalData(null)} />}
    </div>);
}

// ---- modal de eventos de um dia ----------------------------------------
function CrEventModal({ data, eventos, onAdd, onUpd, onDel, onClose }) {
  const [y, m, d] = data.split("-").map(Number);
  const dataFmt = d + " de " + CR_MESES[m - 1] + " de " + y;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal form-modal cr-ev-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-kicker">EVENTOS DO DIA</div>
            <div className="modal-title serif">{dataFmt}</div>
          </div>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>

        <div className="form-body">
          {eventos.length === 0 &&
            <div className="cr-ev-empty">Nenhum evento neste dia ainda. Adicione o primeiro abaixo.</div>}

          {eventos.map((e, i) =>
            <div key={e.id} className="cr-ev-row">
              <span className="cr-ev-dot" style={{ background: crCor(e.tipo) }} />
              <select className="f-input cr-ev-sel" value={e.tipo} onChange={(ev) => onUpd(e.id, { tipo: ev.target.value })}>
                {CR_TIPOS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <input className="f-input" value={e.titulo} autoFocus={i === eventos.length - 1 && !e.titulo}
                onChange={(ev) => onUpd(e.id, { titulo: ev.target.value })}
                placeholder={crLabel(e.tipo) + " (toque para renomear)"} />
              <button className="srv-del" title="Remover evento" onClick={() => onDel(e.id)}>✕</button>
            </div>)}

          <button className="srv-add" onClick={onAdd}>+ Adicionar evento</button>
          <div className="cr-ev-hint">Escolha um tipo para a cor e, se quiser, dê um nome ao evento.</div>
        </div>

        <div className="modal-foot">
          <span></span>
          <div className="vc-foot-btns">
            <button className="add-btn solid" onClick={onClose}>Concluir</button>
          </div>
        </div>
      </div>
    </div>);
}

Object.assign(window, { Cronograma });
