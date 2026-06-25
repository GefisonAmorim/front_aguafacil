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
  clienteNome:    '',
  clienteCPF:     '',
  clienteGaloes:  0,
  cpf:            '',
  nome:           '',
  email:          '',
  telefone:       '',
  fluxo:          '',
  quantidade:     1,
  galoesLidos:    0,  
  precoUnitario:  15,
  _qtdMaximo:     2,
  timer:          null,
  timerSessao:    null,
};

// Dados simulados — substituir por chamada à API
const CLIENTES_MOCK = {
  '07057241313': { nome: 'Gefison Amorim', galoes: 2, trocas: 8,  gasto: 145, desde: '08/02/2026' },
  '11122233344': { nome: 'Victor Melo',    galoes: 1, trocas: 3,  gasto: 70,  desde: '01/03/2026' },
  '00000000000': { nome: 'Cliente Teste',  galoes: 0, trocas: 0,  gasto: 0,   desde: '18/03/2026' },
};
const state = {
  // ... existing fields ...
  galoesLidos: 0,  // contador de galões lidos pelo RFID
};

// ══════════════════════════════════════════════════
// 2. NAVEGAÇÃO ENTRE TELAS
// ══════════════════════════════════════════════════
function goto(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const tela = document.getElementById(id);
  if (!tela) { console.error('Tela não encontrada:', id); return; }
  tela.classList.add('active');

  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }

  // Reseta campos ao entrar nas telas de cadastro
  if (id === 'screen-cpf-existente') numpadCpfExistente.reset();
  if (id === 'screen-cad-cpf')       numpadCpfCad.reset();
  if (id === 'screen-cad-nome')      teclaNome.reset();
  if (id === 'screen-cad-email')     teclaEmail.reset();
  if (id === 'screen-cad-tel')       numpadTel.reset();

  if (id !== 'screen-idle') {
    resetarTimeoutSessao();
  } else {
    pararTimeoutSessao();
  }
}


// ══════════════════════════════════════════════════
// 3. TIMEOUT DE SESSÃO
// ══════════════════════════════════════════════════
function resetarTimeoutSessao() {
  pararTimeoutSessao();
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

function continuarSessao() {
  goto('screen-menu-cliente');
  resetarTimeoutSessao();
}

document.addEventListener('click', () => {
  const telaAtiva = document.querySelector('.screen.active');
  if (telaAtiva && telaAtiva.id !== 'screen-idle' && telaAtiva.id !== 'screen-inatividade') {
    resetarTimeoutSessao();
  }
});


// ══════════════════════════════════════════════════
// 4. RELÓGIO
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
// 5. TOAST
// ══════════════════════════════════════════════════
function showToast(msg, dur = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), dur);
}


