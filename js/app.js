/**
 * Sistema de Viação Universitária — protótipo de demonstração.
 *
 * ATENÇÃO: tudo aqui roda em memória (sem backend/banco de dados). Recarregar
 * a página reseta os dados pro estado inicial de data/mock.js. Serve só pra
 * mostrar o fluxo pro cliente antes de fechar — depois entra o backend de verdade.
 */

import {
  ALUNOS,
  ONIBUS,
  PONTOS,
  MENSALIDADES,
  PAGAMENTOS,
  getPontoById,
  getOnibusById,
  getAlunoById,
  getMensalidadesByAluno,
} from '../data/mock.js';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio'];

const ADMINS = [
  { id: 1, nome: 'Edimar David', email: 'edimar@viacaoabadia.com.br', cargo: 'Gestor', status: 'ativo' },
  { id: 2, nome: 'Eli Santos', email: 'eli@viacaoabadia.com.br', cargo: 'Atendimento', status: 'ativo' },
];

const NAV = {
  admin: [
    { id: 'dashboard', label: 'Visão geral', icon: '📊' },
    { id: 'alunos', label: 'Alunos', icon: '🎓' },
    { id: 'onibus', label: 'Ônibus', icon: '🚌' },
    { id: 'pontos', label: 'Pontos de ônibus', icon: '📍' },
    { id: 'mensalidades', label: 'Mensalidades', icon: '💰' },
    { id: 'relatorios', label: 'Relatórios', icon: '📈' },
    { id: 'usuarios', label: 'Usuários', icon: '👤' },
  ],
  aluno: [
    { id: 'meus-dados', label: 'Meus dados', icon: '🪪' },
    { id: 'mensalidades-aluno', label: 'Mensalidades', icon: '💰' },
    { id: 'transporte', label: 'Meu transporte', icon: '🚌' },
  ],
  financeiro: [
    { id: 'mensalidades-fin', label: 'Mensalidades', icon: '💰' },
    { id: 'inadimplentes', label: 'Inadimplentes', icon: '⚠️' },
    { id: 'relatorios-fin', label: 'Relatórios', icon: '📈' },
  ],
};

const ROLE_LABELS = {
  admin: 'Administrador',
  aluno: 'Aluno',
  financeiro: 'Financeiro',
};

const state = {
  role: null,
  alunoId: null,
  view: null,
};

const els = {
  screenLogin: document.getElementById('screenLogin'),
  alunoPicker: document.getElementById('alunoPicker'),
  alunoSelect: document.getElementById('alunoSelect'),
  alunoEntrarBtn: document.getElementById('alunoEntrarBtn'),
  app: document.getElementById('app'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebarOverlay'),
  sidebarNav: document.getElementById('sidebarNav'),
  sidebarRoleName: document.getElementById('sidebarRoleName'),
  menuToggle: document.getElementById('menuToggle'),
  pageTitle: document.getElementById('pageTitle'),
  topbarUserName: document.getElementById('topbarUserName'),
  topbarRolePill: document.getElementById('topbarRolePill'),
  content: document.getElementById('content'),
  logoutBtn: document.getElementById('logoutBtn'),
  modalOverlay: document.getElementById('modalOverlay'),
  modal: document.getElementById('modal'),
  toast: document.getElementById('toast'),
};

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function statusPill(status) {
  return `<span class="status-pill" data-status="${status}">${status}</span>`;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('is-visible');
  clearTimeout(els.toast._t);
  els.toast._t = setTimeout(() => els.toast.classList.remove('is-visible'), 2200);
}

function nextId(list) {
  return list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function waLink(contato, mensagem) {
  const digits = contato.replace(/\D/g, '');
  return `https://wa.me/55${digits}?text=${encodeURIComponent(mensagem)}`;
}

/* =========================================================
   MODAL GENÉRICO
   ========================================================= */

function openModal({ title, subtitle = '', fieldsHtml, submitLabel = 'Salvar', onSubmit }) {
  els.modal.innerHTML = `
    <form id="modalForm">
      <div class="modal-header">
        <div>
          <h3>${title}</h3>
          ${subtitle ? `<p>${subtitle}</p>` : ''}
        </div>
        <button type="button" class="btn-icon" id="modalCloseBtn" aria-label="Fechar">✕</button>
      </div>
      <div class="field-grid">${fieldsHtml}</div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" id="modalCancelBtn">Cancelar</button>
        <button type="submit" class="btn btn-primary">${submitLabel}</button>
      </div>
    </form>
  `;

  els.modalOverlay.hidden = false;

  const close = () => {
    els.modalOverlay.hidden = true;
    els.modal.innerHTML = '';
  };

  els.modal.querySelector('#modalCloseBtn').addEventListener('click', close);
  els.modal.querySelector('#modalCancelBtn').addEventListener('click', close);
  els.modalOverlay.addEventListener('click', (e) => {
    if (e.target === els.modalOverlay) close();
  }, { once: true });

  els.modal.querySelector('#modalForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    onSubmit(data);
    close();
  });
}

function field(label, inputHtml) {
  return `<div class="field">${label ? `<label>${label}</label>` : ''}${inputHtml}</div>`;
}

/* =========================================================
   LOGIN / TROCA DE PERFIL
   ========================================================= */

function populateAlunoSelect() {
  els.alunoSelect.innerHTML = ALUNOS
    .map((a) => `<option value="${a.id}">${a.nome} — ${a.curso}</option>`)
    .join('');
}

function enterApp(role, alunoId = null) {
  state.role = role;
  state.alunoId = alunoId;
  state.view = NAV[role][0].id;

  els.screenLogin.hidden = true;
  els.app.hidden = false;

  els.sidebarRoleName.textContent = ROLE_LABELS[role];
  els.topbarRolePill.textContent = ROLE_LABELS[role];
  els.topbarRolePill.dataset.role = role;

  if (role === 'aluno') {
    const aluno = getAlunoById(alunoId);
    els.topbarUserName.textContent = aluno.nome;
  } else {
    els.topbarUserName.textContent = role === 'admin' ? 'Administrador' : 'Setor Financeiro';
  }

  renderSidebar();
  navigate(state.view);
}

function logout() {
  state.role = null;
  state.alunoId = null;
  state.view = null;

  els.app.hidden = true;
  els.screenLogin.hidden = false;
  els.sidebar.classList.remove('is-open');
  els.sidebarOverlay.hidden = true;
}

document.querySelectorAll('.role-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const role = btn.dataset.role;
    if (role === 'aluno') {
      populateAlunoSelect();
      els.alunoPicker.hidden = false;
      els.alunoPicker.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    enterApp(role);
  });
});

