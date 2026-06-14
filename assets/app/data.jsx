// data.jsx — seed data for Luana & Paulo's wedding manager
// Exposed on window for other babel scripts.

const WEDDING = {
  noiva: "Luana",
  noivo: "Paulo",
  data: "2027-10-10T16:00:00",
  dataLabel: "10 de Outubro de 2027",
  local: "Papillon Beach · Ubatuba, SP",
  convidadosMeta: 120,
  orcamentoTotal: 200000,
};

// ---- Orçamento ----------------------------------------------------------
// status: nao-iniciado | cotando | contratado
// pagamentos: mapa "AAAA-MM" -> valor (cronograma de pagamento até o casamento)
const ORCAMENTO = [
  { id: "buffet",     nome: "Buffet & Gastronomia",  previsto: 56000, realizado: 0,     fornecedor: null, contato: "", instagram: "", parcelas: "", status: "cotando",     pagamentos: {} },
  { id: "espaco",     nome: "Espaço & Locação",      previsto: 34000, realizado: 34000, fornecedor: "Fazenda Vila dos Sonhos", contato: "Comercial · (11) 9 9810-2200", instagram: "@fazendaviladossonhos", parcelas: "Entrada + saldo 30 dias antes", status: "contratado", pagamentos: { "2026-06": 17000, "2027-09": 17000 } },
  { id: "foto",       nome: "Fotografia",            previsto: 14000, realizado: 12500, fornecedor: "Estúdio Luz Natural", contato: "Marina & Téo · (11) 9 9444-1212", instagram: "@luznaturalfoto", parcelas: "30% + 5x", status: "contratado", pagamentos: { "2026-06": 3750, "2026-09": 2200, "2027-01": 2200, "2027-05": 2175, "2027-09": 2175 } },
  { id: "decor",      nome: "Decoração & Flores",    previsto: 22000, realizado: 0,     fornecedor: null, contato: "", instagram: "", parcelas: "", status: "cotando",     pagamentos: {} },
  { id: "musica",     nome: "Música & DJ",           previsto: 20000, realizado: 13500, fornecedor: "Banda Cravo & Canela", contato: "Produção · (11) 9 9120-0033", instagram: "@cravoecanela", parcelas: "30% + 4x", status: "contratado", pagamentos: { "2026-07": 4050, "2026-11": 2360, "2027-03": 2360, "2027-07": 2365, "2027-09": 2365 } },
  { id: "vestido",    nome: "Vestido da Noiva",      previsto: 9000,  realizado: 9800,  fornecedor: "Atelier Branco Puro", contato: "Atelier · (11) 9 9655-7788", instagram: "@brancopuro.atelier", parcelas: "50% + 50%", status: "contratado", pagamentos: { "2026-08": 4900, "2027-06": 4900 } },
  { id: "traje",      nome: "Traje do Noivo",        previsto: 3500,  realizado: 3200,  fornecedor: "Sartoria Milano", contato: "Sartoria · (11) 9 9233-1190", instagram: "@sartoriamilano", parcelas: "À vista", status: "contratado", pagamentos: { "2027-07": 1600, "2027-09": 1600 } },
  { id: "beleza",     nome: "Dia da Noiva",          previsto: 4800,  realizado: 0,     fornecedor: null, contato: "", instagram: "", parcelas: "", status: "cotando",     pagamentos: {} },
  { id: "convites",   nome: "Convites & Papelaria",  previsto: 3000,  realizado: 2800,  fornecedor: "Papel & Tinta", contato: "Studio · (11) 9 9100-4521", instagram: "@papeletinta", parcelas: "50% + 50%", status: "contratado", pagamentos: { "2026-10": 1400, "2027-08": 1400 } },
  { id: "bolo",       nome: "Bolo & Doces",          previsto: 6000,  realizado: 0,     fornecedor: null, contato: "", instagram: "", parcelas: "", status: "cotando",     pagamentos: {} },
  { id: "bebidas",    nome: "Bebidas & Bar",         previsto: 12000, realizado: 0,     fornecedor: null, contato: "", instagram: "", parcelas: "", status: "nao-iniciado", pagamentos: {} },
  { id: "celebrante", nome: "Celebrante",            previsto: 2500,  realizado: 2500,  fornecedor: "Padre Henrique", contato: "Paróquia · (11) 9 9001-7766", instagram: "", parcelas: "À vista", status: "contratado", pagamentos: { "2027-09": 2500 } },
  { id: "cerimonial", nome: "Assessoria & Cerimonial", previsto: 11000, realizado: 11000, fornecedor: "Ateliê Cerimônia", contato: "Paula · (11) 9 9870-3344", instagram: "@atelie.cerimonia", parcelas: "30% + 4x", status: "contratado", pagamentos: { "2026-06": 3300, "2026-12": 1925, "2027-04": 1925, "2027-08": 1925, "2027-09": 1925 } },
  { id: "lembranca",  nome: "Lembrancinhas",         previsto: 2400,  realizado: 0,     fornecedor: null, contato: "", instagram: "", parcelas: "", status: "nao-iniciado", pagamentos: {} },
  { id: "aliancas",   nome: "Alianças",              previsto: 6000,  realizado: 5600,  fornecedor: "Ourivesaria Aurora", contato: "Loja · (11) 9 9445-8821", instagram: "@ourivesaria.aurora", parcelas: "50% + 50%", status: "contratado", pagamentos: { "2027-05": 2800, "2027-08": 2800 } },
];