// ══════════════════════════════════════════════════
// 6. PARTÍCULAS
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
function buildKeyboard(containerId, displayId, placeholder, onConfirm) {
  const container = document.getElementById(containerId);
  const display   = document.getElementById(displayId);
  let value = '';

  const linhas = [
    ['1','2','3','4','5','6','7','8','9','0'],
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

const numpadCpfExistente = buildNumpad(
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
// 11. MENU DO CLIENTE
// ══════════════════════════════════════════════════
function renderizarMenuCliente() {
  const cpfMascarado = '•••.•••.•••-' + state.clienteCPF.slice(-2);
  const subTexto = state.clienteGaloes === 0
    ? 'Nenhum galão em comodato'
    : `${state.clienteGaloes} galão(ões) em comodato`;

  document.getElementById('cliente-nome-display').textContent = state.clienteNome;
  document.getElementById('cliente-sub-display').textContent  =
    cpfMascarado + '  |  ' + subTexto;

  const grid = document.getElementById('menu-opcoes');
  grid.innerHTML = '';

  // Botão único — detecta troca ou compra automaticamente
  grid.innerHTML += criarCardMenu('💧', 'Pegar Galão',
    state.clienteGaloes > 0 ? 'Trocar vazio ou comprar mais' : 'Adquirir seu primeiro galão',
    'pegar');

  // Devolução só aparece se tiver galões
  if (state.clienteGaloes > 0) {
    grid.innerHTML += criarCardMenu('↩️', 'Devolver Galão', 'Encerrar comodato', 'devolucao');
  }

  // Histórico sempre disponível
  grid.innerHTML += criarCardMenu('📊', 'Histórico', 'Ver galões e transações', 'historico');
}

function criarCardMenu(icon, titulo, desc, acao) {
  const highlight = acao === 'pegar' ? ' highlight' : '';
  return `
    <div class="menu-card${highlight}" onclick="selecionarFluxo('${acao}')">
      <div class="menu-card-icon">${icon}</div>
      <div class="menu-card-title">${titulo}</div>
      <div class="menu-card-desc">${desc}</div>
    </div>
  `;
}

function selecionarFluxo(fluxo) {
  state.fluxo      = fluxo;
  state.quantidade = 1;

  if (fluxo === 'historico') {
    renderizarHistorico();
    goto('screen-historico');
    return;
  }

  if (fluxo === 'devolucao') {
    abrirSelecaoQuantidade('devolucao');
    return;
  }

  if (fluxo === 'pegar') {
    abrirPegarGalao();
    return;
  }
}

function abrirPegarGalao() {
  document.getElementById('pegar-nome').textContent = state.clienteNome;
  document.getElementById('pegar-sub').textContent  =
    state.clienteGaloes > 0
      ? `${state.clienteGaloes} galão(ões) em comodato`
      : 'Nenhum galão em comodato';

  const temGaloes = state.clienteGaloes > 0;
  document.getElementById('pegar-cenario-troca').style.display  = temGaloes ? 'block' : 'none';
  document.getElementById('pegar-cenario-compra').style.display = temGaloes ? 'none'  : 'block';

  goto('screen-pegar-galao');
}

function iniciarTroca() {
  state.fluxo      = 'troca';
  state.quantidade = 1;
  // Troca: primeiro seleciona quantidade, depois insere galões
  abrirSelecaoQuantidade('troca');
}

function iniciarCompra() {
  state.fluxo      = 'compra';
  state.quantidade = 1;
  abrirSelecaoQuantidade('compra');
}

function iniciarCompraAposErro() {
  // Cliente veio da troca mas galão não foi reconhecido
  // Oferece compra de galão novo sem voltar ao menu
  state.fluxo      = 'compra';
  state.quantidade = 1;
  abrirSelecaoQuantidade('compra');
}
// ══════════════════════════════════════════════════
// 12. SELEÇÃO DE QUANTIDADE
// BUG CORRIGIDO: bloco if solto fora de função removido
// BUG CORRIGIDO: confirmarQuantidade agora é uma função
// ══════════════════════════════════════════════════
// ══════════════════════════════════════════════════
// 12. SELEÇÃO DE QUANTIDADE
// ══════════════════════════════════════════════════
function abrirSelecaoQuantidade(fluxo) {
  state.quantidade  = 1;
  state.galoesLidos = 0;

  const config = {
    compra: {
      label:      'Compra',
      titulo:     'Quantos galões deseja comprar?',
      subtitulo:  'Cada galão inclui a recarga de 20 litros',
      valorLabel: 'Total a pagar',
      btnIcone:   '💳',
      btnTexto:   'Avançar para pagamento',
      maximo:     2,
      mostraInfo: false,
    },
    troca: {
      label:      'Troca',
      titulo:     'Quantos galões deseja trocar?',
      subtitulo:  'Você devolve os vazios e recebe o mesmo número cheios',
      valorLabel: 'Total da recarga',
      btnIcone:   '💳',
      btnTexto:   'Avançar para pagamento',
      maximo:     state.clienteGaloes,
      mostraInfo: true,
      infoLabel:  'Galões disponíveis para troca',
      infoValor:  state.clienteGaloes,
    },
    devolucao: {
      label:      'Devolução',
      titulo:     'Quantos galões deseja devolver?',
      subtitulo:  'Os galões serão inseridos um por um na máquina',
      valorLabel: 'Sem cobrança',
      btnIcone:   '↩️',
      btnTexto:   'Confirmar devolução',
      maximo:     state.clienteGaloes,
      mostraInfo: true,
      infoLabel:  'Galões em seu comodato',
      infoValor:  state.clienteGaloes,
    },
  };

  const c = config[fluxo];

  document.getElementById('qtd-label').textContent       = c.label;
  document.getElementById('qtd-titulo').textContent      = c.titulo;
  document.getElementById('qtd-subtitulo').textContent   = c.subtitulo;
  document.getElementById('qtd-valor-label').textContent = c.valorLabel;
  document.getElementById('qtd-btn-icon').textContent    = c.btnIcone;
  document.getElementById('qtd-btn-texto').textContent   = c.btnTexto;
  document.getElementById('qtd-numero').textContent      = '1';

  const infoRow = document.getElementById('qtd-info-row');
  if (c.mostraInfo) {
    infoRow.style.display = 'flex';
    document.getElementById('qtd-info-label').textContent = c.infoLabel;
    document.getElementById('qtd-info-valor').textContent = c.infoValor;
  } else {
    infoRow.style.display = 'none';
  }

  state._qtdMaximo = c.maximo;
  atualizarValorQuantidade();
  goto('screen-quantidade');
}

function alterarQtd(delta) {
  const nova = state.quantidade + delta;
  if (nova < 1 || nova > state._qtdMaximo) return;
  state.quantidade = nova;
  document.getElementById('qtd-numero').textContent = nova;
  atualizarValorQuantidade();
}

function atualizarValorQuantidade() {
  const total = state.fluxo === 'devolucao'
    ? 'Gratuito'
    : formatBRL(state.quantidade * state.precoUnitario);
  document.getElementById('qtd-total').textContent = total;
}
// BUG CORRIGIDO: era um bloco solto, agora é uma função
function confirmarQuantidade() {
  if (state.fluxo === 'troca') {
    // Troca: após escolher quantidade vai para inserir galões
    document.getElementById('rfid-titulo').textContent = 
      `Insira ${state.quantidade} galão(ões) vazio(s)`;
    document.getElementById('rfid-msg').textContent =
      `Coloque ${state.quantidade === 1 ? 'o galão vazio' : 'os galões vazios'} na entrada indicada.\nO sistema identificará automaticamente pelo RFID.`;
    goto('screen-rfid-inserir');

  } else if (state.fluxo === 'compra') {
    const caucao       = state.clienteGaloes === 0 ? 10 : 0;
    const totalRecarga = state.quantidade * state.precoUnitario;
    const total        = totalRecarga + caucao;

    document.getElementById('resumo-label').textContent     = 'Resumo da compra';
    document.getElementById('resumo-quantidade').textContent = state.quantidade + ' galão(ões)';
    document.getElementById('resumo-recarga').textContent   = 'R$ ' + formatBRL(totalRecarga);
    document.getElementById('resumo-total').textContent     = formatBRL(total);
    document.getElementById('pgto-total').textContent       = formatBRL(total);
    document.getElementById('resumo-row-caucao').style.display =
      state.clienteGaloes === 0 ? 'flex' : 'none';

    goto('screen-resumo-compra');

  } else if (state.fluxo === 'devolucao') {
    document.getElementById('rfid-titulo').textContent = 'Insira o Galão Vazio';
    document.getElementById('rfid-msg').textContent =
      `Insira ${state.quantidade} galão(ões) vazio(s) na entrada indicada.\nO sistema identificará automaticamente pelo RFID.`;
    goto('screen-rfid-inserir');
  }
}

// ══════════════════════════════════════════════════
// 13. CADASTRO
// ══════════════════════════════════════════════════
function concluirCadastro() {
  if (!state.cpf || !state.nome || !state.email || !state.telefone) {
    showToast('⚠️ Dados incompletos — volte e preencha tudo');
    return;
  }

  // TODO: POST /api/v1/clientes com { cpf, nome, email, telefone }
  state.clienteCPF    = state.cpf;
  state.clienteNome   = state.nome;
  state.clienteGaloes = 0;

  showToast('🎉 Cadastro realizado! Bem-vindo, ' + state.nome + '!');
  renderizarMenuCliente();
  goto('screen-menu-cliente');
}


// ══════════════════════════════════════════════════
// 14. PAGAMENTO
// BUG CORRIGIDO: processarPagamento ia para screen-pgto-recusado
// agora vai corretamente para screen-aguardando-pagamento
// ══════════════════════════════════════════════════
function processarPagamento(metodo) {
  const mensagens = {
    'PIX':     'Escaneie o QR Code que aparecerá na maquininha',
    'Débito':  'Aproxime ou insira o cartão de débito na maquininha',
    'Crédito': 'Aproxime ou insira o cartão de crédito na maquininha',
  };

  document.getElementById('metodo-pagamento-msg').textContent =
    mensagens[metodo] || 'Realize o pagamento na maquininha';

  // TODO: POST /api/v1/pagamentos com { valor, metodo, fluxo }
  goto('screen-aguardando-pagamento');
  startPaymentTimer();
}

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
      showToast('⏱️ Tempo esgotado');
      goto('screen-pgto-recusado');
      return;
    }

    // DEMO: aprova automaticamente em 3s — remover em produção
    if (secs === 57) {
      clearInterval(state.timer);
      state.timer = null;
      showToast('✅ Pagamento aprovado!');
      pagamentoAprovado();
    }
  }, 1000);
}

