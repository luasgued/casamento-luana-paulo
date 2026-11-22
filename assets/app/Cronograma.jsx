// Cronograma.jsx — calendário mês a mês (2 anos antes do casamento) com uma
// lista de tarefas por mês + eventos por data (clique em um dia para cadastrar).
// Um evento tem nome e período (1 ou mais dias). Tudo no banco compartilhado.
const CR_MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const CR_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const pad2 = (n) => String(n).padStart(2, "0");

// soma n dias a uma data "AAAA-MM-DD" (em UTC, sem susto de fuso)
function isoAdd(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.getUTCFullYear() + "-" + pad2(dt.getUTCMonth() + 1) + "-" + pad2(dt.getUTCDate());
}
// diferença em dias entre duas datas "AAAA-MM-DD"
function isoDiff(a, b) {
  const [ya, ma, da] = a.split("-").map(Number);
  const [yb, mb, db] = b.split("-").map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
}
// início/fim tolerantes a eventos antigos (que só tinham "data")
const evIni = (e) => e.inicio || e.data;
const evFim = (e) => e.fim || e.inicio || e.data;

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

  // eventos (por período)
  const eventosDoDia = (d) => {
    if (!d) return [];
    const k = diaKey(d);
    return eventos.filter((e) => k >= evIni(e) && k <= evFim(e));
  };
  const firstKey = diaKey(1), lastKey = diaKey(diasNoMes);
  const eventosDoMes = eventos
    .filter((e) => evFim(e) >= firstKey && evIni(e) <= lastKey)
    .sort((a, b) => evIni(a).localeCompare(evIni(b)));
  const addEvento = (data) => setEventos((ls) => [...ls, { id: "ev" + Date.now(), inicio: data, fim: data, titulo: "" }]);
  const updEvento = (id, patch) => setEventos((ls) => ls.map((e) => e.id === id ? Object.assign({}, e, patch) : e));
  const delEvento = (id) => setEventos((ls) => ls.filter((e) => e.id !== id));

  // rótulo do período de um evento (ex.: "15 de Novembro" ou "15–16 de Novembro")
  const rangeLabel = (e) => {
    const ini = evIni(e), fim = evFim(e);
    const [y1, m1, d1] = ini.split("-").map(Number);
    const [y2, m2, d2] = fim.split("-").map(Number);
    if (ini === fim) return d1 + " de " + CR_MESES[m1 - 1];
    if (y1 === y2 && m1 === m2) return d1 + "–" + d2 + " de " + CR_MESES[m1 - 1];
    return d1 + " " + CR_MESES[m1 - 1].slice(0, 3) + " – " + d2 + " " + CR_MESES[m2 - 1].slice(0, 3);
  };

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
                    className={"cr-day" + (d ? " clickable" : " empty") + (ehHoje(d) ? " hoje" : "") + (d && d === diaCasamento ? " casamento" : "") + (evs.length ? " tem-evento" : "")}
                    onClick={d ? () => setModalData(diaKey(d)) : undefined}
                    title={d ? (evs.length ? evs.map((e) => e.titulo || "Evento").join(" · ") : "Clique para cadastrar um evento") : undefined}>
                    {d ? <span className="cr-day-n">{d}</span> : null}
                    {d && d === diaCasamento ? <span className="cr-day-mark">💍</span> : null}
                    {evs.length > 0 &&
                      <span className="cr-day-dots">
                        {evs.slice(0, 3).map((e) => <span key={e.id} className="cr-day-dot" />)}
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
                <div className="cr-ev-empty">Nenhum evento neste mês. Clique em um dia do calendário para cadastrar (ex.: pré-wedding, teste de maquiagem, dia do casamento…).</div> :
                eventosDoMes.map((e) =>
                  <button key={e.id} className="cr-ev-month-item" onClick={() => setModalData(evIni(e))}>
                    <span className="cr-ev-daybox"><span className="cr-ev-dnum">{Number(evIni(e).slice(8, 10))}</span></span>
                    <span className="cr-ev-info">
                      <span className="cr-ev-ititle">{e.titulo || "Evento sem nome"}</span>
                      <span className="cr-ev-itype">{rangeLabel(e)}{evIni(e) !== evFim(e) ? " · " + (isoDiff(evIni(e), evFim(e)) + 1) + " dias" : ""}</span>
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
          eventos={eventos.filter((e) => modalData >= evIni(e) && modalData <= evFim(e))}
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
  const fmtDM = (iso) => iso.split("-")[2] + "/" + iso.split("-")[1];

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

          {eventos.map((e, idx) => {
            const ini = evIni(e), fim = evFim(e);
            const dur = isoDiff(ini, fim) + 1;
            const setDur = (k) => onUpd(e.id, { inicio: ini, fim: isoAdd(ini, Math.max(1, k) - 1) });
            return (
              <div key={e.id} className="cr-ev-block">
                <div className="cr-ev-row">
                  <input className="f-input" value={e.titulo} autoFocus={idx === eventos.length - 1 && !e.titulo}
                    onChange={(ev) => onUpd(e.id, { titulo: ev.target.value })}
                    placeholder="Nome do evento (ex.: Teste de maquiagem)" />
                  <div className="cr-dur" title="Duração em dias">
                    <button className="cr-dur-btn" disabled={dur <= 1} onClick={() => setDur(dur - 1)}>−</button>
                    <span className="cr-dur-n">{dur} {dur === 1 ? "dia" : "dias"}</span>
                    <button className="cr-dur-btn" onClick={() => setDur(dur + 1)}>+</button>
                  </div>
                  <button className="srv-del" title="Remover evento" onClick={() => onDel(e.id)}>✕</button>
                </div>
                {ini !== fim &&
                  <div className="cr-ev-range">De {fmtDM(ini)} até {fmtDM(fim)}</div>}
              </div>);
          })}

          <button className="srv-add" onClick={onAdd}>+ Adicionar evento</button>
          <div className="cr-ev-hint">Dê um nome ao evento e, se durar mais de um dia, aumente a duração em “+”.</div>
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