// ---- Fornecedores -------------------------------------------------------
const CRITERIOS = [
  { id: "qualidade",     label: "Qualidade",     peso: 0.30 },
  { id: "atendimento",   label: "Atendimento",   peso: 0.20 },
  { id: "portfolio",     label: "Portfólio",     peso: 0.20 },
  { id: "flexibilidade", label: "Flexibilidade", peso: 0.15 },
  { id: "prazo",         label: "Prazo & Agenda", peso: 0.15 },
];

const CATEGORIAS = [
  { id: "fotografia", nome: "Fotografia" },
  { id: "video",      nome: "Vídeo" },
  { id: "dia-noiva",  nome: "Dia da Noiva" },
  { id: "musica",     nome: "Música" },
  { id: "dj",         nome: "DJ" },
];

const FORNECEDORES = [
  // --- Fotografia (contratado) ---
  {
    id: "fot1", categoria: "fotografia", nome: "Estúdio Luz Natural", contato: "Marina & Téo · (11) 9 9444-1212", instagram: "@luznaturalfoto",
    status: "contratado", preco: 12500, parcelas: "Pago — 30% + 5x", proposta: "propostas/luz-natural.pdf",
    servicos: ["Cobertura fotográfica 10h", "2 fotógrafos", "Ensaio pré-wedding", "Álbum fine art 30x30", "Galeria online", "Fotos tratadas em 30 dias"],
    notas: "Contratado! Estética documental e luz natural maravilhosa.",
    scores: { qualidade: 5, atendimento: 5, portfolio: 5, flexibilidade: 4, prazo: 5 },
  },
  {
    id: "fot2", categoria: "fotografia", nome: "Marcos Vidal Fotografia", contato: "Marcos · (11) 9 9001-5567", instagram: "@marcosvidalfoto",
    status: "analise", preco: 9800, parcelas: "40% sinal + 4x", proposta: "propostas/marcos-vidal.pdf",
    servicos: ["Cobertura fotográfica 8h", "1 fotógrafo", "Galeria online", "100 fotos impressas"],
    notas: "Bom, mas sem ensaio incluso e álbum à parte.",
    scores: { qualidade: 4, atendimento: 4, portfolio: 4, flexibilidade: 3, prazo: 4 },
  },
  {
    id: "fot3", categoria: "fotografia", nome: "Click Eterno", contato: "Estúdio · (11) 9 9755-8890", instagram: "@clicketerno",
    status: "descartado", preco: 8200, parcelas: "50% + 50%", proposta: "propostas/click-eterno.pdf",
    servicos: ["Cobertura fotográfica 6h", "1 fotógrafo", "Galeria online"],
    notas: "Mais barato, porém portfólio inconsistente.",
    scores: { qualidade: 3, atendimento: 3, portfolio: 2, flexibilidade: 3, prazo: 4 },
  },
  // --- Vídeo ---
  {
    id: "vid1", categoria: "video", nome: "Filmes de Afeto", contato: "Lia · (11) 9 9220-7781", instagram: "@filmesdeafeto",
    status: "favorito", preco: 9500, parcelas: "30% sinal + 4x", proposta: "propostas/filmes-afeto.pdf",
    servicos: ["Filme do casamento 5min", "Teaser 1min para redes", "Same-day edit exibido na festa", "Imagens de drone", "2 cinegrafistas"],
    notas: "Edição emocionante e moderna. Same-day edit fez a diferença.",
    scores: { qualidade: 5, atendimento: 5, portfolio: 5, flexibilidade: 4, prazo: 4 },
  },
  {
    id: "vid2", categoria: "video", nome: "Reel Wedding", contato: "Estúdio · (11) 9 9871-4402", instagram: "@reelwedding",
    status: "analise", preco: 7800, parcelas: "40% + 3x", proposta: "propostas/reel-wedding.pdf",
    servicos: ["Filme do casamento 4min", "Teaser 1min", "1 cinegrafista", "Entrega em 45 dias"],
    notas: "Bom preço, sem drone e sem same-day edit.",
    scores: { qualidade: 4, atendimento: 4, portfolio: 4, flexibilidade: 4, prazo: 4 },
  },
  {
    id: "vid3", categoria: "video", nome: "Studio 24fps", contato: "João · (11) 9 9333-1290", instagram: "@studio24fps",
    status: "descartado", preco: 6500, parcelas: "50% + 50%", proposta: "propostas/24fps.pdf",
    servicos: ["Filme resumo 3min", "1 cinegrafista", "Entrega em 60 dias"],
    notas: "Entrega lenta e portfólio mais simples.",
    scores: { qualidade: 3, atendimento: 4, portfolio: 3, flexibilidade: 3, prazo: 2 },
  },
  // --- Dia da Noiva (beleza) ---
  {
    id: "noi1", categoria: "dia-noiva", nome: "Atelier Bem-Noiva", contato: "Duda · (11) 9 9544-3320", instagram: "@bemnoiva.atelier",
    status: "favorito", preco: 4200, parcelas: "50% sinal + 50%", proposta: "propostas/bem-noiva.pdf",
    servicos: ["Cabelo e maquiagem da noiva", "Teste prévio completo", "Maquiagem de 2 madrinhas", "Produtos à prova d'água", "Atendimento no local", "Kit retoque"],
    notas: "Teste impecável, durou a festa inteira. Atendimento acolhedor.",
    scores: { qualidade: 5, atendimento: 5, portfolio: 5, flexibilidade: 4, prazo: 5 },
  },
  {
    id: "noi2", categoria: "dia-noiva", nome: "Studio Glow", contato: "Renata · (11) 9 9120-8845", instagram: "@studioglow",
    status: "analise", preco: 3600, parcelas: "40% + 2x", proposta: "propostas/studio-glow.pdf",
    servicos: ["Cabelo e maquiagem da noiva", "Teste prévio", "Atendimento no local", "Kit retoque"],
    notas: "Ótimo trabalho, mas não inclui madrinhas.",
    scores: { qualidade: 4, atendimento: 4, portfolio: 4, flexibilidade: 4, prazo: 4 },
  },
  {
    id: "noi3", categoria: "dia-noiva", nome: "Make by Duda", contato: "Eduarda · (11) 9 9788-2201", instagram: "@makebyduda",
    status: "analise", preco: 2900, parcelas: "À vista com desconto", proposta: "propostas/make-duda.pdf",
    servicos: ["Maquiagem da noiva", "Teste prévio", "Produtos importados"],
    notas: "Só maquiagem (cabelo à parte). Portfólio jovem e atual.",
    scores: { qualidade: 4, atendimento: 5, portfolio: 4, flexibilidade: 3, prazo: 4 },
  },
  // --- Música (banda / cerimônia) ---
  {
    id: "mus1", categoria: "musica", nome: "Banda Cravo & Canela", contato: "Produção · (11) 9 9120-0033", instagram: "@cravoecanela",
    status: "contratado", preco: 13500, parcelas: "Pago — 30% + 4x", proposta: "propostas/cravo-canela.pdf",
    servicos: ["Banda com 8 integrantes", "Música na cerimônia", "Música na festa", "Som e iluminação", "Repertório personalizado"],
    notas: "Contratado! Versáteis do MPB ao pop, energia incrível.",
    scores: { qualidade: 5, atendimento: 5, portfolio: 5, flexibilidade: 5, prazo: 4 },
  },
  {
    id: "mus2", categoria: "musica", nome: "Trio Acústico Amêndoa", contato: "Studio · (11) 9 9655-4412", instagram: "@trioamendoa",
    status: "descartado", preco: 5200, parcelas: "50% + 50%", proposta: "propostas/amendoa.pdf",
    servicos: ["Trio voz, violão e cello", "Música na cerimônia", "Som próprio", "Repertório clássico"],
    notas: "Lindo para a cerimônia, mas não cobre a festa.",
    scores: { qualidade: 4, atendimento: 4, portfolio: 4, flexibilidade: 3, prazo: 5 },
  },
  // --- DJ (festa) ---
  {
    id: "dj1", categoria: "dj", nome: "DJ Léo Martins", contato: "Léo · (11) 9 9332-7788", instagram: "@djleomartins",
    status: "favorito", preco: 6500, parcelas: "50% sinal + 50%", proposta: "propostas/dj-leo.pdf",
    servicos: ["DJ na festa 6h", "Som e iluminação", "Pista interativa", "Máquina de fumaça", "Reunião de repertório"],
    notas: "Leu bem o público na degustação. Pista cheia garantida.",
    scores: { qualidade: 4, atendimento: 4, portfolio: 4, flexibilidade: 4, prazo: 5 },
  },
  {
    id: "dj2", categoria: "dj", nome: "DJ Marcela House", contato: "Marcela · (11) 9 9477-1180", instagram: "@djmarcelahouse",
    status: "analise", preco: 7200, parcelas: "30% + 4x", proposta: "propostas/marcela-house.pdf",
    servicos: ["DJ na festa 7h", "Som e iluminação premium", "Pista de LED", "Open format", "Saxofonista convidado"],
    notas: "Estrutura impecável e set sofisticado. Um pouco acima do orçamento.",
    scores: { qualidade: 5, atendimento: 5, portfolio: 5, flexibilidade: 4, prazo: 4 },
  },
  {
    id: "dj3", categoria: "dj", nome: "DJ Pulse", contato: "Estúdio · (11) 9 9001-2245", instagram: "@djpulse",
    status: "descartado", preco: 4800, parcelas: "À vista", proposta: "propostas/dj-pulse.pdf",
    servicos: ["DJ na festa 5h", "Som básico", "Iluminação simples"],
    notas: "Preço baixo, mas estrutura aquém do que queremos.",
    scores: { qualidade: 3, atendimento: 3, portfolio: 3, flexibilidade: 3, prazo: 4 },
  },
];

