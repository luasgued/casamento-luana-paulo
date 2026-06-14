// Fornecedores.jsx — lista, comparativo, matriz de valor, cadastro com PDF
const { useState: useStateForn, useMemo: useMemoForn, useRef: useRefForn } = React;

function composite(f) {
  return CRITERIOS.reduce((s, c) => s + ((f.scores && f.scores[c.id]) || 0) * c.peso, 0) * 20; // 0–100
}

// ---- PDF reading --------------------------------------------------------
// Heurística leve: extrai preço, pagamento, instagram, telefone, e-mail,
// nome e itens de serviço a partir do texto da proposta.
function parseProposta(text, filename) {
  const out = {};
  const clean = text.replace(/\s+/g, " ").trim();

  // preço — pega o MAIOR valor plausível (total da proposta)
  const moneys = [...clean.matchAll(/R\$\s*([\d][\d\.\s]{1,12})(?:,\d{2})?/g)]
    .map((m) => parseInt(m[1].replace(/[^\d]/g, ""), 10))
    .filter((n) => n >= 500 && n <= 2000000);
  if (moneys.length) out.preco = Math.max(...moneys);

  // forma de pagamento
  const parc = clean.match(/(\d{1,2}\s*%[^.\n•·▪‣◦]{0,55}?\+\s*\d{1,2}\s*x[^.\n•·▪‣◦]{0,20})/i)
    || clean.match(/(\d{1,2}\s*%[^.\n•·▪‣◦]{0,45})/i)
    || clean.match(/(\d{1,2}\s*x\s*(?:de\s*R\$\s*[\d\.]+|sem\s*juros|no\s*cart[ãa]o)[^.\n•·▪‣◦]{0,20})/i)
    || clean.match(/(entrada[^.\n•·▪‣◦]{0,45})/i)
    || clean.match(/(sinal[^.\n•·▪‣◦]{0,45})/i)
    || clean.match(/(à\s*vista[^.\n•·▪‣◦]{0,24})/i)
    || clean.match(/((?:pix|boleto|transfer[êe]ncia)[^.\n•·▪‣◦]{0,24})/i);
  if (parc) {
    out.parcelas = parc[1].trim().replace(/\s+/g, " ")
      .replace(/\s+[A-ZÀ-Ú][a-zà-ú]{3,}.*$/, "") // remove "cauda" capitalizada (provável próximo item)
      .slice(0, 52).trim();
  }

  // instagram — prioriza a palavra-chave; senão @handle solto (não e-mail)
  let igRaw = null;
  const mig = clean.match(/instagram(?:\.com)?\s*[:/]?\s*@?\s*([a-z0-9_.]{3,30})/i);
  if (mig) igRaw = mig[1];
  else { const m2 = clean.match(/(?:^|[\s(])@([a-z0-9_.]{3,30})/); if (m2) igRaw = m2[1]; }
  if (igRaw) {
    let handle = igRaw.replace(/^@/, "").replace(/\.+$/, "").replace(/\.(com|com\.br|net|org|br)$/i, "");
    if (handle.length >= 3 && !/^(gmail|hotmail|outlook|yahoo)/i.test(handle)) out.instagram = "@" + handle;
  }

  // telefone BR
  const tel = clean.match(/(\(?\d{2}\)?\s?9?\s?\d{4}[-\s]?\d{4})/);
  if (tel) out.telefone = tel[1].trim();

  // e-mail
  const mail = clean.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
  if (mail) out.email = mail[1];

  // contato consolidado
  const contatoBits = [out.telefone, out.email].filter(Boolean);
  if (contatoBits.length) out.contato = contatoBits.join(" · ");

  // nome do fornecedor — tenta a partir do nome do arquivo (sem extensão)
  if (filename) {
    const base = filename.replace(/\.pdf$/i, "")
      .replace(/(proposta|orcamento|orçamento|or\u00e7amento|contrato)/gi, "")
      .replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();
    if (base.length >= 3) out.nome = base.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // serviços — bullets ou linhas com "incluso/inclui"
  let bullets = [...text.matchAll(/[•·▪‣◦*\u2013]\s*([A-ZÀ-Úa-zà-ú0-9][^•·▪‣◦*\n\u2013]{4,64})/g)]
    .map((m) => m[1].replace(/[\n\r]+/g, " ").trim());
  if (bullets.length < 2) {
    bullets = [...clean.matchAll(/(?:inclui|incluso|incluído|contempla|oferece)[:\s]+([^.;]{6,70})/gi)]
      .map((m) => m[1].trim());
  }
  // limpa duplicados e ruído
  const seen = new Set();
  bullets = bullets.filter((b) => {
    const k = b.toLowerCase();
    if (seen.has(k) || /^R\$|^\d+$|assinatura|cnpj|cpf/i.test(b)) return false;
    seen.add(k); return true;
  });
  if (bullets.length) out.servicos = bullets.slice(0, 8);

  return out;
}

async function lerPdf(file) {
  const url = URL.createObjectURL(file);
  let detected = {};
  try {
    if (window.pdfjsLib) {
      const buf = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
      let text = "";
      const pages = Math.min(pdf.numPages, 6);
      for (let i = 1; i <= pages; i++) {
        const p = await pdf.getPage(i);
        const tc = await p.getTextContent();
        // preserva quebras aproximadas por item para os bullets funcionarem
        text += "\n" + tc.items.map((x) => x.str).join(" ");
      }
      detected = parseProposta(text, file.name);
    }
  } catch (e) { console.warn("Leitura de PDF falhou:", e); }
  return { url, nome: file.name, detected };
}

const EMPTY_VENDOR = () => ({
  id: null, categoria: "", nome: "", contato: "", instagram: "", status: "analise",
  preco: 0, parcelas: "", servicos: [], notas: "", proposta: null,
  propostaUrl: null, propostaNome: null,
  scores: { qualidade: 4, atendimento: 4, portfolio: 4, flexibilidade: 4, prazo: 4 },
});

function Fornecedores() {
  const [cats, setCats] = useStore("categorias", CATEGORIAS);
  const [vendors, setVendors] = useStore("fornecedores", FORNECEDORES);
  const [cat, setCat] = React.useState(CATEGORIAS[0].id);
  const [openPdf, setOpenPdf] = React.useState(null);
  const [form, setForm] = React.useState(null);       // vendor draft or null
  const [addingCat, setAddingCat] = React.useState(false);
  const [newCat, setNewCat] = React.useState("");

  const todos = vendors.filter((f) => f.categoria === cat)
    .sort((a, b) => (a.status === "descartado" ? 1 : 0) - (b.status === "descartado" ? 1 : 0));
  const ranked = useMemoForn(() =>
    [...todos].map((f) => ({ ...f, score: composite(f) })).sort((a, b) => b.score - a.score),
    [vendors, cat]);
  const best = ranked.find((f) => f.status !== "descartado") || ranked[0];

  const precos = todos.map((f) => f.preco).filter((p) => p > 0);
  const minP = precos.length ? Math.min(...precos) : 0;
  const maxP = precos.length ? Math.max(...precos) : 0;

  const addCategoria = () => {
    const nome = newCat.trim();
    if (!nome) { setAddingCat(false); return; }
    const id = "cat-" + Date.now();
    setCats((c) => [...c, { id, nome }]);
    setCat(id); setNewCat(""); setAddingCat(false);
  };

  const openAdd = () => setForm({ ...EMPTY_VENDOR(), categoria: cat });
  const openEdit = (f) => setForm({ ...f, scores: { ...f.scores } });

  const salvarVendor = (draft) => {
    if (draft.id) {
      setVendors((vs) => vs.map((v) => v.id === draft.id ? draft : v));
    } else {
      const novo = { ...draft, id: "v" + Date.now() };
      setVendors((vs) => [...vs, novo]);
      setCat(draft.categoria);
    }
    setForm(null);
  };

  const removerVendor = (id) => { setVendors((vs) => vs.filter((v) => v.id !== id)); setForm(null); };

  // reordena os cards dentro da categoria (troca posição na lista compartilhada)
  const moverVendor = (id, dir) => setVendors((vs) => {
    const i = todos.findIndex((f) => f.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= todos.length) return vs;
    const arr = [...vs];
    const ia = arr.findIndex((v) => v.id === todos[i].id);
    const ib = arr.findIndex((v) => v.id === todos[j].id);
    [arr[ia], arr[ib]] = [arr[ib], arr[ia]];
    return arr;
  });

  const catNome = (id) => (cats.find((c) => c.id === id) || {}).nome || "—";

  return (
    <div className="screen">
      <SectionTitle kicker="DECISÕES" title="Fornecedores"
        action={<button className="add-btn" onClick={openAdd}>+ Adicionar fornecedor</button>} />

      {/* category tabs */}
      <div className="cat-tabs">
        {cats.map((c) => {
          const fechado = vendors.some((f) => f.categoria === c.id && f.status === "contratado");
          const n = vendors.filter((f) => f.categoria === c.id).length;
          return (
            <button key={c.id} className={"cat-tab" + (cat === c.id ? " active" : "")} onClick={() => setCat(c.id)}>
              {c.nome}
              <span className="cat-count">{n}</span>
              {fechado && <span className="cat-done">✓</span>}
            </button>
          );
        })}
        {addingCat ? (
          <span className="cat-add-form">
            <input autoFocus className="cat-add-input" placeholder="Nome da categoria" value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addCategoria(); if (e.key === "Escape") { setAddingCat(false); setNewCat(""); } }} />
            <button className="mini-btn solid" onClick={addCategoria}>Criar</button>
          </span>
        ) : (
          <button className="cat-tab ghost" onClick={() => setAddingCat(true)}>+ Nova categoria</button>
        )}
      </div>

      {todos.length === 0 ? (
        <Card className="pad empty-cat">
          <div className="empty-cat-title serif">Nenhum fornecedor em {catNome(cat)}</div>
          <div className="empty-cat-sub">Adicione a primeira proposta para começar o comparativo.</div>
          <button className="add-btn solid" onClick={openAdd}>+ Adicionar fornecedor</button>
        </Card>
      ) : (
        <React.Fragment>
          {/* vendor cards */}
          <div className="vendor-grid">
            {todos.map((f, i) => (
              <Card key={f.id} className={"vendor-card" + (f.status === "descartado" ? " dim" : "")}>
                <div className="vc-head">
                  <div>
                    <div className="vc-name serif">{f.nome}</div>
                    <div className="vc-contact">{f.contato || "sem contato"}</div>
                    {f.instagram && <a className="vc-ig" href={"https://instagram.com/" + f.instagram.replace(/^@/, "")} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}><span className="ig-glyph" aria-hidden="true"></span>{f.instagram}</a>}
                  </div>
                  <Badge status={f.status} />
                </div>
                <div className="vc-price-row">
                  <div><div className="vc-price serif">{f.preco ? brl(f.preco) : "—"}</div><div className="vc-parcelas">{f.parcelas || "—"}</div></div>
                  <Stars score={f.scores.qualidade} size={15} />
                </div>
                <ul className="vc-servicos">
                  {f.servicos.slice(0, 4).map((s, i) => <li key={i}>{s}</li>)}
                  {f.servicos.length > 4 && <li className="more">+{f.servicos.length - 4} itens</li>}
                  {f.servicos.length === 0 && <li className="more">sem serviços listados</li>}
                </ul>
                {f.notas && <div className="vc-notas">{f.notas}</div>}
                <div className="vc-foot">
                  <div className="vc-foot-btns">
                    <ReorderButtons onUp={() => moverVendor(f.id, -1)} onDown={() => moverVendor(f.id, 1)} upDisabled={i === 0} downDisabled={i === todos.length - 1} />
                    <button className="mini-btn" onClick={() => setOpenPdf(f)}>Proposta (PDF)</button>
                    <button className="mini-btn" onClick={() => openEdit(f)}>Editar</button>
                  </div>
                  <span className="vc-score">Score <b>{Math.round(composite(f))}</b></span>
                </div>
              </Card>
            ))}
          </div>

          {/* comparison table (only when 2+) */}
          {todos.length > 1 && (
            <Card className="pad">
              <SectionTitle kicker="LADO A LADO" title="Comparativo de serviços" />
              <div className="cmp-scroll">
                <table className="cmp">
                  <thead>
                    <tr>
                      <th className="cmp-crit">Critério</th>
                      {todos.map((f) => (
                        <th key={f.id}>
                          <div className="cmp-vname">{f.nome}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="cmp-crit">Preço</td>
                      {todos.map((f) => <td key={f.id}><b>{f.preco ? brl(f.preco) : "—"}</b>{f.preco === minP && minP > 0 && <span className="tag-min">menor</span>}</td>)}
                    </tr>
                    <tr>
                      <td className="cmp-crit">Forma de pagamento</td>
                      {todos.map((f) => <td key={f.id}>{f.parcelas || "—"}</td>)}
                    </tr>
                    <tr>
                      <td className="cmp-crit">Qualidade (avaliação)</td>
                      {todos.map((f) => <td key={f.id}><Stars score={f.scores.qualidade} /></td>)}
                    </tr>
                    <tr className="cmp-sep"><td colSpan={todos.length + 1}>Serviços inclusos</td></tr>
                    {allServicos(todos).map((srv) => (
                      <tr key={srv}>
                        <td className="cmp-crit light">{srv}</td>
                        {todos.map((f) => <td key={f.id}>{f.servicos.includes(srv) ? <span className="inc">✓</span> : <span className="exc">—</span>}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </React.Fragment>
      )}

      {openPdf && <PdfModal f={openPdf} onClose={() => setOpenPdf(null)} onEdit={() => { const f = openPdf; setOpenPdf(null); openEdit(f); }} />}
      {form && <VendorForm draft={form} cats={cats} onCancel={() => setForm(null)} onSave={salvarVendor} onRemove={removerVendor} />}
    </div>
  );
}

function allServicos(vendors) {
  const set = [];
  vendors.forEach((v) => v.servicos.forEach((s) => { if (!set.includes(s)) set.push(s); }));
  return set;
}

function ScatterMatrix({ vendors, minP, maxP, bestId }) {
  const W = 380, H = 300, pad = 44;
  const pr = maxP - minP || 1;
  const x = (preco) => pad + ((preco - minP) / pr) * (W - pad - 20);
  const y = (val) => H - pad - ((val - 40) / 60) * (H - pad - 20);
  return (
    <div className="scatter">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        <rect x={pad} y={20} width={(W - pad - 20) / 2} height={(H - pad - 20) / 2} fill="var(--pop)" opacity="0.05" />
        <line x1={pad} y1={20} x2={pad} y2={H - pad} stroke="var(--line-strong)" />
        <line x1={pad} y1={H - pad} x2={W - 20} y2={H - pad} stroke="var(--line-strong)" />
        <line x1={pad + (W - pad - 20) / 2} y1={20} x2={pad + (W - pad - 20) / 2} y2={H - pad} stroke="var(--line)" strokeDasharray="3 4" />
        <line x1={pad} y1={20 + (H - pad - 20) / 2} x2={W - 20} y2={20 + (H - pad - 20) / 2} stroke="var(--line)" strokeDasharray="3 4" />
        <text x={(W) / 2} y={H - 8} textAnchor="middle" className="ax-label">Preço →</text>
        <text x={14} y={H / 2} textAnchor="middle" className="ax-label" transform={`rotate(-90 14 ${H / 2})`}>Valor →</text>
        <text x={pad + 4} y={32} className="ax-quad">melhor escolha</text>
        {vendors.map((f) => {
          const cx = x(f.preco), cy = y(composite(f));
          const isBest = f.id === bestId;
          const dim = f.status === "descartado";
          return (
            <g key={f.id} opacity={dim ? 0.4 : 1}>
              <circle cx={cx} cy={cy} r={isBest ? 9 : 7} fill={isBest ? "var(--pop)" : "var(--surface)"} stroke={isBest ? "var(--pop)" : "var(--line-strong)"} strokeWidth="1.5" />
              {isBest && <circle cx={cx} cy={cy} r="15" fill="none" stroke="var(--pop)" strokeOpacity="0.3" />}
              <text x={cx} y={cy - 14} textAnchor="middle" className="pt-label">{f.nome.split(" ")[0]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PdfModal({ f, onClose, onEdit }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-kicker">PROPOSTA · {f.nome}</div>
            <div className="modal-title serif">{f.preco ? brl(f.preco) : "—"} · {f.parcelas || "—"}</div>
            <div className="modal-contact">
              {f.contato && <span>{f.contato}</span>}
              {f.instagram && <a className="vc-ig" href={"https://instagram.com/" + f.instagram.replace(/^@/, "")} target="_blank" rel="noopener"><span className="ig-glyph" aria-hidden="true"></span>{f.instagram}</a>}
            </div>
          </div>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        {f.propostaUrl ? (
          <iframe className="pdf-frame" src={f.propostaUrl} title={f.propostaNome}></iframe>
        ) : (
          <div className="pdf-placeholder">
            <div className="pdf-icon">PDF</div>
            <div className="pdf-name">{f.propostaNome || (f.proposta ? f.proposta.split("/").pop() : "proposta.pdf")}</div>
            <div className="pdf-note">A proposta original ainda não foi anexada.<br />Use “Editar” para enviar o PDF deste fornecedor.</div>
          </div>
        )}
        <div className="modal-foot">
          <span className="muted-line">Itens na proposta: {f.servicos.length}</span>
          <div className="vc-foot-btns">
            <button className="mini-btn" onClick={onEdit}>Editar informações</button>
            <button className="mini-btn solid" onClick={onClose}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VendorForm({ draft, cats, onCancel, onSave, onRemove }) {
  const [d, setD] = React.useState(draft);
  const [reading, setReading] = React.useState(false);
  const [lido, setLido] = React.useState(false);
  const [detectados, setDetectados] = React.useState([]);
  const fileRef = React.useRef(null);
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const setScore = (k, v) => setD((p) => ({ ...p, scores: { ...p.scores, [k]: v } }));
  const det = (k) => lido && detectados.includes(k);

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setReading(true); setLido(false);
    const res = await lerPdf(file);
    setD((p) => ({
      ...p,
      propostaUrl: res.url, propostaNome: res.nome,
      nome: (!p.nome && res.detected.nome) ? res.detected.nome : p.nome,
      contato: (!p.contato && res.detected.contato) ? res.detected.contato : p.contato,
      instagram: (!p.instagram && res.detected.instagram) ? res.detected.instagram : p.instagram,
      preco: res.detected.preco != null ? res.detected.preco : p.preco,
      parcelas: res.detected.parcelas || p.parcelas,
      servicos: (res.detected.servicos && res.detected.servicos.length) ? res.detected.servicos : p.servicos,
    }));
    setReading(false); setLido(true);
    setDetectados(Object.keys(res.detected || {}));
  };

  const addServico = () => set("servicos", [...d.servicos, ""]);
  const updServico = (i, v) => set("servicos", d.servicos.map((s, j) => j === i ? v : s));
  const delServico = (i) => set("servicos", d.servicos.filter((_, j) => j !== i));
  const moveServico = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= d.servicos.length) return;
    const arr = [...d.servicos];[arr[i], arr[j]] = [arr[j], arr[i]];set("servicos", arr);
  };

  const podeSalvar = d.nome.trim() && d.categoria;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-kicker">{d.id ? "EDITAR FORNECEDOR" : "NOVO FORNECEDOR"}</div>
            <div className="modal-title serif">{d.nome || "Cadastro de proposta"}</div>
          </div>
          <button className="modal-x" onClick={onCancel}>✕</button>
        </div>

        <div className="form-body">
          {/* PDF upload first — drives the rest */}
          <div className="field">
            <label>Proposta de serviço (PDF)</label>
            <div className={"pdf-drop" + (d.propostaUrl ? " has" : "") + (reading ? " reading" : "")}
              onClick={() => !reading && fileRef.current && fileRef.current.click()}>
              <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={onFile} />
              {reading ? (
                <div className="drop-reading"><span className="spinner"></span> Lendo proposta…</div>
              ) : d.propostaUrl ? (
                <div className="drop-has">
                  <span className="pdf-chip">PDF</span>
                  <div><div className="drop-name">{d.propostaNome}</div><div className="drop-sub">Anexado · clique para trocar</div></div>
                </div>
              ) : (
                <div className="drop-empty"><b>+ Enviar PDF da proposta</b><span>Leio o arquivo e pré-preencho os campos abaixo</span></div>
              )}
            </div>
            {lido && <div className="lido-hint">✓ {detectados.length > 0 ? detectados.length + " campo(s) preenchido(s) pela leitura do PDF — revise e ajuste o que precisar." : "PDF anexado. Não consegui extrair campos automáticos — preencha manualmente abaixo."}</div>}
          </div>

          <div className="form-grid">
            <div className="field">
              <label>Categoria</label>
              <select className="f-input" value={d.categoria} onChange={(e) => set("categoria", e.target.value)}>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select className="f-input" value={d.status} onChange={(e) => set("status", e.target.value)}>
                <option value="favorito">Favorito</option>
                <option value="analise">Em análise</option>
                <option value="contratado">Contratado</option>
                <option value="descartado">Descartado</option>
              </select>
            </div>
            <div className="field">
              <label>Nome do fornecedor {det("nome") ? <span className="det">detectado</span> : null}</label>
              <input className="f-input" value={d.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex: Estúdio Luz Natural" />
            </div>
            <div className="field">
              <label>Contato {det("contato") ? <span className="det">detectado</span> : null}</label>
              <input className="f-input" value={d.contato} onChange={(e) => set("contato", e.target.value)} placeholder="Nome · (11) 9 0000-0000" />
            </div>
            <div className="field">
              <label>Instagram {det("instagram") ? <span className="det">detectado</span> : null}</label>
              <div className="ig-input-wrap">
                <span className="ig-at">@</span>
                <input className="f-input ig-input" value={(d.instagram || "").replace(/^@/, "")} onChange={(e) => set("instagram", e.target.value ? "@" + e.target.value.replace(/^@/, "") : "")} placeholder="perfil_do_fornecedor" />
              </div>
            </div>
            <div className="field">
              <label>Preço {det("preco") ? <span className="det">detectado</span> : null}</label>
              <input className="f-input" type="number" value={d.preco} onChange={(e) => set("preco", +e.target.value || 0)} placeholder="0" />
            </div>
            <div className="field">
              <label>Forma de pagamento {det("parcelas") ? <span className="det">detectado</span> : null}</label>
              <input className="f-input" value={d.parcelas} onChange={(e) => set("parcelas", e.target.value)} placeholder="Ex: 30% sinal + 4x" />
            </div>
          </div>

          {/* serviços */}
          <div className="field">
            <label>Serviços inclusos {det("servicos") ? <span className="det">detectado</span> : null}</label>
            <div className="servicos-edit">
              {d.servicos.map((s, i) => (
                <div key={i} className="servico-row">
                  <ReorderButtons vertical onUp={() => moveServico(i, -1)} onDown={() => moveServico(i, 1)} upDisabled={i === 0} downDisabled={i === d.servicos.length - 1} />
                  <input className="f-input" value={s} onChange={(e) => updServico(i, e.target.value)} placeholder="Descreva um item incluso" />
                  <button className="srv-del" onClick={() => delServico(i)}>✕</button>
                </div>
              ))}
              <button className="srv-add" onClick={addServico}>+ Adicionar item</button>
            </div>
          </div>

          {/* avaliação */}
          <div className="field">
            <label>Avaliação por critério (sua nota de 1 a 5)</label>
            <div className="scores-edit">
              {CRITERIOS.map((c) => (
                <div key={c.id} className="score-row">
                  <span className="score-label">{c.label}</span>
                  <div className="score-dots">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} className={"sdot" + (n <= d.scores[c.id] ? " on" : "")} onClick={() => setScore(c.id, n)}>★</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Observações</label>
            <textarea className="f-input" rows="2" value={d.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Suas impressões, pontos fortes, ressalvas…"></textarea>
          </div>
        </div>

        <div className="modal-foot">
          {d.id ? <button className="link-danger" onClick={() => onRemove(d.id)}>Remover</button> : <span></span>}
          <div className="vc-foot-btns">
            <button className="mini-btn" onClick={onCancel}>Cancelar</button>
            <button className={"add-btn solid" + (podeSalvar ? "" : " disabled")} disabled={!podeSalvar} onClick={() => onSave({ ...d, preco: +d.preco || 0, servicos: d.servicos.filter((s) => s.trim()) })}>
              {d.id ? "Salvar alterações" : "Adicionar fornecedor"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Fornecedores });
