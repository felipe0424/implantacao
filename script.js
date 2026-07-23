// ============================================================
// DADOS DAS EMPRESAS
// ============================================================
const companies = [
  {
    id: "74051",
    nome: "SORVETES NESTLE VILAREJO",
    cidade: "PETROLINA",
    link: "sorvetesnestle.meusoftcom.com.br",
    meuCarrinho: "Não liberado",
    cardapio: "Recebido, Não Cadastrado",
    certificado: "Não recebido",
    responsavel: "Cli Thais Nestlé Vilarejo",
    horarios: [
      "30/07 (16h) - Instalação + Treinamento",
      "31/07 (16h) - Continuação de treinamento",
      "01/08 (17h) - Virada de sistema"
    ]
  },
  {
    id: "74041",
    nome: "SORVETES NESTLE SHOPPING",
    cidade: "PETROLINA",
    link: "sorvetesnetle.meusoftcom.com.br",
    meuCarrinho: "Pendente",
    cardapio: "✅",
    certificado: "✅",
    responsavel: "Timoteo Gerente Sorvetes Nestle River",
    horarios: [
      "31/07 (9h) - Instalação + Treinamento",
      "01/08 (9h) - Virada de sistema"
    ]
  },
  {
    id: "74039",
    nome: "PASTELANDIA",
    cidade: "PETROLINA",
    link: "pastelandiapetrolina.meusoftcom.com.br",
    meuCarrinho: "Não liberado",
    cardapio: "Não recebido",
    certificado: "Não recebido",
    responsavel: "Pendente",
    horarios: ["Pendente"]
  },
  {
    id: "74053",
    nome: "PASTELANDIA VILAREJO",
    cidade: "PETROLINA",
    link: "pastelandiavilarejo.meusoftcom.com.br",
    meuCarrinho: "Não liberado",
    cardapio: "Recebido, não cadastrado",
    certificado: "Não recebido",
    responsavel: "Pendente",
    horarios: ["Pendente"]
  },
  {
    id: "74054",
    nome: "TORTTERIA SUICA RIVER SHOPPING",
    cidade: "PETROLINA",
    link: "tortteriasuica.meusoftcom.com.br",
    meuCarrinho: "Não liberado",
    cardapio: "Não recebido",
    certificado: "Não recebido",
    responsavel: "Pendente",
    horarios: ["Pendente"]
  }
];

const TECHS = ["DIAS", "FRANCA", "RAMOS", "VIDAL"];
const TECH_LABELS = { DIAS: "DIAS", FRANCA: "FRANÇA", RAMOS: "RAMOS", VIDAL: "VIDAL" };
const TIMES = ["08h", "09h", "10h", "11h", "14h", "15h", "16h", "17h"];
const STORAGE_KEY = "implantacao_v3";