els.alunoEntrarBtn.addEventListener('click', () => {
  enterApp('aluno', Number(els.alunoSelect.value));
});

els.logoutBtn.addEventListener('click', logout);

/* =========================================================
   SIDEBAR / NAVEGAÇÃO
   ========================================================= */

function renderSidebar() {
  els.sidebarNav.innerHTML = NAV[state.role]
    .map(
      (item) => `
      <button type="button" class="sidebar-nav-btn" data-view="${item.id}">
        <span class="sidebar-nav-icon" aria-hidden="true">${item.icon}</span>
        <span>${item.label}</span>
      </button>
    `
    )
    .join('');

  els.sidebarNav.querySelectorAll('.sidebar-nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      navigate(btn.dataset.view);
      if (window.innerWidth < 720) closeSidebar();
    });
  });
}

function navigate(viewId) {
  state.view = viewId;

  els.sidebarNav.querySelectorAll('.sidebar-nav-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.view === viewId);
  });

  const navItem = NAV[state.role].find((i) => i.id === viewId);
  els.pageTitle.textContent = navItem ? navItem.label : '';

  const renderer = VIEWS[viewId];
  els.content.innerHTML = renderer ? renderer() : '<p>Em construção.</p>';
  wireUpView(viewId);
}

function openSidebar() {
  els.sidebar.classList.add('is-open');
  els.sidebarOverlay.hidden = false;
}

function closeSidebar() {
  els.sidebar.classList.remove('is-open');
  els.sidebarOverlay.hidden = true;
}

els.menuToggle.addEventListener('click', openSidebar);
els.sidebarOverlay.addEventListener('click', closeSidebar);

/* =========================================================
   VIEWS — ADMINISTRADOR
   ========================================================= */

