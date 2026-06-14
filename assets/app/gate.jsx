// gate.jsx — tela de senha + bootstrap. Decide entre login, carregando e o app.
// Carregado por último: App() já está em window.App.

function Spinner({ label }) {
  return (
    <div className="gate-wrap">
      <div className="gate-card gate-center">
        <div className="gate-mono">CASAMENTO</div>
        <div className="gate-names serif">L <span className="amp">&amp;</span> P</div>
        <div className="gate-spinner" />
        <div className="gate-hint">{label || "Carregando…"}</div>
      </div>
    </div>
  );
}

function LoginGate() {
  const [senha, setSenha] = React.useState("");
  const [erro, setErro] = React.useState("");
  const [carregando, setCarregando] = React.useState(false);

  const entrar = (e) => {
    if (e) e.preventDefault();
    if (!senha.trim() || carregando) return;
    setCarregando(true);
    setErro("");
    window.Wedding.login(senha)
      .catch((err) => {
        const code = (err && (err.code || err.message)) || "";
        if (/wrong-password|invalid-credential|senha-invalida|invalid-login/i.test(code)) {
          setErro("Senha incorreta. Tente novamente.");
        } else if (/too-many-requests/i.test(code)) {
          setErro("Muitas tentativas. Aguarde um momento e tente de novo.");
        } else if (/network/i.test(code)) {
          setErro("Sem conexão. Verifique sua internet.");
        } else {
          setErro("Não foi possível entrar. " + (code || ""));
        }
        setCarregando(false);
      });
  };

  return (
    <div className="gate-wrap">
      <form className="gate-card" onSubmit={entrar}>
        <div className="gate-mono">CASAMENTO</div>
        <div className="gate-names serif">L <span className="amp">&amp;</span> P</div>
        <div className="gate-date">10.10.2027</div>
        <div className="gate-sub">Painel de planejamento · Luana &amp; Paulo</div>

        <label className="gate-field">
          <span>Senha de acesso</span>
          <input
            type="password"
            autoFocus
            value={senha}
            onChange={(e) => { setSenha(e.target.value); setErro(""); }}
            placeholder="Digite a senha"
            className="gate-input"
          />
        </label>

        {erro && <div className="gate-error">{erro}</div>}

        <button type="submit" className="gate-btn" disabled={carregando}>
          {carregando ? "Entrando…" : "Entrar"}
        </button>

        {!window.Wedding.configured && (
          <div className="gate-note">
            Modo local (este navegador). Configure o Firebase para compartilhar
            os dados entre os dois acessos — veja o README.
          </div>
        )}
      </form>
    </div>
  );
}

function Root() {
  const [phase, setLocalPhase] = React.useState(window.Wedding.getPhase());
  React.useEffect(() => {
    const off = window.Wedding.onPhase(setLocalPhase);
    window.Wedding.init();
    return off;
  }, []);

  if (phase === "ready") {
    const App = window.App;
    return <App />;
  }
  if (phase === "loading") return <Spinner label="Carregando os dados do casamento…" />;
  if (phase === "checking") return <Spinner label="Iniciando…" />;
  return <LoginGate />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