// ============================================================
// ESTADO
// ============================================================
let state = {
  currentWeekStart: getMonday(new Date()),
  activeTech: "DIAS",
  allocations: loadState(),
  draggingId: null
};

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.allocations));
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function getWeekDays() {
  const days = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(state.currentWeekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDate(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getDayName(d) {
  const names = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  return names[d.getDay()];
}

function isToday(d) {
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

function statusClass(text) {
  const v = String(text).toLowerCase();
  if (v.includes("✅")) return "ok";
  if (v.includes("pendente") || v.includes("não cadastrado")) return "warn";
  if (v.includes("não")) return "bad";
  if (v.includes("recebido")) return "ok";
  return "warn";
}

function slotKey(dateStr, time, tech) {
  return `${tech}_${dateStr}_${time}`;
}

// ============================================================
// RENDERIZAÇÃO
// ============================================================
function renderWeekLabel() {
  const days = getWeekDays();
  const start = formatDate(days[0]);
  const end = formatDate(days[4]);
  document.getElementById('weekLabel').textContent = `${start} - ${end}`;
}

function renderBacklog() {
  const list = document.getElementById('backlog');
  list.innerHTML = '';
  const allocatedIds = new Set(Object.values(state.allocations).map(a => a.companyId));
  const searchTerm = (document.getElementById('searchInput').value || '').toLowerCase();

  const filtered = companies.filter(c => {
    if (allocatedIds.has(c.id)) return false;
    if (searchTerm && !c.nome.toLowerCase().includes(searchTerm) && !c.id.includes(searchTerm)) return false;
    return true;
  });

  filtered.forEach(c => list.appendChild(createCard(c, false)));
  document.getElementById('backlogCount').textContent = filtered.length;
}

function createCard(company, mini) {
  const card = document.createElement('div');
  card.className = `company-card${mini ? ' mini' : ''}`;
  card.draggable = true;
  card.dataset.companyId = company.id;

  const statusCarrinho = statusClass(company.meuCarrinho);
  const statusCardapio = statusClass(company.cardapio);
  const statusCert = statusClass(company.certificado);

  card.innerHTML = `
    <div class="card-name">${company.id} - ${company.nome}</div>
    ${!mini ? `<div class="card-link">🔗 ${company.link}</div>` : ''}
    <div class="card-badges">
      <span class="badge ${statusCarrinho}">🛒 ${company.meuCarrinho}</span>
      <span class="badge ${statusCardapio}">📋 ${company.cardapio}</span>
      <span class="badge ${statusCert}">📑 ${company.certificado}</span>
    </div>
    ${!mini ? `<div class="card-responsible">👤 ${company.responsavel}</div>` : ''}
    <div class="card-details">
      <strong>⏰ Horários:</strong>
      <ul>${company.horarios.map(h => `<li>${h}</li>`).join('')}</ul>
    </div>
  `;

  // Drag events
  card.addEventListener('dragstart', (e) => {
    state.draggingId = company.id;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', company.id);
  });

  card.addEventListener('dragend', () => {
    state.draggingId = null;
    card.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  });

  // Tooltip on hover
  card.addEventListener('mouseenter', (e) => showTooltip(e, company));
  card.addEventListener('mousemove', (e) => moveTooltip(e));
  card.addEventListener('mouseleave', hideTooltip);

  return card;
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const days = getWeekDays();
  const techs = state.activeTech === 'ALL' ? TECHS : [state.activeTech];

  let html = '';

  techs.forEach(tech => {
    if (state.activeTech === 'ALL') {
      html += `<div class="tech-section-label">${TECH_LABELS[tech]}</div>`;
    }

    html += '<table class="cal-table"><thead><tr><th class="time-cell">Hora</th>';

    days.forEach(d => {
      const todayClass = isToday(d) ? ' today' : '';
      html += `<th class="${todayClass}">
        ${getDayName(d)}
        <span class="day-number">${d.getDate()}</span>
      </th>`;
    });

    html += '</tr></thead><tbody>';

    TIMES.forEach(time => {
      html += '<tr>';
      html += `<td class="time-cell">${time}</td>`;

      days.forEach(d => {
        const dateStr = d.toISOString().slice(0, 10);
        const key = slotKey(dateStr, time, tech);
        const alloc = state.allocations[key];
        let cellContent = '<div class="empty-label">Arraste aqui</div>';

        if (alloc) {
          const comp = companies.find(c => c.id === alloc.companyId);
          if (comp) {
            cellContent = '';
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(createCard(comp, true));
            cellContent = tempDiv.innerHTML;
          }
        }

        html += `<td class="slot-cell" data-key="${key}" data-date="${dateStr}" data-time="${time}" data-tech="${tech}">
          <div class="slot-content">${cellContent}</div>
        </td>`;
      });

      html += '</tr>';
    });

    html += '</tbody></table>';
  });

  grid.innerHTML = html;

  // Re-attach drag events to mini cards in calendar
  grid.querySelectorAll('.company-card').forEach(card => {
    card.draggable = true;
    const cid = card.dataset.companyId;
    card.addEventListener('dragstart', (e) => {
      state.draggingId = cid;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', cid);
    });
    card.addEventListener('dragend', () => {
      state.draggingId = null;
      card.classList.remove('dragging');
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    const comp = companies.find(c => c.id === cid);
    if (comp) {
      card.addEventListener('mouseenter', (e) => showTooltip(e, comp));
      card.addEventListener('mousemove', (e) => moveTooltip(e));
      card.addEventListener('mouseleave', hideTooltip);
    }
  });

  // Setup drop zones
  grid.querySelectorAll('.slot-cell').forEach(cell => {
    cell.addEventListener('dragover', (e) => {
      e.preventDefault();
      cell.classList.add('drag-over');
    });
    cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
    cell.addEventListener('drop', (e) => {
      e.preventDefault();
      cell.classList.remove('drag-over');
      if (!state.draggingId) return;

      const key = cell.dataset.key;
      const companyId = state.draggingId;

      // Remove old allocation for this company
      Object.keys(state.allocations).forEach(k => {
        if (state.allocations[k].companyId === companyId) {
          delete state.allocations[k];
        }
      });

      // Allocate
      state.allocations[key] = {
        companyId,
        date: cell.dataset.date,
        time: cell.dataset.time,
        tech: cell.dataset.tech
      };

      saveState();
      renderAll();
    });
  });
}

function renderTabs() {
  document.querySelectorAll('.tech-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tech === state.activeTech);
  });
}

function renderAll() {
  renderWeekLabel();
  renderBacklog();
  renderCalendar();
  renderTabs();
}

// ============================================================
// TOOLTIP
// ============================================================
function showTooltip(e, company) {
  const tip = document.getElementById('tooltip');
  const carrClass = statusClass(company.meuCarrinho);
  const cardClass = statusClass(company.cardapio);
  const certClass = statusClass(company.certificado);

  tip.innerHTML = `
    <h4>🏢 ${company.id} - ${company.nome}</h4>
    <div class="tt-row"><span class="tt-label">Cidade:</span><span class="tt-value">${company.cidade}</span></div>
    <div class="tt-row"><span class="tt-label">Link:</span><span class="tt-value">${company.link}</span></div>
    <div class="tt-row"><span class="tt-label">Meu Carrinho:</span><span class="tt-value tt-${carrClass}">${company.meuCarrinho}</span></div>
    <div class="tt-row"><span class="tt-label">Cardápio:</span><span class="tt-value tt-${cardClass}">${company.cardapio}</span></div>
    <div class="tt-row"><span class="tt-label">Certificado:</span><span class="tt-value tt-${certClass}">${company.certificado}</span></div>
    <div class="tt-row"><span class="tt-label">Responsável:</span><span class="tt-value">${company.responsavel}</span></div>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:6px 0">
    <strong style="font-size:0.72rem">⏰ Horários:</strong>
    <div style="font-size:0.72rem;margin-top:4px">${company.horarios.map(h => `• ${h}`).join('<br>')}</div>
  `;
  tip.classList.add('visible');
  moveTooltip(e);
}

function moveTooltip(e) {
  const tip = document.getElementById('tooltip');
  const x = e.clientX + 16;
  const y = e.clientY + 12;
  tip.style.left = Math.min(x, window.innerWidth - 320) + 'px';
  tip.style.top = Math.min(y, window.innerHeight - 200) + 'px';
}

function hideTooltip() {
  document.getElementById('tooltip').classList.remove('visible');
}

// ============================================================
// EVENTOS
// ============================================================
function setupEvents() {
  // Tech tabs
  document.querySelectorAll('.tech-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.activeTech = tab.dataset.tech;
      renderAll();
    });
  });

  // Week navigation
  document.getElementById('prevWeek').addEventListener('click', () => {
    state.currentWeekStart.setDate(state.currentWeekStart.getDate() - 7);
    renderAll();
  });
  document.getElementById('nextWeek').addEventListener('click', () => {
    state.currentWeekStart.setDate(state.currentWeekStart.getDate() + 7);
    renderAll();
  });
  document.getElementById('todayBtn').addEventListener('click', () => {
    state.currentWeekStart = getMonday(new Date());
    renderAll();
  });

  // Reset
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Tem certeza que deseja apagar todas as alocações?')) {
      state.allocations = {};
      saveState();
      renderAll();
    }
  });

  // Search
  document.getElementById('searchInput').addEventListener('input', renderBacklog);

  // Backlog drop zone (to return cards)
  const backlog = document.getElementById('backlog');
  backlog.addEventListener('dragover', (e) => {
    e.preventDefault();
    backlog.classList.add('drag-over');
  });
  backlog.addEventListener('dragleave', () => backlog.classList.remove('drag-over'));
  backlog.addEventListener('drop', (e) => {
    e.preventDefault();
    backlog.classList.remove('drag-over');
    if (!state.draggingId) return;

    // Remove allocation
    Object.keys(state.allocations).forEach(k => {
      if (state.allocations[k].companyId === state.draggingId) {
        delete state.allocations[k];
      }
    });

    saveState();
    renderAll();
  });
}

// ============================================================
// INIT
// ============================================================
function init() {
  setupEvents();
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