function viewAdminDashboard() {
  const pendentes = MENSALIDADES.filter((m) => m.status === 'Pendente').length;
  const atrasadas = MENSALIDADES.filter((m) => m.status === 'Atrasado').length;
  const onibusAtivos = ONIBUS.filter((o) => o.status === 'ativo').length;
  const atrasadosDetalhe = MENSALIDADES.filter((m) => m.status === 'Atrasado').slice(0, 5);

  return `
    <div class="proto-badge">⚠️ Protótipo de demonstração — dados fictícios, sem persistência real.</div>

    <div class="stat-grid">
      <div class="stat-card" data-tone="admin">
        <div class="stat-card-label">Alunos cadastrados</div>
        <div class="stat-card-value">${ALUNOS.length}</div>
        <div class="stat-card-hint">ativos no sistema</div>
      </div>
      <div class="stat-card" data-tone="admin">
        <div class="stat-card-label">Ônibus ativos</div>
        <div class="stat-card-value">${onibusAtivos}/${ONIBUS.length}</div>
        <div class="stat-card-hint">em operação</div>
      </div>
      <div class="stat-card" data-tone="financeiro">
        <div class="stat-card-label">Mensalidades pendentes</div>
        <div class="stat-card-value">${pendentes}</div>
        <div class="stat-card-hint">aguardando pagamento</div>
      </div>
      <div class="stat-card" data-tone="danger">
        <div class="stat-card-label">Mensalidades atrasadas</div>
        <div class="stat-card-value">${atrasadas}</div>
        <div class="stat-card-hint">precisam de cobrança</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div>
          <h2>Atrasos recentes</h2>
          <p>Mensalidades com status "Atrasado" que precisam de atenção</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Aluno</th><th>Mês</th><th>Valor</th><th>Status</th></tr></thead>
          <tbody>
            ${
              atrasadosDetalhe.length
                ? atrasadosDetalhe
                    .map(
                      (m) => `
                  <tr>
                    <td>${getAlunoById(m.alunoId).nome}</td>
                    <td>${m.mes}</td>
                    <td>${formatCurrency(m.valor)}</td>
                    <td>${statusPill(m.status)}</td>
                  </tr>
                `
                    )
                    .join('')
                : `<tr><td colspan="4" class="table-empty">Nenhum atraso no momento 🎉</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function viewAlunos() {
  return `
    <div class="panel">
      <div class="panel-header">
        <div>
          <h2>Alunos</h2>
          <p>${ALUNOS.length} aluno(s) cadastrado(s)</p>
        </div>
        <div class="panel-actions">
          <button type="button" class="btn btn-admin" id="novoAlunoBtn">+ Novo aluno</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Matrícula</th><th>Nome</th><th>Curso</th><th>Período</th><th>Ponto</th><th>Ônibus</th><th></th></tr>
          </thead>
          <tbody id="alunosTbody">
            ${ALUNOS.map(rowAluno).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function rowAluno(a) {
  const ponto = getPontoById(a.pontoId);
  const onibus = getOnibusById(a.onibusId);
  return `
    <tr data-id="${a.id}">
      <td>${a.matricula}</td>
      <td>${a.nome}</td>
      <td>${a.curso}</td>
      <td>${a.periodo}</td>
      <td>${ponto ? ponto.nome : '—'}</td>
      <td>${onibus ? `Nº ${onibus.numero}` : '—'}</td>
      <td class="actions-cell">
        <button type="button" class="btn-icon" data-action="editar-aluno" aria-label="Editar">✏️</button>
        <button type="button" class="btn-icon danger" data-action="excluir-aluno" aria-label="Excluir">🗑️</button>
      </td>
    </tr>
  `;
}

function alunoFormFields(a = {}) {
  return (
    field('Nome completo', `<input name="nome" required value="${a.nome || ''}" />`) +
    field('Matrícula', `<input name="matricula" required value="${a.matricula || ''}" />`) +
    field('CPF', `<input name="cpf" required value="${a.cpf || ''}" />`) +
    field('Contato (WhatsApp)', `<input name="contato" required placeholder="(34) 99999-0000" value="${a.contato || ''}" />`) +
    field('Curso', `<input name="curso" required value="${a.curso || ''}" />`) +
    field(
      'Período',
      `<select name="periodo" required>
        ${['Matutino', 'Vespertino', 'Noturno']
          .map((p) => `<option ${a.periodo === p ? 'selected' : ''}>${p}</option>`)
          .join('')}
      </select>`
    ) +
    field(
      'Ponto de ônibus',
      `<select name="pontoId" required>
        ${PONTOS.map((p) => `<option value="${p.id}" ${a.pontoId === p.id ? 'selected' : ''}>${p.nome}</option>`).join('')}
      </select>`
    ) +
    field(
      'Ônibus',
      `<select name="onibusId" required>
        ${ONIBUS.map((o) => `<option value="${o.id}" ${a.onibusId === o.id ? 'selected' : ''}>Nº ${o.numero} — ${o.placa}</option>`).join('')}
      </select>`
    )
  );
}

function wireAlunosView() {
  document.getElementById('novoAlunoBtn').addEventListener('click', () => {
    openModal({
      title: 'Novo aluno',
      subtitle: 'Cadastro de demonstração — não é salvo de verdade.',
      fieldsHtml: alunoFormFields(),
      onSubmit: (data) => {
        ALUNOS.push({
          id: nextId(ALUNOS),
          nome: data.nome,
          matricula: data.matricula,
          cpf: data.cpf,
          contato: data.contato,
          curso: data.curso,
          periodo: data.periodo,
          pontoId: Number(data.pontoId),
          onibusId: Number(data.onibusId),
        });
        showToast('Aluno cadastrado (demonstração).');
        navigate('alunos');
      },
    });
  });

  document.querySelectorAll('[data-action="editar-aluno"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.closest('tr').dataset.id);
      const aluno = getAlunoById(id);
      openModal({
        title: 'Editar aluno',
        fieldsHtml: alunoFormFields(aluno),
        onSubmit: (data) => {
          Object.assign(aluno, {
            nome: data.nome,
            matricula: data.matricula,
            cpf: data.cpf,
            contato: data.contato,
            curso: data.curso,
            periodo: data.periodo,
            pontoId: Number(data.pontoId),
            onibusId: Number(data.onibusId),
          });
          showToast('Aluno atualizado (demonstração).');
          navigate('alunos');
        },
      });
    });
  });

  document.querySelectorAll('[data-action="excluir-aluno"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.closest('tr').dataset.id);
      if (!confirm('Remover este aluno da demonstração?')) return;
      const idx = ALUNOS.findIndex((a) => a.id === id);
      if (idx > -1) ALUNOS.splice(idx, 1);
      showToast('Aluno removido (demonstração).');
      navigate('alunos');
    });
  });
}

function viewOnibus() {
  return `
    <div class="panel">
      <div class="panel-header">
        <div>
          <h2>Ônibus</h2>
          <p>${ONIBUS.length} veículo(s) na frota</p>
        </div>
        <div class="panel-actions">
          <button type="button" class="btn btn-admin" id="novoOnibusBtn">+ Novo ônibus</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Número</th><th>Placa</th><th>Capacidade</th><th>Motorista</th><th>Status</th><th></th></tr></thead>
          <tbody id="onibusTbody">
            ${ONIBUS.map(
              (o) => `
              <tr data-id="${o.id}">
                <td>Nº ${o.numero}</td>
                <td>${o.placa}</td>
                <td>${o.capacidade} lugares</td>
                <td>${o.motorista}</td>
                <td>${statusPill(o.status)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn-icon" data-action="editar-onibus" aria-label="Editar">✏️</button>
                  <button type="button" class="btn-icon danger" data-action="excluir-onibus" aria-label="Excluir">🗑️</button>
                </td>
              </tr>
            `
            ).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function onibusFormFields(o = {}) {
  return (
    field('Número', `<input name="numero" required value="${o.numero || ''}" />`) +
    field('Placa', `<input name="placa" required value="${o.placa || ''}" />`) +
    field('Capacidade (lugares)', `<input name="capacidade" type="number" min="1" required value="${o.capacidade || ''}" />`) +
    field('Motorista', `<input name="motorista" required value="${o.motorista || ''}" />`) +
    field(
      'Status',
      `<select name="status" required>
        ${['ativo', 'manutenção', 'inativo'].map((s) => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>`
    )
  );
}

function wireOnibusView() {
  document.getElementById('novoOnibusBtn').addEventListener('click', () => {
    openModal({
      title: 'Novo ônibus',
      fieldsHtml: onibusFormFields(),
      onSubmit: (data) => {
        ONIBUS.push({
          id: nextId(ONIBUS),
          numero: data.numero,
          placa: data.placa,
          capacidade: Number(data.capacidade),
          motorista: data.motorista,
          status: data.status,
        });
        showToast('Ônibus cadastrado (demonstração).');
        navigate('onibus');
      },
    });
  });

  document.querySelectorAll('[data-action="editar-onibus"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.closest('tr').dataset.id);
      const onibus = getOnibusById(id);
      openModal({
        title: 'Editar ônibus',
        fieldsHtml: onibusFormFields(onibus),
        onSubmit: (data) => {
          Object.assign(onibus, {
            numero: data.numero,
            placa: data.placa,
            capacidade: Number(data.capacidade),
            motorista: data.motorista,
            status: data.status,
          });
          showToast('Ônibus atualizado (demonstração).');
          navigate('onibus');
        },
      });
    });
  });

  document.querySelectorAll('[data-action="excluir-onibus"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.closest('tr').dataset.id);
      if (!confirm('Remover este ônibus da demonstração?')) return;
      const idx = ONIBUS.findIndex((o) => o.id === id);
      if (idx > -1) ONIBUS.splice(idx, 1);
      showToast('Ônibus removido (demonstração).');
      navigate('onibus');
    });
  });
}