function pagamentoAprovado() {
  if (state.fluxo === 'compra') {
    abrirPorta();
  } else if (state.fluxo === 'troca') {
    document.getElementById('rfid-titulo').textContent = 'Insira o Galão Vazio';
    document.getElementById('rfid-msg').textContent =
      `Insira ${state.quantidade} galão(ões) vazio(s) na entrada indicada.\nO sistema identificará pelo RFID.`;
    goto('screen-rfid-inserir');
  }
}


// ══════════════════════════════════════════════════
// 15. RFID
// BUG CORRIGIDO: tentava acessar rfid-ok-tag que não existe no HTML
// ══════════════════════════════════════════════════
function simularLeituraRFID() {
  showToast('📡 Lendo tag RFID...');

  setTimeout(() => {
    const sucesso = Math.random() > 0.2;

    if (!sucesso) {
      document.getElementById('rfid-erro-opcao-compra').style.display =
        state.fluxo === 'troca' ? 'block' : 'none';
      goto('screen-rfid-erro');
      return;
    }

    // Incrementa contador de galões lidos
    state.galoesLidos++;

    const faltam = state.quantidade - state.galoesLidos;

    if (faltam > 0) {
      // Ainda tem galões para inserir
      showToast(`✅ Galão ${state.galoesLidos} reconhecido! Faltam ${faltam}.`);
      document.getElementById('rfid-titulo').textContent =
        `Insira o galão ${state.galoesLidos + 1} de ${state.quantidade}`;
      document.getElementById('rfid-msg').textContent =
        `${state.galoesLidos} de ${state.quantidade} galões reconhecidos.\nInsira o próximo galão.`;
      // Fica na mesma tela aguardando o próximo
      return;
    }

    // Todos os galões foram lidos
    if (state.fluxo === 'troca') {
      document.getElementById('rfid-ok-titulo').textContent    = `${state.quantidade} Galão(ões) Reconhecido(s)!`;
      document.getElementById('rfid-ok-row-valor').style.display = 'flex';
      document.getElementById('rfid-ok-valor').textContent     = state.quantidade + ' galão(ões) válido(s)';
      document.getElementById('rfid-ok-btn-texto').textContent = 'Confirmar e pagar';

    } else if (state.fluxo === 'devolucao') {
      document.getElementById('rfid-ok-titulo').textContent    = `${state.quantidade} Galão(ões) Devolvido(s)!`;
      document.getElementById('rfid-ok-row-valor').style.display = 'flex';
      document.getElementById('rfid-ok-valor').textContent     = state.quantidade + ' galão(ões)';
      document.getElementById('rfid-ok-btn-texto').textContent = 'Concluir devolução';
    }

    goto('screen-rfid-ok');
  }, 2000);
}

