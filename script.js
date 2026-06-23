/* ══════════════════════════════════════════════════
   script.js — Água Fácil · Vending Machine
   Estrutura:
     1.  Estado global
     2.  Navegação
     3.  Timeout de sessão (idle)
     4.  Relógio
     5.  Toast
     6.  Partículas
     7.  Formatadores
     8.  Fábrica de numpad
     9.  Fábrica de teclado alfabético
    10.  Inicialização dos teclados
    11.  Menu do cliente (dinâmico)
    12.  Seleção de quantidade
    13.  Cadastro
    14.  Pagamento
    15.  RFID
    16.  Porta
    17.  Histórico
    18.  Conclusão e encerramento
══════════════════════════════════════════════════ */


// ══════════════════════════════════════════════════
// 1. ESTADO GLOBAL
// ══════════════════════════════════════════════════
const state = {
  // Dados do cliente logado
  clienteNome:    '',
  clienteCPF:     '',
  clienteGaloes:  0,       // Galões em comodato com o cliente

  // Dados em preenchimento no cadastro
  cpf:            '',
  nome:           '',
  email:          '',
  telefone:       '',

  // Controle do fluxo atual
  // 'compra' | 'troca' | 'devolucao'
  fluxo:          '',

  // Quantidade selecionada na tela S10
  quantidade:     1,

  // Preço unitário da recarga (em reais)
  precoUnitario:  15,

  // Timers ativos
  timer:          null,
  timerSessao:    null,
};

// Dados simulados de clientes — substituir por chamada à API
const CLIENTES_MOCK = {
  '07057241313': { nome: 'Gefison Amorim',  galoes: 2, trocas: 8,  gasto: 145, desde: '08/02/2026' },
  '11122233344': { nome: 'Victor Melo',     galoes: 1, trocas: 3,  gasto: 70,  desde: '01/03/2026' },
  '00000000000': { nome: 'Cliente Teste',   galoes: 0, trocas: 0,  gasto: 0,   desde: '18/03/2026' },
};


// ══════════════════════════════════════════════════
// 2. NAVEGAÇÃO ENTRE TELAS
// ══════════════════════════════════════════════════

 function goto(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  // Cancela timer de pagamento ou porta (não o de sessão)
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }

  // Reseta os campos ao entrar nas telas de cadastro
  if (id === 'screen-cad-cpf')   numpadCpfCad.reset();
  if (id === 'screen-cad-nome')  teclaNome.reset();
  if (id === 'screen-cad-email') teclaEmail.reset();
  if (id === 'screen-cad-tel')   numpadTel.reset();

  // Reinicia o timeout de sessão em todas as telas, exceto idle
  if (id !== 'screen-idle') {
    resetarTimeoutSessao();
  } else {
    pararTimeoutSessao();
  }
}


// ══════════════════════════════════════════════════
// 3. TIMEOUT DE SESSÃO — volta ao idle por inatividade
// ══════════════════════════════════════════════════

function resetarTimeoutSessao() {
  pararTimeoutSessao();
  // Após 45s sem toque → mostra aviso "Você está aí?"
  state.timerSessao = setTimeout(() => {
    goto('screen-inatividade');
    iniciarTimerInatividade();
  }, 45 * 1000);
}

function pararTimeoutSessao() {
  if (state.timerSessao) {
    clearTimeout(state.timerSessao);
    state.timerSessao = null;
  }
}

 
function iniciarTimerInatividade() {
  let secs = 15;
  const fill  = document.getElementById('inatividade-timer');
  const count = document.getElementById('inatividade-count');

  fill.style.width  = '100%';
  count.textContent = secs;

  state.timer = setInterval(() => {
    secs--;
    fill.style.width  = (secs / 15 * 100) + '%';
    count.textContent = secs;

    if (secs <= 0) {
      clearInterval(state.timer);
      state.timer = null;
      encerrarSessao();
    }
  }, 1000);
}

/**
 * Botão "Continuar" na tela de inatividade.
 * Volta para o menu e reinicia o timeout.
 */