// ---- Tarefas (Kanban) ---------------------------------------------------
// status: todo | doing | done · responsavel: Luana | Paulo | Ambos
const TAREFAS = [
  { id: "t1",  titulo: "Fechar buffet — comparar as 3 propostas",      area: "Fornecedores", responsavel: "Ambos", prazo: "2026-07-15", status: "todo",  prioridade: "alta" },
  { id: "t2",  titulo: "Definir decoração e flores",                    area: "Fornecedores", responsavel: "Luana", prazo: "2026-08-01", status: "todo",  prioridade: "alta" },
  { id: "t3",  titulo: "Escolher DJ para a festa",                      area: "Fornecedores", responsavel: "Paulo", prazo: "2026-07-30", status: "todo",  prioridade: "media" },
  { id: "t4",  titulo: "Provar e escolher bolo e doces",                area: "Fornecedores", responsavel: "Ambos", prazo: "2026-09-10", status: "todo",  prioridade: "media" },
  { id: "t5",  titulo: "Definir lista de bebidas e bar",                area: "Orçamento",    responsavel: "Paulo", prazo: "2026-09-01", status: "todo",  prioridade: "baixa" },
  { id: "t6",  titulo: "Fechar vídeo (favorito: Filmes de Afeto)",      area: "Fornecedores", responsavel: "Luana", prazo: "2026-07-25", status: "todo",  prioridade: "media" },
  { id: "t7",  titulo: "Pagar 2ª parcela do espaço",                    area: "Orçamento",    responsavel: "Paulo", prazo: "2026-06-30", status: "doing", prioridade: "alta" },
  { id: "t8",  titulo: "Agendar prova do vestido",                     area: "Dia da Noiva", responsavel: "Luana", prazo: "2026-07-05", status: "doing", prioridade: "media" },
  { id: "t9",  titulo: "Finalizar arte dos convites",                  area: "Papelaria",   responsavel: "Ambos", prazo: "2026-07-20", status: "doing", prioridade: "media" },
  { id: "t10", titulo: "Reservar a data na Fazenda Vila dos Sonhos",   area: "Orçamento",    responsavel: "Ambos", prazo: "2026-05-10", status: "done",  prioridade: "alta" },
  { id: "t11", titulo: "Contratar fotografia (Estúdio Luz Natural)",    area: "Fornecedores", responsavel: "Luana", prazo: "2026-06-01", status: "done",  prioridade: "alta" },
  { id: "t12", titulo: "Fechar banda (Cravo & Canela)",                area: "Fornecedores", responsavel: "Paulo", prazo: "2026-06-05", status: "done",  prioridade: "media" },
  { id: "t13", titulo: "Contratar cerimonial / assessoria",            area: "Geral",       responsavel: "Ambos", prazo: "2026-05-20", status: "done",  prioridade: "alta" },
  { id: "t14", titulo: "Comprar as alianças",                          area: "Geral",       responsavel: "Ambos", prazo: "2026-06-08", status: "done",  prioridade: "media" },
];