function confirmarRFID() {
  if (state.fluxo === 'troca') {
    // Após RFID confirmado vai direto para pagamento
    const total = state.quantidade * state.precoUnitario;
    document.getElementById('pgto-total').textContent     = formatBRL(total);
    document.getElementById('resumo-label').textContent   = 'Resumo da troca';
    document.getElementById('resumo-quantidade').textContent = state.quantidade + ' galão(ões)';
    document.getElementById('resumo-recarga').textContent = 'R$ ' + formatBRL(total);
    document.getElementById('resumo-total').textContent   = formatBRL(total);
    document.getElementById('resumo-row-caucao').style.display = 'none';
    goto('screen-resumo-compra');

  } else if (state.fluxo === 'devolucao') {
    state.clienteGaloes -= state.quantidade;
    document.getElementById('concluida-msg').textContent =
      `${state.quantidade} galão(ões) devolvido(s) com sucesso.\nObrigado por usar Água Fácil! 💧`;
    encerrarComSucesso();
  }
}


// ══════════════════════════════════════════════════
// 16. PORTA
// BUG CORRIGIDO: chave } sobrando dentro do while causava erro de sintaxe
// ══════════════════════════════════════════════════
function abrirPorta() {
  const porta1 = Math.floor(Math.random() * 9) + 1;
  let porta2   = Math.floor(Math.random() * 9) + 1;

  while (porta2 === porta1) {
    porta2 = Math.floor(Math.random() * 9) + 1;
  }

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
      document.getElementById('concluida-msg').textContent =
        'Sua transação foi concluída com sucesso.\nObrigado por usar Água Fácil! 💧';
      encerrarComSucesso();
    }
  }, 1000);
}

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

  const lista = document.getElementById('historico-lista');
  const transacoes = [
    { data: '09/03/2026', desc: 'Troca de galão',    valor: 'R$ 15,00' },
    { data: '24/02/2026', desc: 'Troca de galão',    valor: 'R$ 15,00' },
    { data: '08/02/2026', desc: 'Cadastro + caução', valor: 'R$ 25,00' },
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

function encerrarSessao() {
  if (state.timer)       { clearInterval(state.timer);      state.timer = null; }
  if (state.timerSessao) { clearTimeout(state.timerSessao); state.timerSessao = null; }

  state.clienteNome   = '';
  state.clienteCPF    = '';
  state.clienteGaloes = 0;
  state.cpf           = '';
  state.nome          = '';
  state.email         = '';
  state.telefone      = '';
  state.fluxo         = '';
  state.quantidade    = 1;

  goto('screen-idle');
  showToast('👋 Até logo!');
}