function viewPontos() {
  return `
    <div class="panel">
      <div class="panel-header">
        <div>
          <h2>Pontos de ônibus</h2>
          <p>${PONTOS.length} ponto(s) cadastrado(s)</p>
        </div>
        <div class="panel-actions">
          <button type="button" class="btn btn-admin" id="novoPontoBtn">+ Novo ponto</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nome</th><th>Endereço</th><th>Referência</th><th>Status</th><th></th></tr></thead>
          <tbody id="pontosTbody">
            ${PONTOS.map(
              (p) => `
              <tr data-id="${p.id}">
                <td>${p.nome}</td>
                <td>${p.endereco}</td>
                <td>${p.referencia}</td>
                <td>${statusPill(p.status)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn-icon" data-action="editar-ponto" aria-label="Editar">✏️</button>
                  <button type="button" class="btn-icon danger" data-action="excluir-ponto" aria-label="Excluir">🗑️</button>
                </td>
              </tr>
            `
            ).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function pontoFormFields(p = {}) {
  return (
    field('Nome do ponto', `<input name="nome" required value="${p.nome || ''}" />`) +
    field('Endereço', `<input name="endereco" required value="${p.endereco || ''}" />`) +
    field('Referência', `<input name="referencia" value="${p.referencia || ''}" />`) +
    field(
      'Status',
      `<select name="status" required>
        ${['ativo', 'inativo'].map((s) => `<option ${p.status === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>`
    )
  );
}

function wirePontosView() {
  document.getElementById('novoPontoBtn').addEventListener('click', () => {
    openModal({
      title: 'Novo ponto de ônibus',
      fieldsHtml: pontoFormFields(),
      onSubmit: (data) => {
        PONTOS.push({ id: nextId(PONTOS), nome: data.nome, endereco: data.endereco, referencia: data.referencia, status: data.status });
        showToast('Ponto cadastrado (demonstração).');
        navigate('pontos');
      },
    });
  });

  document.querySelectorAll('[data-action="editar-ponto"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.closest('tr').dataset.id);
      const ponto = getPontoById(id);
      openModal({
        title: 'Editar ponto',
        fieldsHtml: pontoFormFields(ponto),
        onSubmit: (data) => {
          Object.assign(ponto, { nome: data.nome, endereco: data.endereco, referencia: data.referencia, status: data.status });
          showToast('Ponto atualizado (demonstração).');
          navigate('pontos');
        },
      });
    });
  });

  document.querySelectorAll('[data-action="excluir-ponto"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.closest('tr').dataset.id);
      if (!confirm('Remover este ponto da demonstração?')) return;
      const idx = PONTOS.findIndex((p) => p.id === id);
      if (idx > -1) PONTOS.splice(idx, 1);
      showToast('Ponto removido (demonstração).');
      navigate('pontos');
    });
  });
}