// ---- Convidados ---------------------------------------------------------
const PRIMEIROS = ["Ana","Bruno","Carla","Diego","Eduarda","Felipe","Gabriela","Henrique","Isabela","João","Karina","Lucas","Mariana","Nicolas","Olívia","Pedro","Renata","Rafael","Sofia","Thiago","Vanessa","William","Beatriz","Caio","Daniela","Enzo","Fernanda","Gustavo","Helena","Igor","Júlia","Kevin","Larissa","Marcelo","Natália","Otávio","Patrícia","Rodrigo","Sabrina","Tomás","Yasmin","André","Camila","Davi","Elaine","Fábio","Giovana","Heitor","Ingrid","Joaquim"];
const SOBRENOMES = ["Almeida","Barros","Cardoso","Dias","Esteves","Ferreira","Gomes","Henriques","Iglesias","Júnior","Klein","Lima","Moreira","Nunes","Oliveira","Pereira","Queiroz","Ramos","Souza","Teixeira","Vasconcelos","Xavier","Azevedo","Bittencourt"];
const RELACOES = ["Família","Família","Amigos","Amigos","Amigos","Trabalho","Padrinhos"];

function gerarConvidados(n) {
  const out = [];
  let seed = 42;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < n; i++) {
    const nome = PRIMEIROS[Math.floor(rnd() * PRIMEIROS.length)] + " " + SOBRENOMES[Math.floor(rnd() * SOBRENOMES.length)];
    const lado = rnd() < 0.5 ? "Luana" : "Paulo";
    const grupo = RELACOES[Math.floor(rnd() * RELACOES.length)];
    const r = rnd();
    const rsvp = r < 0.58 ? "confirmado" : r < 0.87 ? "pendente" : "recusado";
    const acompanhante = rnd() < 0.42;
    const crianca = rnd() < 0.08;
    const mesa = rsvp === "confirmado" ? 1 + Math.floor(rnd() * 14) : null;
    const restricao = rnd() < 0.14 ? (rnd() < 0.5 ? "Vegetariano" : rnd() < 0.5 ? "Sem glúten" : "Vegano") : null;
    const idade = crianca ? 2 + Math.floor(rnd() * 11) : 19 + Math.floor(rnd() * 58);
    out.push({ id: "g" + i, nome, lado, grupo, rsvp, acompanhante, crianca, mesa, restricao, idade });
  }
  return out;
}

const CONVIDADOS = gerarConvidados(120);

Object.assign(window, { WEDDING, ORCAMENTO, CRITERIOS, CATEGORIAS, FORNECEDORES, TAREFAS, CONVIDADOS });
