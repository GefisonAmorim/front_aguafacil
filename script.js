/* ══════════════════════════════════════════════════
   app.js — Lógica completa da Vending Machine
   Estrutura:
     1. Estado global
     2. Navegação
     3. Relógio
     4. Toast
     5. Partículas
     6. Formatadores
     7. Teclado numérico (numpad)
     8. Teclado alfabético
     9. Inicialização dos teclados
    10. Fluxos de negócio
══════════════════════════════════════════════════ */

// ══════════════════════════════════════════════════
// 1. ESTADO GLOBAL
// ══════════════════════════════════════════════════
const state = {
  cpf:          '',     // CPF digitado no cadastro
  nome:         '',     // Nome digitado no cadastro
  telefone:     '',     // Telefone digitado no cadastro
  clienteNome:  'Gefison',   // Nome do cliente logado
  clienteCPF:   '070.572.413-13', // CPF do cliente logado
  fluxoOrigem:  'menu', // 'menu' ou 'novo' — controla o botão Voltar do pagamento
  timer:        null    // Referência do setInterval ativo
};


// ══════════════════════════════════════════════════
// 2. NAVEGAÇÃO ENTRE TELAS
// ══════════════════════════════════════════════════

/**
 * Navega para a tela indicada pelo id.
 * Cancela qualquer timer ativo antes de trocar de tela.
 * @param {string} id - ID da div.screen de destino
 */
function goto(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
}

/**
 * Botão "Voltar" da tela de pagamento.
 * Se veio do cadastro novo → volta para tela de resumo do cadastro.
 * Se veio do menu do cliente → volta para o menu.
 */
function voltarDoMenu() {
  goto(state.fluxoOrigem === 'novo' ? 'screen-cad-ok' : 'screen-menu-cliente');
}


// ══════════════════════════════════════════════════
// 3. RELÓGIO NO HEADER
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
// 4. TOAST — NOTIFICAÇÕES TEMPORÁRIAS
// ══════════════════════════════════════════════════

/**
 * Exibe uma mensagem flutuante temporária.
 * @param {string} msg  - Texto da mensagem
 * @param {number} dur  - Duração em ms (padrão 2500)
 */
function showToast(msg, dur = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), dur);
}