function mensalidadesTable(list, { editableStatus = false } = {}) {
  if (!list.length) {
    return `<div class="table-empty">Nenhuma mensalidade encontrada.</div>`;
  }

  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Aluno</th><th>Mês</th><th>Valor</th><th>Status</th>${editableStatus ? '<th></th>' : ''}</tr></thead>
        <tbody id="mensalidadesTbody">
          ${list
            .map(
              (m) => `
            <tr data-id="${m.id}">
              <td>${getAlunoById(m.alunoId).nome}</td>
              <td>${m.mes}</td>
              <td>${formatCurrency(m.valor)}</td>
              <td>
                ${
                  editableStatus
                    ? `<select class="filter-select" data-action="status-mensalidade" data-id="${m.id}">
                        ${['Pago', 'Pendente', 'Atrasado'].map((s) => `<option ${m.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                      </select>`
                    : statusPill(m.status)
                }
              </td>
              ${
                editableStatus
                  ? `<td>${m.status !== 'Pago' ? `<button type="button" class="btn btn-sm btn-financeiro" data-action="registrar-pagamento" data-id="${m.id}">Registrar pagamento</button>` : ''}</td>`
                  : ''
              }
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

function viewMensalidadesAdmin() {
  return `
    <div class="panel">
      <div class="panel-header">
        <div>
          <h2>Mensalidades e financeiro</h2>
          <p>Visão geral de todas as mensalidades do sistema</p>
        </div>
      </div>
      ${mensalidadesTable(MENSALIDADES)}
    </div>
  `;
}

function viewRelatorios() {
  const recebido = MENSALIDADES.filter((m) => m.status === 'Pago').reduce((s, m) => s + m.valor, 0);
  const pendente = MENSALIDADES.filter((m) => m.status === 'Pendente').reduce((s, m) => s + m.valor, 0);
  const atrasado = MENSALIDADES.filter((m) => m.status === 'Atrasado').reduce((s, m) => s + m.valor, 0);

  const porCurso = {};
  ALUNOS.forEach((a) => { porCurso[a.curso] = (porCurso[a.curso] || 0) + 1; });

  return `
    <div class="stat-grid">
      <div class="stat-card" data-tone="aluno"><div class="stat-card-label">Total recebido</div><div class="stat-card-value">${formatCurrency(recebido)}</div></div>
      <div class="stat-card" data-tone="financeiro"><div class="stat-card-label">Total pendente</div><div class="stat-card-value">${formatCurrency(pendente)}</div></div>
      <div class="stat-card" data-tone="danger"><div class="stat-card-label">Total atrasado</div><div class="stat-card-value">${formatCurrency(atrasado)}</div></div>
      <div class="stat-card" data-tone="admin"><div class="stat-card-label">Pontos ativos</div><div class="stat-card-value">${PONTOS.filter((p) => p.status === 'ativo').length}/${PONTOS.length}</div></div>
    </div>

    <div class="panel">
      <div class="panel-header"><div><h2>Ocupação dos ônibus</h2><p>Alunos alocados por veículo</p></div></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Ônibus</th><th>Motorista</th><th>Capacidade</th><th>Alunos alocados</th><th>Ocupação</th></tr></thead>
          <tbody>
            ${ONIBUS.map((o) => {
              const alocados = ALUNOS.filter((a) => a.onibusId === o.id).length;
              const pct = Math.round((alocados / o.capacidade) * 100);
              return `<tr><td>Nº ${o.numero}</td><td>${o.motorista}</td><td>${o.capacidade}</td><td>${alocados}</td><td>${pct}%</td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header"><div><h2>Alunos por curso</h2></div></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Curso</th><th>Qtd. de alunos</th></tr></thead>
          <tbody>
            ${Object.entries(porCurso).map(([curso, qtd]) => `<tr><td>${curso}</td><td>${qtd}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function viewUsuarios() {
  return `
    <div class="panel">
      <div class="panel-header">
        <div><h2>Usuários administradores</h2><p>Quem tem acesso ao painel de gestão</p></div>
        <div class="panel-actions"><button type="button" class="btn btn-admin" id="novoUsuarioBtn">+ Novo usuário</button></div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nome</th><th>E-mail</th><th>Cargo</th><th>Status</th><th></th></tr></thead>
          <tbody id="usuariosTbody">
            ${ADMINS.map(
              (u) => `
              <tr data-id="${u.id}">
                <td>${u.nome}</td>
                <td>${u.email}</td>
                <td>${u.cargo}</td>
                <td>${statusPill(u.status)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn-icon" data-action="desativar-usuario" aria-label="Alternar status">${u.status === 'ativo' ? '🚫' : '✅'}</button>
                </td>
              </tr>
            `
            ).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function wireUsuariosView() {
  document.getElementById('novoUsuarioBtn').addEventListener('click', () => {
    openModal({
      title: 'Novo usuário administrador',
      fieldsHtml:
        field('Nome', `<input name="nome" required />`) +
        field('E-mail', `<input name="email" type="email" required />`) +
        field('Cargo', `<select name="cargo"><option>Gestor</option><option>Atendimento</option></select>`),
      onSubmit: (data) => {
        ADMINS.push({ id: nextId(ADMINS), nome: data.nome, email: data.email, cargo: data.cargo, status: 'ativo' });
        showToast('Usuário cadastrado (demonstração).');
        navigate('usuarios');
      },
    });
  });

  document.querySelectorAll('[data-action="desativar-usuario"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.closest('tr').dataset.id);
      const user = ADMINS.find((u) => u.id === id);
      user.status = user.status === 'ativo' ? 'inativo' : 'ativo';
      navigate('usuarios');
    });
  });
}

/* =========================================================
   VIEWS — ALUNO
   ========================================================= */

function viewMeusDados() {
  const aluno = getAlunoById(state.alunoId);
  const ponto = getPontoById(aluno.pontoId);
  const onibus = getOnibusById(aluno.onibusId);

  return `
    <div class="info-grid">
      <div class="info-card">
        <div class="info-card-title">🪪 Dados do aluno</div>
        <div class="info-row"><span>Nome</span><span>${aluno.nome}</span></div>
        <div class="info-row"><span>Matrícula</span><span>${aluno.matricula}</span></div>
        <div class="info-row"><span>CPF</span><span>${aluno.cpf}</span></div>
        <div class="info-row"><span>Contato</span><span>${aluno.contato}</span></div>
        <div class="info-row"><span>Curso</span><span>${aluno.curso}</span></div>
        <div class="info-row"><span>Período</span><span>${aluno.periodo}</span></div>
      </div>
      <div class="info-card">
        <div class="info-card-title">🚌 Transporte vinculado</div>
        <div class="info-row"><span>Ônibus</span><span>Nº ${onibus.numero} — ${onibus.placa}</span></div>
        <div class="info-row"><span>Motorista</span><span>${onibus.motorista}</span></div>
        <div class="info-row"><span>Ponto de embarque</span><span>${ponto.nome}</span></div>
        <div class="info-row"><span>Endereço</span><span>${ponto.endereco}</span></div>
      </div>
    </div>
  `;
}

function viewMensalidadesAluno() {
  const lista = getMensalidadesByAluno(state.alunoId);
  return `
    <div class="panel">
      <div class="panel-header"><div><h2>Minhas mensalidades</h2><p>Situação de pagamento por mês</p></div></div>
      ${mensalidadesTable(lista)}
    </div>
  `;
}

function viewTransporte() {
  const aluno = getAlunoById(state.alunoId);
  const ponto = getPontoById(aluno.pontoId);
  const onibus = getOnibusById(aluno.onibusId);

  return `
    <div class="info-grid">
      <div class="info-card">
        <div class="info-card-title">🚌 Ônibus</div>
        <div class="info-row"><span>Número</span><span>Nº ${onibus.numero}</span></div>
        <div class="info-row"><span>Placa</span><span>${onibus.placa}</span></div>
        <div class="info-row"><span>Motorista</span><span>${onibus.motorista}</span></div>
        <div class="info-row"><span>Status</span><span>${statusPill(onibus.status)}</span></div>
      </div>
      <div class="info-card">
        <div class="info-card-title">📍 Ponto de embarque</div>
        <div class="info-row"><span>Nome</span><span>${ponto.nome}</span></div>
        <div class="info-row"><span>Endereço</span><span>${ponto.endereco}</span></div>
        <div class="info-row"><span>Referência</span><span>${ponto.referencia || '—'}</span></div>
      </div>
    </div>
  `;
}

/* =========================================================
   VIEWS — FINANCEIRO
   ========================================================= */

function viewMensalidadesFinanceiro() {
  return `
    <div class="panel">
      <div class="panel-header">
        <div><h2>Mensalidades de alunos</h2><p>Registre pagamentos e altere status manualmente</p></div>
      </div>
      ${mensalidadesTable(MENSALIDADES, { editableStatus: true })}
    </div>
  `;
}

function wireMensalidadesFinanceiro() {
  document.querySelectorAll('[data-action="status-mensalidade"]').forEach((sel) => {
    sel.addEventListener('change', () => {
      const id = Number(sel.dataset.id);
      const m = MENSALIDADES.find((x) => x.id === id);
      m.status = sel.value;
      if (sel.value === 'Pago') m.dataPagamento = `${m.mes}/2026`;
      showToast('Status atualizado (demonstração).');
      navigate(state.view);
    });
  });

  document.querySelectorAll('[data-action="registrar-pagamento"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const m = MENSALIDADES.find((x) => x.id === id);
      const aluno = getAlunoById(m.alunoId);

      openModal({
        title: 'Registrar pagamento',
        subtitle: `${aluno.nome} — ${m.mes}`,
        submitLabel: 'Confirmar pagamento',
        fieldsHtml:
          field('Valor pago', `<input name="valorPago" type="number" step="0.01" required value="${m.valor}" />`) +
          field('Forma de pagamento', `<select name="formaPagamento"><option>Pix</option><option>Dinheiro</option><option>Cartão</option></select>`),
        onSubmit: (data) => {
          m.status = 'Pago';
          m.dataPagamento = `${m.mes}/2026`;
          PAGAMENTOS.push({
            id: nextId(PAGAMENTOS),
            mensalidadeId: m.id,
            alunoId: m.alunoId,
            dataPagamento: m.dataPagamento,
            valorPago: Number(data.valorPago),
            formaPagamento: data.formaPagamento,
            comprovante: null,
          });
          showToast('Pagamento registrado (demonstração).');
          navigate(state.view);
        },
      });
    });
  });
}

function viewInadimplentes() {
  const atrasados = MENSALIDADES.filter((m) => m.status === 'Atrasado');

  return `
    <div class="panel">
      <div class="panel-header">
        <div><h2>Alunos inadimplentes</h2><p>${atrasados.length} mensalidade(s) em atraso</p></div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Aluno</th><th>Matrícula</th><th>Mês</th><th>Valor</th><th>Contato</th><th></th></tr></thead>
          <tbody>
            ${
              atrasados.length
                ? atrasados
                    .map((m) => {
                      const a = getAlunoById(m.alunoId);
                      const msg = `Olá, ${a.nome}! A mensalidade de transporte referente a ${m.mes} está em aberto. Pode verificar com a gente?`;
                      return `
                      <tr>
                        <td>${a.nome}</td>
                        <td>${a.matricula}</td>
                        <td>${m.mes}</td>
                        <td>${formatCurrency(m.valor)}</td>
                        <td>${a.contato}</td>
                        <td><a class="btn btn-sm btn-aluno" href="${waLink(a.contato, msg)}" target="_blank" rel="noopener">Cobrar no WhatsApp</a></td>
                      </tr>
                    `;
                    })
                    .join('')
                : `<tr><td colspan="6" class="table-empty">Nenhum aluno inadimplente 🎉</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function viewRelatoriosFinanceiro() {
  const recebido = MENSALIDADES.filter((m) => m.status === 'Pago').reduce((s, m) => s + m.valor, 0);
  const pendente = MENSALIDADES.filter((m) => m.status === 'Pendente').reduce((s, m) => s + m.valor, 0);
  const atrasado = MENSALIDADES.filter((m) => m.status === 'Atrasado').reduce((s, m) => s + m.valor, 0);

  return `
    <div class="panel">
      <div class="panel-header">
        <div><h2>Relatório financeiro por período</h2><p>Filtre por mês para ver o detalhamento</p></div>
        <div class="panel-actions">
          <select class="filter-select" id="mesFiltro">
            <option value="">Todos os meses</option>
            ${MESES.map((m) => `<option value="${m}">${m}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card" data-tone="aluno"><div class="stat-card-label">Recebimentos</div><div class="stat-card-value">${formatCurrency(recebido)}</div></div>
        <div class="stat-card" data-tone="financeiro"><div class="stat-card-label">Pendentes</div><div class="stat-card-value">${formatCurrency(pendente)}</div></div>
        <div class="stat-card" data-tone="danger"><div class="stat-card-label">Atrasados</div><div class="stat-card-value">${formatCurrency(atrasado)}</div></div>
      </div>

      <div class="table-wrap" id="relatorioTableWrap">
        ${mensalidadesTable(MENSALIDADES)}
      </div>
    </div>
  `;
}

function wireRelatoriosFinanceiro() {
  const sel = document.getElementById('mesFiltro');
  sel.addEventListener('change', () => {
    const lista = sel.value ? MENSALIDADES.filter((m) => m.mes === sel.value) : MENSALIDADES;
    document.getElementById('relatorioTableWrap').innerHTML = mensalidadesTable(lista);
  });
}

/* =========================================================
   REGISTRO DE VIEWS + WIRING
   ========================================================= */

const VIEWS = {
  dashboard: viewAdminDashboard,
  alunos: viewAlunos,
  onibus: viewOnibus,
  pontos: viewPontos,
  mensalidades: viewMensalidadesAdmin,
  relatorios: viewRelatorios,
  usuarios: viewUsuarios,

  'meus-dados': viewMeusDados,
  'mensalidades-aluno': viewMensalidadesAluno,
  transporte: viewTransporte,

  'mensalidades-fin': viewMensalidadesFinanceiro,
  inadimplentes: viewInadimplentes,
  'relatorios-fin': viewRelatoriosFinanceiro,
};

function wireUpView(viewId) {
  if (viewId === 'alunos') wireAlunosView();
  if (viewId === 'onibus') wireOnibusView();
  if (viewId === 'pontos') wirePontosView();
  if (viewId === 'usuarios') wireUsuariosView();
  if (viewId === 'mensalidades-fin') wireMensalidadesFinanceiro();
  if (viewId === 'relatorios-fin') wireRelatoriosFinanceiro();
}
