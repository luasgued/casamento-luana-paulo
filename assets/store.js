/* ============================================================================
 *  store.js — estado compartilhado + autenticação (sem JSX, roda direto)
 * ----------------------------------------------------------------------------
 *  Expõe na window:
 *    • useStore(chave, valorInicial)  → igual ao React.useState, mas o valor
 *      é sincronizado em tempo real entre os dois acessos via Firestore.
 *    • Wedding  → controlador de login/fases usado pela tela de senha (gate).
 *
 *  Dois modos, escolhidos automaticamente:
 *    • NUVEM  (Firebase configurado): login = usuário do Firebase Auth,
 *      dados = documento único "wedding/state" no Firestore, em tempo real.
 *    • LOCAL  (Firebase ainda não configurado): login = senha local,
 *      dados = localStorage deste navegador. Serve para testar antes.
 * ========================================================================== */
(function () {
  "use strict";

  // ---- detecta se o Firebase já foi configurado -------------------------
  var cfg = window.FIREBASE_CONFIG || {};
  var CONFIGURED =
    !!cfg.apiKey &&
    cfg.apiKey.indexOf("COLE_AQUI") === -1 &&
    !!cfg.projectId &&
    cfg.projectId.indexOf("COLE_AQUI") === -1 &&
    typeof firebase !== "undefined";

  var LOGIN_EMAIL = window.APP_LOGIN_EMAIL || "casal@luanaepaulo.casamento";
  var LOCAL_PASSWORD = window.APP_LOCAL_PASSWORD || "casamento";
  var LS_DATA = "casamento.estado";
  var LS_AUTH = "casamento.local-auth";
  var DOC_PATH = { col: "wedding", id: "state" };
  var STORE_KEYS = ["tarefas", "convidados", "orcamento", "fornecedores", "categorias"];

  // ---- estado em memória + assinantes (React) ---------------------------
  var STATE = {};
  var dataListeners = new Set();
  var phaseListeners = new Set();
  var phase = "checking"; // checking | login | loading | ready
  var lastSyncedJSON = null; // evita re-escrever o que acabou de chegar
  var saveTimer = null;

  var db = null;
  var auth = null;

  function notifyData() { dataListeners.forEach(function (l) { l(); }); }
  function setPhase(p) { phase = p; phaseListeners.forEach(function (l) { l(p); }); }

  // monta o estado inicial a partir das sementes (window.TAREFAS, etc.)
  function seedState() {
    return {
      tarefas: window.TAREFAS,
      convidados: window.CONVIDADOS,
      orcamento: window.ORCAMENTO,
      fornecedores: window.FORNECEDORES,
      categorias: window.CATEGORIAS,
    };
  }

  // só os campos que sincronizamos (ignora chaves desconhecidas)
  function pick(obj) {
    var out = {};
    STORE_KEYS.forEach(function (k) { if (obj && obj[k] !== undefined) out[k] = obj[k]; });
    return out;
  }

  // ---- persistência -----------------------------------------------------
  function saveSoon() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      saveTimer = null;
      var json = JSON.stringify(pick(STATE));
      if (json === lastSyncedJSON) return; // nada mudou de verdade
      lastSyncedJSON = json;
      if (CONFIGURED && db) {
        db.collection(DOC_PATH.col).doc(DOC_PATH.id)
          .set({ state: pick(STATE), updatedAt: Date.now() }, { merge: true })
          .catch(function (e) { console.warn("[store] falha ao salvar:", e && e.message); });
      } else {
        try { localStorage.setItem(LS_DATA, json); } catch (e) {}
      }
    }, 600);
  }

  // aplica dados vindos de fora (Firestore/localStorage) sem disparar gravação
  function applyRemote(incoming) {
    var merged = Object.assign({}, STATE, pick(incoming || {}));
    STATE = merged;
    lastSyncedJSON = JSON.stringify(pick(STATE));
    notifyData();
  }

  // ---- carga inicial dos dados (após login) -----------------------------
  function loadData() {
    if (CONFIGURED && db) {
      var ref = db.collection(DOC_PATH.col).doc(DOC_PATH.id);
      return ref.get().then(function (snap) {
        if (snap.exists && snap.data() && snap.data().state) {
          applyRemote(snap.data().state);
        } else {
          // primeiro acesso: grava as sementes para os dois verem o mesmo início
          STATE = seedState();
          lastSyncedJSON = null;
          return ref.set({ state: pick(STATE), updatedAt: Date.now() }).then(function () {
            lastSyncedJSON = JSON.stringify(pick(STATE));
          });
        }
      }).then(function () {
        // tempo real: qualquer mudança do outro acesso chega aqui
        ref.onSnapshot(function (snap) {
          if (snap.exists && snap.data() && snap.data().state) {
            var json = JSON.stringify(pick(snap.data().state));
            if (json !== lastSyncedJSON) applyRemote(snap.data().state);
          }
        });
      });
    } else {
      // modo local
      var saved = null;
      try { saved = JSON.parse(localStorage.getItem(LS_DATA) || "null"); } catch (e) {}
      STATE = saved ? Object.assign({}, seedState(), pick(saved)) : seedState();
      lastSyncedJSON = JSON.stringify(pick(STATE));
      return Promise.resolve();
    }
  }

  // ---- hook React: useStore(chave, semente) -----------------------------
  function useStore(key, seed) {
    if (STATE[key] === undefined) STATE[key] = seed;
    var tick = React.useState(0);
    var force = tick[1];
    React.useEffect(function () {
      var l = function () { force(function (n) { return n + 1; }); };
      dataListeners.add(l);
      return function () { dataListeners.delete(l); };
    }, []);
    var setValue = React.useCallback(function (v) {
      var cur = STATE[key];
      var next = typeof v === "function" ? v(cur) : v;
      STATE = Object.assign({}, STATE);
      STATE[key] = next;
      notifyData();
      saveSoon();
    }, [key]);
    return [STATE[key], setValue];
  }

  // ---- login ------------------------------------------------------------
  function login(password) {
    if (CONFIGURED && auth) {
      return auth.signInWithEmailAndPassword(LOGIN_EMAIL, password).then(function () {
        /* onAuthStateChanged cuida da transição de fase */
      });
    }
    // modo local: compara a senha configurada
    return new Promise(function (resolve, reject) {
      if (String(password) === String(LOCAL_PASSWORD)) {
        try { sessionStorage.setItem(LS_AUTH, "1"); } catch (e) {}
        setPhase("loading");
        loadData().then(function () { setPhase("ready"); });
        resolve();
      } else {
        reject(new Error("senha-invalida"));
      }
    });
  }

  function logout() {
    if (CONFIGURED && auth) { auth.signOut(); }
    else { try { sessionStorage.removeItem(LS_AUTH); } catch (e) {} setPhase("login"); }
  }

  // ---- inicialização ----------------------------------------------------
  function init() {
    if (CONFIGURED) {
      try {
        firebase.initializeApp(cfg);
        db = firebase.firestore();
        auth = firebase.auth();
      } catch (e) {
        console.error("[store] erro ao iniciar Firebase:", e && e.message);
      }
      auth.onAuthStateChanged(function (user) {
        if (user) {
          setPhase("loading");
          loadData().then(function () { setPhase("ready"); })
            .catch(function (e) { console.error("[store] erro ao carregar dados:", e); setPhase("ready"); });
        } else {
          setPhase("login");
        }
      });
    } else {
      var authed = false;
      try { authed = sessionStorage.getItem(LS_AUTH) === "1"; } catch (e) {}
      if (authed) { setPhase("loading"); loadData().then(function () { setPhase("ready"); }); }
      else { setPhase("login"); }
    }
  }

  window.useStore = useStore;
  window.Wedding = {
    init: init,
    login: login,
    logout: logout,
    configured: CONFIGURED,
    getPhase: function () { return phase; },
    onPhase: function (cb) { phaseListeners.add(cb); return function () { phaseListeners.delete(cb); }; },
  };
})();
