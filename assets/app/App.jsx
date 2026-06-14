// App.jsx — shell, navigation, tweaks
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "tema": "Rótulo",
  "fonte": "Festiva",
  "densidade": "Confortável",
  "contagem": true,
  "cantos": "Suaves"
} /*EDITMODE-END*/;

const NAV = [
{ id: "dashboard", label: "Visão Geral", icon: "home" },
{ id: "orcamento", label: "Orçamento", icon: "budget" },
{ id: "fornecedores", label: "Fornecedores", icon: "vendors" },
{ id: "tarefas", label: "Tarefas", icon: "tasks" },
{ id: "convidados", label: "Convidados", icon: "guests" }];


function NavIcon({ type, active }) {
  const s = active ? "var(--ink)" : "var(--muted)";
  if (type === "home") return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 8.5L10 3l7 5.5V16a1 1 0 01-1 1h-3v-5H7v5H4a1 1 0 01-1-1V8.5z" stroke={s} strokeWidth="1.4" strokeLinejoin="round" /></svg>;
  if (type === "budget") return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke={s} strokeWidth="1.4" /><path d="M10 6v8M8 8.2c0-1 .9-1.5 2-1.5s2 .5 2 1.4c0 1.8-4 .9-4 2.8 0 1 .9 1.4 2 1.4s2-.5 2-1.4" stroke={s} strokeWidth="1.2" /></svg>;
  if (type === "vendors") return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1" stroke={s} strokeWidth="1.4" /><rect x="11" y="3.5" width="5.5" height="5.5" rx="1" stroke={s} strokeWidth="1.4" /><rect x="3.5" y="11" width="5.5" height="5.5" rx="1" stroke={s} strokeWidth="1.4" /><rect x="11" y="11" width="5.5" height="5.5" rx="1" stroke={s} strokeWidth="1.4" /></svg>;
  if (type === "tasks") return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3.5" width="4.2" height="13" rx="1" stroke={s} strokeWidth="1.4" /><rect x="9.4" y="3.5" width="4.2" height="9" rx="1" stroke={s} strokeWidth="1.4" /><rect x="15.8" y="3.5" width="1.2" height="6" rx="0.6" stroke={s} strokeWidth="1.4" /></svg>;
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7.5" r="2.6" stroke={s} strokeWidth="1.4" /><circle cx="13.5" cy="8.5" r="2" stroke={s} strokeWidth="1.4" /><path d="M3 16c.4-2.2 2-3.4 4-3.4s3.6 1.2 4 3.4M12 16c.2-1.6 1.2-2.6 2.6-2.6 1.2 0 2.2.8 2.6 2.2" stroke={s} strokeWidth="1.3" strokeLinecap="round" /></svg>;
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = React.useState(() => location.hash.replace("#", "") || "dashboard");
  const [tasks, setTasks] = useStore("tarefas", TAREFAS);

  React.useEffect(() => {
    const root = document.getElementById("root");
    root.dataset.tema = t.tema;
    root.dataset.fonte = t.fonte;
    root.dataset.densidade = t.densidade;
    root.dataset.cantos = t.cantos;
    root.dataset.contagem = t.contagem ? "on" : "off";
  }, [t.tema, t.fonte, t.densidade, t.cantos, t.contagem]);

  const go = (s) => {setScreen(s);location.hash = s;window.scrollTo({ top: 0 });document.querySelector(".main").scrollTop = 0;};

  return (
    <div className="app">
      {/* Sidebar (desktop) */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mono">CASAMENTO</div>
          <div className="brand-names serif">L <span className="amp" style={{ fontSize: "35px" }}>&</span> P</div>
          <div className="brand-date">10.10.2027</div>
        </div>
        <nav className="nav">
          {NAV.map((n) =>
          <button key={n.id} className={"nav-item" + (screen === n.id ? " active" : "")} onClick={() => go(n.id)}>
              <NavIcon type={n.icon} active={screen === n.id} />
              <span>{n.label}</span>
            </button>
          )}
        </nav>
        <div className="sidebar-foot">
          <div className="sf-card">
            <div className="sf-label">Planejado por</div>
            <div className="sf-name">Luana &amp; Paulo</div>
          </div>
          <button className="sf-logout" onClick={() => window.Wedding.logout()}>Sair</button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        {screen === "dashboard" && <Dashboard go={go} tasks={tasks} />}
        {screen === "orcamento" && <Orcamento />}
        {screen === "fornecedores" && <Fornecedores />}
        {screen === "tarefas" && <Tarefas tasks={tasks} setTasks={setTasks} />}
        {screen === "convidados" && <Convidados />}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="bottom-nav">
        {NAV.map((n) =>
        <button key={n.id} className={"bn-item" + (screen === n.id ? " active" : "")} onClick={() => go(n.id)}>
            <NavIcon type={n.icon} active={screen === n.id} />
            <span>{n.label}</span>
          </button>
        )}
      </nav>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Aparência" />
        <TweakSelect label="Paleta" value={t.tema} options={["Rótulo", "Festa", "Litoral", "Sereno"]} onChange={(v) => setTweak("tema", v)} />
        <TweakSelect label="Tipografia" value={t.fonte} options={["Festiva", "Editorial", "Clássica"]} onChange={(v) => setTweak("fonte", v)} />
        <TweakRadio label="Cantos" value={t.cantos} options={["Retos", "Suaves"]} onChange={(v) => setTweak("cantos", v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Densidade" value={t.densidade} options={["Compacto", "Confortável"]} onChange={(v) => setTweak("densidade", v)} />
        <TweakToggle label="Contagem regressiva" value={t.contagem} onChange={(v) => setTweak("contagem", v)} />
      </TweaksPanel>
    </div>);

}

// Render is handled by gate.jsx (<Root/>), which gates <App/> behind the
// password screen and waits for the shared data to load. App is exposed on
// window so the gate can mount it after authentication.
window.App = App;