// ══════════════════════════════════════════════════
// 5. PARTÍCULAS DE FUNDO
// ══════════════════════════════════════════════════
(function criarParticulas() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 18; i++) {
    const p    = document.createElement('div');
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
// 6. FORMATADORES
// ══════════════════════════════════════════════════

/**
 * Formata string numérica como CPF: 000.000.000-00
 * @param {string} v - Apenas dígitos
 */
function formatCPF(v) {
  if (v.length <= 3) return v;
  if (v.length <= 6) return v.slice(0, 3) + '.' + v.slice(3);
  if (v.length <= 9) return v.slice(0, 3) + '.' + v.slice(3, 6) + '.' + v.slice(6);
  return v.slice(0, 3) + '.' + v.slice(3, 6) + '.' + v.slice(6, 9) + '-' + v.slice(9);
}

/**
 * Formata string numérica como telefone: (00) 00000-0000
 * @param {string} v - Apenas dígitos
 */
function formatTEL(v) {
  if (v.length <= 2) return '(' + v;
  if (v.length <= 7) return '(' + v.slice(0, 2) + ') ' + v.slice(2);
  return '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
}


// ══════════════════════════════════════════════════
// 7. FÁBRICA DE TECLADO NUMÉRICO
// ══════════════════════════════════════════════════

/**
 * Cria um numpad interativo dentro de um container.
 *
 * @param {string}   containerId - ID do elemento que receberá as teclas
 * @param {string}   displayId   - ID do elemento que mostra o valor digitado
 * @param {number}   maxLen      - Número máximo de dígitos
 * @param {Function} onComplete  - Callback chamado ao atingir maxLen caracteres
 * @param {Function} [formatFn]  - Função opcional de formatação para o display
 * @returns {{ getValue: Function, reset: Function }}
 */
function buildNumpad(containerId, displayId, maxLen, onComplete, formatFn) {
  const container = document.getElementById(containerId);
  const display   = document.getElementById(displayId);
  let value = '';

  // Atualiza o display com o valor atual
  function updateDisplay() {
    if (value) {
      const formatted = formatFn ? formatFn(value) : value;
      display.innerHTML = `<span>${formatted}</span><span class="cursor"></span>`;
    } else {
      // Preserva o placeholder original se display tiver data-placeholder
      const ph = display.dataset.placeholder || '___ ___ ___ __';
      display.innerHTML = `<span class="placeholder">${ph}</span>`;
    }
  }

  // Pressiona uma tecla numérica
  function press(digit) {
    if (value.length >= maxLen) return;
    value += digit;
    updateDisplay();
    if (value.length === maxLen) {
      setTimeout(() => onComplete(value), 200);
    }
  }

  // Apaga o último dígito
  function del() {
    value = value.slice(0, -1);
    updateDisplay();
  }

  // Constrói as teclas 1–9
  container.innerHTML = '';
  ['1','2','3','4','5','6','7','8','9'].forEach(k => {
    const btn = document.createElement('div');
    btn.className   = 'numpad-key';
    btn.textContent = k;
    btn.addEventListener('click', () => press(k));
    container.appendChild(btn);
  });

  // Tecla DEL (posição 10 — coluna 1, linha 4)
  const delBtn = document.createElement('div');
  delBtn.className   = 'numpad-key del';
  delBtn.innerHTML   = '⌫';
  delBtn.addEventListener('click', del);
  container.appendChild(delBtn);

  // Tecla 0 (posição 11 — coluna 2, linha 4 — via CSS .zero)
  const zeroBtn = document.createElement('div');
  zeroBtn.className   = 'numpad-key zero';
  zeroBtn.textContent = '0';
  zeroBtn.addEventListener('click', () => press('0'));
  container.appendChild(zeroBtn);

  // Estado inicial
  value = '';
  updateDisplay();

  return {
    getValue: () => value,
    reset:    () => { value = ''; updateDisplay(); }
  };
}


// ══════════════════════════════════════════════════
// 8. FÁBRICA DE TECLADO ALFABÉTICO
// ══════════════════════════════════════════════════

/**
 * Cria um teclado QWERTY touch-friendly para digitação de nomes.
 *
 * @param {string}   containerId - ID do container das teclas
 * @param {string}   displayId   - ID do display de texto
 * @param {Function} onConfirm   - Callback chamado ao pressionar OK com nome válido
 */
function buildKeyboard(containerId, displayId, onConfirm) {
  const container = document.getElementById(containerId);
  const display   = document.getElementById(displayId);
  let value = '';

  const linhas = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['Z','X','C','V','B','N','M']
  ];

  // Atualiza o display de texto
  function updateDisplay() {
    if (value) {
      display.innerHTML = `<span>${value}</span><span class="cursor"></span>`;
    } else {
      display.innerHTML = `<span class="ph">Seu nome completo...</span>`;
    }
  }

  // Constrói as linhas de teclas
  container.innerHTML = '';
  linhas.forEach(linha => {
    const row = document.createElement('div');
    row.className = 'keyboard-row';
    linha.forEach(char => {
      const k = document.createElement('div');
      k.className   = 'key';
      k.textContent = char;
      k.addEventListener('click', () => {
        value += char;
        updateDisplay();
      });
      row.appendChild(k);
    });
    container.appendChild(row);
  });

  // Linha final: Espaço + Backspace + OK
  const lastRow = document.createElement('div');
  lastRow.className = 'keyboard-row';

  const spaceKey = document.createElement('div');
  spaceKey.className   = 'key space';
  spaceKey.textContent = 'ESPAÇO';
  spaceKey.addEventListener('click', () => {
    if (value.length > 0 && value.slice(-1) !== ' ') {
      value += ' ';
      updateDisplay();
    }
  });

  const backKey = document.createElement('div');
  backKey.className = 'key back';
  backKey.textContent = '⌫';
  backKey.addEventListener('click', () => {
    value = value.slice(0, -1);
    updateDisplay();
  });

  const okKey = document.createElement('div');
  okKey.className   = 'key confirm';
  okKey.textContent = '✔ OK';
  okKey.addEventListener('click', () => {
    if (value.trim().length < 3) {
      showToast('⚠️ Nome muito curto — mínimo 3 letras');
      return;
    }
    state.nome = value.trim();
    onConfirm(state.nome);
  });

  lastRow.appendChild(spaceKey);
  lastRow.appendChild(backKey);
  lastRow.appendChild(okKey);
  container.appendChild(lastRow);

  updateDisplay();
}


