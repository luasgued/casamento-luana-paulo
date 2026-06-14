/* ============================================================================
 *  CONFIGURAÇÃO — preencha aqui (passo a passo no README.md)
 * ----------------------------------------------------------------------------
 *  Este arquivo é o ÚNICO que você precisa editar para o site funcionar de
 *  forma compartilhada entre você e a outra pessoa.
 * ========================================================================== */

/* 1) Cole aqui o objeto de configuração do seu projeto Firebase.
 *    (Firebase Console → ⚙ Configurações do projeto → Seus apps → SDK → Config)
 *    Enquanto estiver com os valores "COLE_AQUI...", o site funciona em modo
 *    LOCAL (só neste navegador, sem compartilhar) — útil para testar antes. */

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTeXPQch2fabFJbtPmo4Y_pK5SJum6Go0",
  authDomain: "casamento-lp.firebaseapp.com",
  projectId: "casamento-lp",
  storageBucket: "casamento-lp.firebasestorage.app",
  messagingSenderId: "1038904994432",
  appId: "1:1038904994432:web:e092af39b7994c6b115465"
};

window.FIREBASE_CONFIG = firebaseConfig


/* 2) E-mail FIXO da conta compartilhada que vocês dois usam para entrar.
 *    Crie esse usuário no Firebase (Authentication → Users → Add user) com
 *    este e-mail e a senha que vocês vão compartilhar. O site só pede a senha;
 *    o e-mail abaixo é usado automaticamente nos bastidores. */
window.APP_LOGIN_EMAIL = "luanareginnas@gmail.com";

/* 3) Senha do MODO LOCAL (usada só enquanto o Firebase acima não está
 *    configurado, para você conseguir abrir e testar o site). Depois de
 *    configurar o Firebase, a senha que vale é a do usuário criado no passo 2.
 *    Troque "casamento" pela senha que preferir para os testes locais. */
window.APP_LOCAL_PASSWORD = "casamento";