function continuarSessao() {
  goto('screen-menu-cliente');
  resetarTimeoutSessao();
}

// Qualquer toque na tela reinicia o timeout
document.addEventListener('click', () => {
  const telaAtiva = document.querySelector('.screen.active');
  if (telaAtiva && telaAtiva.id !== 'screen-idle' && telaAtiva.id !== 'screen-inatividade') {
    resetarTimeoutSessao();
  }
});


// ══════════════════════════════════════════════════
// 4. RELÓGIO NO HEADER
// ══════════════════════════════════════════════════
function updateClock() {
  const now = new Date();
  const h   = now.getHours().toString().padStart(2, '0');
  const m   = now.getMinutes().toString().padStart(2, '0');
  document.getElementById('clock').textContent = h + ':' + m;
}
updateClock();
setInterval(updateClock, 10000);


// ══════════════════════════════════════════════════
// 5. TOAST — NOTIFICAÇÕES TEMPORÁRIAS
// ══════════════════════════════════════════════════

/**
 * Exibe uma mensagem flutuante temporária.
 * @param {string} msg — Texto da mensagem
 * @param {number} dur — Duração em ms (padrão 2500)
 */
function showToast(msg, dur = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), dur);
}


// ══════════════════════════════════════════════════
// 6. PARTÍCULAS DE FUNDO
// ══════════════════════════════════════════════════
(function criarParticulas() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 18; i++) {
    const p     = document.createElement('div');
    p.className = 'particle';
    const size  = Math.random() * 6 + 3;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      animation-duration: ${Math.random() * 12 + 8}s;
      animation-delay: ${Math.random() * 10}s;
    `;
    container.appendChild(p);
  }
})();


// ══════════════════════════════════════════════════
// 7. FORMATADORES
// ══════════════════════════════════════════════════

function formatCPF(v) {
  if (v.length <= 3) return v;
  if (v.length <= 6) return v.slice(0,3) + '.' + v.slice(3);
  if (v.length <= 9) return v.slice(0,3) + '.' + v.slice(3,6) + '.' + v.slice(6);
  return v.slice(0,3) + '.' + v.slice(3,6) + '.' + v.slice(6,9) + '-' + v.slice(9);
}

function formatTEL(v) {
  if (v.length <= 2)  return '(' + v;
  if (v.length <= 7)  return '(' + v.slice(0,2) + ') ' + v.slice(2);
  return '(' + v.slice(0,2) + ') ' + v.slice(2,7) + '-' + v.slice(7);
}

function formatBRL(valor) {
  return valor.toFixed(2).replace('.', ',');
}


// ══════════════════════════════════════════════════
// 8. FÁBRICA DE NUMPAD
// ══════════════════════════════════════════════════

/**
 * Cria um numpad interativo.
 * @param {string}   containerId
 * @param {string}   displayId
 * @param {number}   maxLen
 * @param {Function} onComplete  — chamado ao preencher maxLen dígitos
 * @param {Function} [formatFn]  — formatação do display
 */
function buildNumpad(containerId, displayId, maxLen, onComplete, formatFn) {
  const container = document.getElementById(containerId);
  const display   = document.getElementById(displayId);
  let value = '';

  function updateDisplay() {
    if (value) {
      const fmt = formatFn ? formatFn(value) : value;
      display.innerHTML = `<span>${fmt}</span><span class="cursor"></span>`;
    } else {
      const ph = display.dataset.placeholder || '___ ___ ___ __';
      display.innerHTML = `<span class="placeholder">${ph}</span>`;
    }
  }

  function press(digit) {
    if (value.length >= maxLen) return;
    value += digit;
    updateDisplay();
    if (value.length === maxLen) setTimeout(() => onComplete(value), 200);
  }

  function del() {
    value = value.slice(0, -1);
    updateDisplay();
  }

  container.innerHTML = '';
  ['1','2','3','4','5','6','7','8','9'].forEach(k => {
    const btn = document.createElement('div');
    btn.className   = 'numpad-key';
    btn.textContent = k;
    btn.addEventListener('click', () => press(k));
    container.appendChild(btn);
  });

  const delBtn = document.createElement('div');
  delBtn.className = 'numpad-key del';
  delBtn.innerHTML = '⌫';
  delBtn.addEventListener('click', del);
  container.appendChild(delBtn);

  const zeroBtn = document.createElement('div');
  zeroBtn.className   = 'numpad-key zero';
  zeroBtn.textContent = '0';
  zeroBtn.addEventListener('click', () => press('0'));
  container.appendChild(zeroBtn);

  value = '';
  updateDisplay();

  return {
    getValue: () => value,
    reset:    () => { value = ''; updateDisplay(); }
  };
}


// ══════════════════════════════════════════════════
// 9. FÁBRICA DE TECLADO ALFABÉTICO
// ══════════════════════════════════════════════════

/**
 * Cria um teclado QWERTY touch-friendly.
 * @param {string}   containerId
 * @param {string}   displayId
 * @param {string}   placeholder
 * @param {Function} onConfirm   — chamado com o texto confirmado
 */
function buildKeyboard(containerId, displayId, placeholder, onConfirm) {
  const container = document.getElementById(containerId);
  const display   = document.getElementById(displayId);
  let value = '';

  const linhas = [
    ['1','2','3','4','5','6','7','8','9','0'],   // números
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['Z','X','C','V','B','N','M']
  ];

  function updateDisplay() {
    if (value) {
      display.innerHTML = `<span>${value}</span><span class="cursor"></span>`;
    } else {
      display.innerHTML = `<span class="ph">${placeholder}</span>`;
    }
  }

  container.innerHTML = '';
  linhas.forEach(linha => {
    const row = document.createElement('div');
    row.className = 'keyboard-row';
    linha.forEach(char => {
      const k = document.createElement('div');
      k.className   = 'key';
      k.textContent = char;
      k.addEventListener('click', () => { value += char; updateDisplay(); });
      row.appendChild(k);
    });
    container.appendChild(row);
  });

  // Linha de símbolos úteis para email e nomes
  const simbolRow = document.createElement('div');
  simbolRow.className = 'keyboard-row';
  ['@', '.', '-', '_'].forEach(s => {
    const k = document.createElement('div');
    k.className   = 'key';
    k.textContent = s;
    k.addEventListener('click', () => { value += s; updateDisplay(); });
    simbolRow.appendChild(k);
  });
  container.appendChild(simbolRow);

  // Linha final: Espaço + Backspace + OK
  const lastRow = document.createElement('div');
  lastRow.className = 'keyboard-row';

  const spaceKey = document.createElement('div');
  spaceKey.className   = 'key space';
  spaceKey.textContent = 'ESPAÇO';
  spaceKey.addEventListener('click', () => {
    if (value.length > 0 && value.slice(-1) !== ' ') { value += ' '; updateDisplay(); }
  });

  const backKey = document.createElement('div');
  backKey.className   = 'key back';
  backKey.textContent = '⌫';
  backKey.addEventListener('click', () => { value = value.slice(0,-1); updateDisplay(); });

  const okKey = document.createElement('div');
  okKey.className   = 'key confirm';
  okKey.textContent = '✔ OK';
  okKey.addEventListener('click', () => {
    if (value.trim().length < 3) {
      showToast('⚠️ Mínimo 3 caracteres');
      return;
    }
    onConfirm(value.trim());
  });

  lastRow.appendChild(spaceKey);
  lastRow.appendChild(backKey);
  lastRow.appendChild(okKey);
  container.appendChild(lastRow);

  updateDisplay();

  return {
    getValue: () => value,
    reset:    () => { value = ''; updateDisplay(); }
  };
}


// ══════════════════════════════════════════════════
// 10. INICIALIZAÇÃO DOS TECLADOS
// ══════════════════════════════════════════════════

// ── S03: CPF cliente existente ──────────────────
buildNumpad(
  'numpad-cpf-existente',
  'cpf-existente-display',
  11,
  function onCPFExistente(cpf) {
    const cliente = CLIENTES_MOCK[cpf];
    if (!cliente) {
      goto('screen-cpf-erro');
      return;
    }
    state.clienteCPF    = cpf;
    state.clienteNome   = cliente.nome;
    state.clienteGaloes = cliente.galoes;
    showToast('✅ ' + cliente.nome + ', bem-vindo!');
    renderizarMenuCliente();
    goto('screen-menu-cliente');
  },
  formatCPF
);

// ── S04: CPF novo cadastro ──────────────────────
const numpadCpfCad = buildNumpad(
  'numpad-cpf-cad',
  'cpf-cad-display',
  11,
  function onCPFNovo(cpf) {
    if (CLIENTES_MOCK[cpf]) {
      showToast('❌ CPF já cadastrado — selecione "Já sou cliente"');
      return;
    }
    state.cpf = cpf;
    goto('screen-cad-nome');
  },
  formatCPF
);

// ── S07: Telefone ───────────────────────────────
const numpadTel = buildNumpad(
  'numpad-tel',
  'tel-display',
  11,
  function onTelefone(tel) {
    state.telefone = tel;
    setTimeout(() => goto('screen-cad-termo'), 300);
  },
  formatTEL
);

// ── S05: Nome ───────────────────────────────────
const teclaNome = buildKeyboard(
  'keyboard-nome',
  'nome-display',
  'Digite seu nome completo...',
  function onNome(nome) {
    state.nome = nome;
    showToast('✅ Nome salvo!');
    goto('screen-cad-email');
  }
);

// ── S06: Email ──────────────────────────────────
const teclaEmail = buildKeyboard(
  'keyboard-email',
  'email-display',
  'exemplo@email.com...',
  function onEmail(email) {
    if (!email.includes('@') || !email.includes('.')) {
      showToast('⚠️ Digite um e-mail válido');
      return;
    }
    state.email = email;
    showToast('✅ E-mail salvo!');
    goto('screen-cad-tel');
  }
);

// ══════════════════════════════════════════════════
// 11. MENU DO CLIENTE — renderização dinâmica
// ══════════════════════════════════════════════════

/**
 * Monta o menu conforme a quantidade de galões do cliente.
 * 0 galões → só Comprar e Histórico
 * 1+ galões → Comprar, Trocar, Devolver e Histórico
 */
function renderizarMenuCliente() {
  const cpfMascarado = '•••.•••.•••-' + state.clienteCPF.slice(-2);
  const subTexto = state.clienteGaloes === 0
    ? 'Nenhum galão em comodato'
    : `${state.clienteGaloes} galão(ões) em comodato`;

  document.getElementById('cliente-nome-display').textContent = state.clienteNome;
  document.getElementById('cliente-sub-display').textContent =
    cpfMascarado + '  |  ' + subTexto;

  const grid = document.getElementById('menu-opcoes');
  grid.innerHTML = '';

  // Opção: Comprar (sempre disponível)
  grid.innerHTML += criarCardMenu('🛒', 'Comprar Água', 'Adquirir galão(ões) novo(s)', 'compra');

  // Opções: Trocar e Devolver (só se tiver galões)
  if (state.clienteGaloes > 0) {
    grid.innerHTML += criarCardMenu('🔄', 'Trocar Galão', 'Devolva o vazio e pegue um cheio', 'troca');
    grid.innerHTML += criarCardMenu('↩️', 'Devolver Galão', 'Encerrar comodato', 'devolucao');
  }

  // Opção: Histórico (sempre disponível)
  grid.innerHTML += criarCardMenu('📊', 'Histórico', 'Ver galões e transações', 'historico');
}

/**
 * Retorna o HTML de um card do menu.
 * @param {string} icon
 * @param {string} titulo
 * @param {string} desc
 * @param {string} acao — 'compra' | 'troca' | 'devolucao' | 'historico'
 */
function criarCardMenu(icon, titulo, desc, acao) {
  const highlight = acao === 'troca' ? ' highlight' : '';
  return `
    <div class="menu-card${highlight}" onclick="selecionarFluxo('${acao}')">
      <div class="menu-card-icon">${icon}</div>
      <div class="menu-card-title">${titulo}</div>
      <div class="menu-card-desc">${desc}</div>
    </div>
  `;
}

/**
 * Direciona o cliente para o fluxo correto ao clicar no menu.
 * @param {string} fluxo — 'compra' | 'troca' | 'devolucao' | 'historico'
 */
function selecionarFluxo(fluxo) {
  state.fluxo    = fluxo;
  state.quantidade = 1;

  if (fluxo === 'historico') {
    renderizarHistorico();
    goto('screen-historico');
    return;
  }

  abrirSelecaoQuantidade(fluxo);
}


// ══════════════════════════════════════════════════
// 12. SELEÇÃO DE QUANTIDADE — tela S10 unificada
// ══════════════════════════════════════════════════

/**
 * Configura e abre a tela de seleção de quantidade.
 * O contexto (compra, troca ou devolução) muda os textos e limites.
 * @param {string} fluxo
 */
function abrirSelecaoQuantidade(fluxo) {
  state.quantidade = 1;

  const config = {
    compra: {
      label:       'Compra',
      titulo:      'Quantos galões deseja comprar?',
      subtitulo:   'Cada galão inclui a recarga de 20 litros',
      valorLabel:  'Total a pagar',
      btnIcone:    '💳',
      btnTexto:    'Avançar para pagamento',
      maximo:      2,
      mostraInfo:  false,
    },
    troca: {
      label:       'Troca',
      titulo:      'Quantos galões deseja trocar?',
      subtitulo:   'Você devolve vazios e recebe o mesmo número cheios',
      valorLabel:  'Total da recarga',
      btnIcone:    '💳',
      btnTexto:    'Avançar para pagamento',
      maximo:      state.clienteGaloes,
      mostraInfo:  true,
      infoLabel:   'Galões disponíveis para troca',
      infoValor:   state.clienteGaloes,
    },
    devolucao: {
      label:       'Devolução',
      titulo:      'Quantos galões deseja devolver?',
      subtitulo:   'Os galões serão registrados como devolvidos',
      valorLabel:  'Sem cobrança',
      btnIcone:    '↩️',
      btnTexto:    'Confirmar devolução',
      maximo:      state.clienteGaloes,
      mostraInfo:  true,
      infoLabel:   'Galões em seu comodato',
      infoValor:   state.clienteGaloes,
    },
  };

  const c = config[fluxo];

  document.getElementById('qtd-label').textContent    = c.label;
  document.getElementById('qtd-titulo').textContent   = c.titulo;
  document.getElementById('qtd-subtitulo').textContent = c.subtitulo;
  document.getElementById('qtd-valor-label').textContent = c.valorLabel;
  document.getElementById('qtd-btn-icon').textContent = c.btnIcone;
  document.getElementById('qtd-btn-texto').textContent = c.btnTexto;
  document.getElementById('qtd-numero').textContent   = '1';

  // Linha de info (máximo disponível)
  const infoRow = document.getElementById('qtd-info-row');
  if (c.mostraInfo) {
    infoRow.style.display = 'flex';
    document.getElementById('qtd-info-label').textContent = c.infoLabel;
    document.getElementById('qtd-info-valor').textContent = c.infoValor;
  } else {
    infoRow.style.display = 'none';
  }

  // Armazena o máximo no estado para uso nos botões + / -
  state._qtdMaximo = c.maximo;

  atualizarValorQuantidade();
  goto('screen-quantidade');
}

/**
 * Incrementa ou decrementa a quantidade selecionada.
 * @param {number} delta — +1 ou -1
 */
function alterarQtd(delta) {
  const nova = state.quantidade + delta;
  if (nova < 1 || nova > state._qtdMaximo) return;
  state.quantidade = nova;
  document.getElementById('qtd-numero').textContent = nova;
  atualizarValorQuantidade();
}

/**
 * Atualiza o valor exibido conforme quantidade e fluxo.
 */
function atualizarValorQuantidade() {
  let total = '';
  if (state.fluxo === 'devolucao') {
    total = 'Gratuito';
  } else {
    total = formatBRL(state.quantidade * state.precoUnitario);
  }
  document.getElementById('qtd-total').textContent = total;
}

if (state.fluxo === 'compra' || state.fluxo === 'troca') {
  // Monta o resumo
  const caucao      = state.clienteGaloes === 0 ? 10 : 0;
  const totalRecarga = state.quantidade * state.precoUnitario;
  const total        = totalRecarga + caucao;

  document.getElementById('resumo-label').textContent =
    state.fluxo === 'compra' ? 'Resumo da compra' : 'Resumo da troca';
  document.getElementById('resumo-quantidade').textContent =
    state.quantidade + ' galão(ões)';
  document.getElementById('resumo-recarga').textContent =
    'R$ ' + formatBRL(totalRecarga);
  document.getElementById('resumo-total').textContent =
    formatBRL(total);
  document.getElementById('pgto-total').textContent =
    formatBRL(total);

  // Mostra caução só para cliente novo (0 galões)
  document.getElementById('resumo-row-caucao').style.display =
    state.clienteGaloes === 0 ? 'flex' : 'none';

  goto('screen-resumo-compra');


// ══════════════════════════════════════════════════
// 13. CADASTRO
// ══════════════════════════════════════════════════

/**
 * Chamada ao aceitar o termo de comodato.
 * Valida dados e avança para o menu do cliente.
 */
function concluirCadastro() {
  if (!state.cpf || !state.nome || !state.email || !state.telefone) {
    showToast('⚠️ Dados incompletos — volte e preencha tudo');
    return;
  }

  // TODO: POST /api/v1/clientes com { cpf, nome, email, telefone }

  // Simula cliente recém-cadastrado (0 galões)
  state.clienteCPF    = state.cpf;
  state.clienteNome   = state.nome;
  state.clienteGaloes = 0;

  showToast('🎉 Cadastro realizado! Bem-vindo, ' + state.nome + '!');

  // Novo cliente vai direto para compra
  renderizarMenuCliente();
  goto('screen-menu-cliente');
}


// ══════════════════════════════════════════════════
// 14. PAGAMENTO
// ══════════════════════════════════════════════════

/**
 * Inicia o fluxo de pagamento.
 * @param {string} metodo — 'PIX' | 'Débito' | 'Crédito' | 'Parcelado'
 */
function processarPagamento(metodo) {
  const mensagens = {
    'PIX':       'Escaneie o QR Code que aparecerá na maquininha',
    'Débito':    'Aproxime ou insira o cartão de débito na maquininha',
    'Crédito':   'Aproxime ou insira o cartão de crédito na maquininha',
    'Parcelado': 'Insira o cartão e escolha as parcelas na maquininha',
  };

  document.getElementById('metodo-pagamento-msg').textContent =
    mensagens[metodo] || 'Realize o pagamento na maquininha';

  // TODO: POST /api/v1/pagamentos com { valor, metodo, fluxo }
  goto('screen-pgto-recusado');
  startPaymentTimer();
}

/**
 * Timer de espera pelo pagamento (60 segundos).
 * DEMO: aprova em 3 segundos. Remover em produção.
 */
function startPaymentTimer() {
  let secs = 60;
  const fill  = document.getElementById('timer-fill');
  const count = document.getElementById('timer-count');

  state.timer = setInterval(() => {
    secs--;
    fill.style.width  = (secs / 60 * 100) + '%';
    count.textContent = secs;

    if (secs <= 0) {
      clearInterval(state.timer);
      state.timer = null;
      goto('screen-pgto-recusado');
      return;
    }

    // ── DEMO: aprova automaticamente em 3s ──
    if (secs === 57) {
      clearInterval(state.timer);
      state.timer = null;
      showToast('✅ Pagamento aprovado!');
      pagamentoAprovado();
    }
  }, 1000);
}

/**
 * Chamada quando o pagamento é aprovado.
 * Direciona conforme o fluxo atual.
 */
function pagamentoAprovado() {
  if (state.fluxo === 'compra') {
    // Compra: abre porta diretamente
    abrirPorta();

  } else if (state.fluxo === 'troca') {
    // Troca: primeiro insere o galão vazio, depois abre porta
    document.getElementById('rfid-titulo').textContent = 'Insira o Galão Vazio';
    document.getElementById('rfid-msg').textContent =
      `Insira ${state.quantidade} galão(ões) vazio(s) na entrada indicada.\nO sistema identificará pelo RFID.`;
    goto('screen-rfid-inserir');
  }
}


// ══════════════════════════════════════════════════
// 15. RFID
// ══════════════════════════════════════════════════

/**
 * Simula leitura RFID.
 * PRODUÇÃO: substituir por evento MQTT do ESP32
 * tópico: vm/{id}/evt/rfid/leitura
 */
function simularLeituraRFID() {
  showToast('📡 Lendo tag RFID...');

  setTimeout(() => {
    // 80% de chance de sucesso na demo
    const sucesso = Math.random() > 0.2;

    if (!sucesso) {
      goto('screen-rfid-erro');
      return;
    }

    // Tag simulada
    const tag = 'E200 34' + Math.floor(Math.random() * 99).toString().padStart(2,'0') + ' AB7F';

    document.getElementById('rfid-ok-tag').textContent = tag;

    if (state.fluxo === 'troca') {
      document.getElementById('rfid-ok-titulo').textContent = 'Galão Reconhecido!';
      document.getElementById('rfid-ok-row-valor').style.display = 'none';
      document.getElementById('rfid-ok-btn-texto').textContent   = 'Retirar galão cheio';

    } else if (state.fluxo === 'devolucao') {
      document.getElementById('rfid-ok-titulo').textContent = 'Devolução Confirmada!';
      document.getElementById('rfid-ok-row-valor').style.display = 'flex';
      document.getElementById('rfid-ok-valor').textContent  = state.quantidade + ' galão(ões)';
      document.getElementById('rfid-ok-btn-texto').textContent   = 'Concluir devolução';
    }

    goto('screen-rfid-ok');
  }, 2000);
}

/**
 * Ação do botão de confirmação na tela S14 (RFID OK).
 */
function confirmarRFID() {
  if (state.fluxo === 'troca') {
    abrirPorta();
  } else if (state.fluxo === 'devolucao') {
    // TODO: PATCH /api/v1/clientes/{cpf}/galoes com { devolvidos: quantidade }
    state.clienteGaloes -= state.quantidade;
    document.getElementById('concluida-msg').textContent =
      `${state.quantidade} galão(ões) devolvido(s) com sucesso.\nObrigado por usar Água Fácil! 💧`;
    encerrarComSucesso();
  }
}


// ══════════════════════════════════════════════════
// 16. PORTA
// ══════════════════════════════════════════════════

/**
 * Abre a porta e inicia o timer de fechamento automático.
 * TODO: enviar comando MQTT ao ESP32 para abrir porta física.
 */
function abrirPorta() {
  // Gera números de portas aleatórios (1 a 9)
  const porta1 = Math.floor(Math.random() * 9) + 1;
  let porta2   = Math.floor(Math.random() * 9) + 1;

  // Garante que as duas portas sejam diferentes
  while (porta2 === porta1) 
    porta2 = Math.floor(Math.random() * 9) + 1;
  }

  // Monta o texto conforme a quantidade
  const textoPorta = state.quantidade === 2
    ? `Portas Nº ${porta1} e Nº ${porta2}`
    : `Porta Nº ${porta1}`;

  const textoMsg = state.quantidade === 2
    ? `Retire seus ${state.quantidade} galões cheios.`
    : `Retire seu galão cheio.`;

  document.getElementById('porta-numero').textContent = textoPorta;
  document.getElementById('porta-msg').textContent    = textoMsg;

  goto('screen-porta-aberta');
  startPortaTimer();
}

/**
 * Timer de abertura de porta (30 segundos).
 */
function startPortaTimer() {
  let secs = 30;
  const fill  = document.getElementById('porta-timer');
  const count = document.getElementById('porta-count');

  state.timer = setInterval(() => {
    secs--;
    fill.style.width  = (secs / 30 * 100) + '%';
    count.textContent = secs;

    if (secs <= 0) {
      clearInterval(state.timer);
      state.timer = null;

      // TODO: enviar comando MQTT para fechar porta
      document.getElementById('concluida-msg').textContent =
        'Sua transação foi concluída com sucesso.\nObrigado por usar Água Fácil! 💧';
      encerrarComSucesso();
    }
  }, 1000);
}
/**
 * Cliente confirma que retirou o produto.
 * Cancela o timer e vai para conclusão.
 */
function confirmarRetirada() {
    if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
    }
  // TODO: enviar comando MQTT para fechar porta
  document.getElementById('concluida-msg').textContent =
    'Produto retirado com sucesso.\nObrigado por usar Água Fácil! 💧';
  encerrarComSucesso();
}

// ══════════════════════════════════════════════════
// 17. HISTÓRICO
// ══════════════════════════════════════════════════

function renderizarHistorico() {
  // TODO: GET /api/v1/clientes/{cpf}/historico
  const cliente = CLIENTES_MOCK[state.clienteCPF];
  if (!cliente) return;

  document.getElementById('historico-nome').textContent = state.clienteNome;
  document.getElementById('historico-sub').textContent  = 'Cliente desde ' + cliente.desde;
  document.getElementById('hist-galoes').textContent    = cliente.galoes;
  document.getElementById('hist-trocas').textContent    = cliente.trocas;
  

  // Transações simuladas
  const lista = document.getElementById('historico-lista');
  const transacoes = [
    { data: '09/03/2026', desc: 'Troca de galão',     valor: 'R$ 15,00' },
    { data: '24/02/2026', desc: 'Troca de galão',     valor: 'R$ 15,00' },
    { data: '08/02/2026', desc: 'Cadastro + caução',  valor: 'R$ 25,00' },
  ];

  lista.innerHTML = transacoes.map(t => `
    <div class="info-row">
      <span class="info-label">📅 ${t.data} — ${t.desc}</span>
      <span class="info-value">${t.valor}</span>
    </div>
  `).join('');
}


// ══════════════════════════════════════════════════
// 18. CONCLUSÃO E ENCERRAMENTO
// ══════════════════════════════════════════════════

/**
 * Vai para a tela de conclusão (S16) e inicia contagem regressiva.
 */
function encerrarComSucesso() {
  goto('screen-concluida');

  let secs = 10;
  const fill  = document.getElementById('concluida-timer');
  const count = document.getElementById('concluida-count');

  fill.style.width  = '100%';
  count.textContent = secs;

  state.timer = setInterval(() => {
    secs--;
    fill.style.width  = (secs / 10 * 100) + '%';
    count.textContent = secs;

    if (secs <= 0) {
      clearInterval(state.timer);
      state.timer = null;
      encerrarSessao();
    }
  }, 1000);
}

/**
 * Limpa o estado e volta ao idle.
 */
function encerrarSessao() {
  if (state.timer)       { clearInterval(state.timer);   state.timer = null; }
  if (state.timerSessao) { clearTimeout(state.timerSessao); state.timerSessao = null; }

  // Limpa dados da sessão
  state.clienteNome    = '';
  state.clienteCPF     = '';
  state.clienteGaloes  = 0;
  state.cpf            = '';
  state.nome           = '';
  state.email          = '';
  state.telefone       = '';
  state.fluxo          = '';
  state.quantidade     = 1;

  goto('screen-idle');
  showToast('👋 Até logo!');
}