// ══════════════════════════════════════════════════
// 9. INICIALIZAÇÃO DOS TECLADOS
// ══════════════════════════════════════════════════

// ── CPF: Cliente existente ──────────────────────
buildNumpad(
  'numpad-cpf-existente',
  'cpf-existente-display',
  11,
  function onCPFExistente(cpf) {
    state.cpf = cpf;

    // TODO: substituir por chamada real à API
    // Aqui: CPF "12345678980" simula "não encontrado"
    if (cpf === '12345678980') {
      showToast('⚠️ CPF não encontrado. Faça seu cadastro.');
      goto('screen-cad-cpf');
    } else {
      showToast('✅ Cliente identificado!');
      document.getElementById('cliente-nome-display').textContent = state.clienteNome;
      document.getElementById('cliente-sub-display').textContent =
        'CPF: •••.•••.•••-80  |  1 galão em comodato';
      document.getElementById('saldo-nome').textContent = state.clienteNome;
      goto('screen-menu-cliente');
    }
  },
  formatCPF
);

// ── CPF: Novo cadastro ──────────────────────────
buildNumpad(
  'numpad-cpf-cad',
  'cpf-cad-display',
  11,
  function onCPFNovo(cpf) {
    // TODO: verificar CPF na API antes de avançar
    // Aqui: CPF "11111111111" simula "já cadastrado"
    if (cpf === '11111111111') {
      showToast('❌ CPF já cadastrado — selecione "Já sou cliente"');
      return; // não avança
    }
    state.cpf = cpf;
    goto('screen-cad-nome');
  },
  formatCPF
);

// ── Telefone ────────────────────────────────────
buildNumpad(
  'numpad-tel',
  'tel-display',
  11,
  function onTelefone(tel) {
    state.telefone = tel;
    setTimeout(() => goto('screen-cad-termo'), 300);
  },
  formatTEL
);

// ── Teclado alfabético (nome) ───────────────────
buildKeyboard(
  'keyboard-nome',
  'nome-display',
  function onNome(nome) {
    showToast('✅ Nome salvo: ' + nome);
    goto('screen-cad-tel');
  }
);


// ══════════════════════════════════════════════════
// 10. FLUXOS DE NEGÓCIO
// ══════════════════════════════════════════════════

// ── CADASTRO ────────────────────────────────────

/**
 * Conclui o cadastro após aceite do termo de comodato.
 * Valida se todos os dados foram preenchidos antes de avançar.
 */
function concluirCadastro() {
  if (!state.cpf || !state.nome || !state.telefone) {
    showToast('⚠️ Preencha todos os dados primeiro');
    return;
  }
  // Atualiza estado global com dados do novo cliente
  state.clienteNome = state.nome;
  state.fluxoOrigem = 'novo';

  // TODO: chamar POST /api/v1/clientes com { cpf, nome, telefone }

  showToast('🎉 Cadastro realizado com sucesso!');
  goto('screen-cad-ok');
}


// ── PAGAMENTO ───────────────────────────────────

/**
 * Inicia o fluxo de pagamento com o método escolhido.
 * @param {string} metodo - 'PIX' | 'Cartão' | 'Dinheiro'
 */
function processarPagamento(metodo) {
  const mensagens = {
    'PIX':      'Escaneie o QR Code na maquininha',
    'Cartão':   'Aproxime ou insira o cartão na maquininha',
    'Dinheiro': 'Insira o dinheiro no caixa ao lado'
  };

  document.getElementById('metodo-pagamento-msg').textContent =
    mensagens[metodo] || 'Realize o pagamento';

  // TODO: chamar API de pagamento e aguardar webhook de confirmação
  goto('screen-aguardando-pagamento');
  startPaymentTimer();
}

/**
 * Timer de espera pelo pagamento (60 segundos).
 * Na demo, aprova automaticamente em 3 segundos para facilitar testes.
 * Em produção: substituir pelo webhook de confirmação da maquininha.
 */
function startPaymentTimer() {
  let secs = 60;
  const fill  = document.getElementById('timer-fill');
  const count = document.getElementById('timer-count');

  state.timer = setInterval(() => {
    secs--;
    fill.style.width  = (secs / 60 * 100) + '%';
    count.textContent = secs + 's';

    if (secs <= 0) {
      clearInterval(state.timer);
      showToast('⏱️ Tempo esgotado — tente novamente');
      goto('screen-compra-pagamento');
      return;
    }

    // DEMO: aprova em 3 segundos (remover em produção)
    if (secs === 57) {
      clearInterval(state.timer);
      showToast('✅ Pagamento aprovado!');
      goto('screen-retirar-galao');
      startPortaTimer();
    }
  }, 1000);
}


// ── PORTA ───────────────────────────────────────

/**
 * Timer de abertura de porta (30 segundos).
 * Após encerrar, vai para tela de conclusão.
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
      encerrarComSucesso();
    }
  }, 1000);
}


// ── RFID ────────────────────────────────────────

/**
 * Simula uma leitura de tag RFID.
 * Em produção: substituir pela escuta do evento MQTT
 * publicado pelo ESP32 no tópico vm/{id}/evt/rfid/leitura
 *
 * @param {string} tipo - 'troca' | 'devolucao'
 */
function simularLeituraRFID(tipo) {
  showToast('📡 Lendo tag RFID...');

  // Simula latência de leitura
  setTimeout(() => {
    // 80% de chance de sucesso na demo
    const sucesso = Math.random() > 0.2;

    if (sucesso) {
      if (tipo === 'troca') {
        goto('screen-troca-reconhecido');
      } else {
        goto('screen-devolucao-ok');
      }
    } else {
      // Configura a tela de erro com o contexto correto
      document.getElementById('rfid-erro-titulo').textContent = 'Galão Não Reconhecido';
      document.getElementById('rfid-erro-msg').textContent =
        'Não foi possível identificar este galão.\nVerifique se o galão é do Água fácil e tente novamente.';
      document.getElementById('rfid-erro-btn-retry').onclick =
        () => goto(tipo === 'troca' ? 'screen-troca-inserir' : 'screen-devolucao-inserir');
      goto('screen-rfid-erro');
    }
  }, 2000);
}


// ── CONCLUSÃO E ENCERRAMENTO ────────────────────

/**
 * Vai para a tela de conclusão e inicia contagem regressiva
 * para retornar automaticamente à tela inicial.
 */
function encerrarComSucesso() {
  document.getElementById('concluida-msg').textContent =
    'Sua transação foi concluída com sucesso.\nObrigado por usar Água Fácil! 💧';

  goto('screen-concluida');

  let secs = 10;
  const fill  = document.getElementById('concluida-timer');
  const count = document.getElementById('concluida-count');

  state.timer = setInterval(() => {
    secs--;
    fill.style.width  = (secs / 10 * 100) + '%';
    count.textContent = secs;

    if (secs <= 0) {
      clearInterval(state.timer);
      encerrarSessao();
    }
  }, 1000);
}

/**
 * Encerra a sessão do cliente:
 * - Cancela timers ativos
 * - Limpa dados do estado
 * - Volta para a tela inicial
 */
function encerrarSessao() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
  // Limpa dados da sessão atual
  state.cpf      = '';
  state.nome     = '';
  state.telefone = '';

  goto('screen-inicio');
  showToast('👋 Até logo!');
}