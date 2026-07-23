// ============================================================
// DADOS DAS EMPRESAS
// ============================================================
let companies = [];

const TECHS = ["DIAS", "FRANCA", "RAMOS", "VIDAL"];
const TECH_LABELS = { DIAS: "DIAS", FRANCA: "FRANÇA", RAMOS: "RAMOS", VIDAL: "VIDAL" };
const TECH_LETTERS = { DIAS: "D", FRANCA: "F", RAMOS: "R", VIDAL: "V" };
const TECH_CLASSES = { DIAS: "dias-bg", FRANCA: "franca-bg", RAMOS: "ramos-bg", VIDAL: "vidal-bg" };
const TIMES = ["08h", "09h", "10h", "11h", "14h", "15h", "16h", "17h"];
const API_BASE = '/api';

// ============================================================
// ESTADO
// ============================================================
let state = {
  currentWeekStart: getMonday(new Date()),
  activeTech: "DIAS",
  activePage: "calendar",
  allocations: [],
  blocked: [],
  draggingId: null,
  loading: false
};

// ============================================================
// API HELPERS
// ============================================================
async function api(endpoint, method, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}/${endpoint}`, opts);
  return res.json();
}

async function loadFromAPI() {
  state.loading = true;
  try {
    const [comps, allocs, blocked] = await Promise.all([
      api('companies', 'GET'),
      api('allocations', 'GET'),
      api('blocked', 'GET')
    ]);
    companies = comps;
    state.allocations = allocs;
    state.blocked = blocked;
  } catch (err) {
    console.warn('API indisponível, usando dados locais:', err);
    loadLocalFallback();
  }
  state.loading = false;
}

async function addAllocation(companyId, tech, date, time, span) {
  try {
    const result = await api('allocations', 'POST', { companyId, tech, date, time, span });
    state.allocations.push({ id: result.id, companyId, tech, date, time, span });
  } catch {
    state.allocations.push({ companyId, tech, date, time, span });
  }
}

async function removeAllocation(companyId, date, time, tech) {
  try {
    await api('allocations', 'DELETE', { companyId, date, time, tech });
  } catch { /* ignore */ }
  const idx = state.allocations.findIndex(a =>
    a.companyId === companyId && a.date === date && a.time === time && a.tech === tech
  );
  if (idx >= 0) state.allocations.splice(idx, 1);
}

async function blockSlot(tech, date, time) {
  try {
    await api('blocked', 'POST', { tech, date, time });
  } catch { /* ignore */ }
  state.blocked.push({ tech, date, time });
}

async function unblockSlot(tech, date, time) {
  try {
    await api('blocked', 'DELETE', { tech, date, time });
  } catch { /* ignore */ }
  state.blocked = state.blocked.filter(b => !(b.tech === tech && b.date === date && b.time === time));
}

async function resetAll() {
  try {
    // Delete all allocations and blocks via individual calls
    await Promise.all([
      ...state.allocations.map(a => api('allocations', 'DELETE', a)),
      ...state.blocked.map(b => api('blocked', 'DELETE', b))
    ]);
  } catch { /* ignore */ }
  state.allocations = [];
  state.blocked = [];
}

// Fallback local se API não estiver disponível
function loadLocalFallback() {
  companies = [
    { id: "74051", nome: "SORVETES NESTLE VILAREJO", cidade: "PETROLINA", link: "sorvetesnestle.meusoftcom.com.br", meuCarrinho: "Não liberado", cardapio: "Recebido, Não Cadastrado", certificado: "Não recebido", responsavel: "Cli Thais Nestlé Vilarejo", horarios: ["30/07 (16h) - Instalação + Treinamento", "31/07 (16h) - Continuação de treinamento", "01/08 (17h) - Virada de sistema"] },
    { id: "74041", nome: "SORVETES NESTLE SHOPPING", cidade: "PETROLINA", link: "sorvetesnetle.meusoftcom.com.br", meuCarrinho: "Pendente", cardapio: "✅", certificado: "✅", responsavel: "Timoteo Gerente Sorvetes Nestle River", horarios: ["31/07 (9h) - Instalação + Treinamento", "01/08 (9h) - Virada de sistema"] },
    { id: "74039", nome: "PASTELANDIA", cidade: "PETROLINA", link: "pastelandiapetrolina.meusoftcom.com.br", meuCarrinho: "Não liberado", cardapio: "Não recebido", certificado: "Não recebido", responsavel: "Pendente", horarios: ["Pendente"] },
    { id: "74053", nome: "PASTELANDIA VILAREJO", cidade: "PETROLINA", link: "pastelandiavilarejo.meusoftcom.com.br", meuCarrinho: "Não liberado", cardapio: "Recebido, não cadastrado", certificado: "Não recebido", responsavel: "Pendente", horarios: ["Pendente"] },
    { id: "74054", nome: "TORTTERIA SUICA RIVER SHOPPING", cidade: "PETROLINA", link: "tortteriasuica.meusoftcom.com.br", meuCarrinho: "Não liberado", cardapio: "Não recebido", certificado: "Não recebido", responsavel: "Pendente", horarios: ["Pendente"] }
  ];
}

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function getWeekDays() {
  const days = [];
  for (let i = 0; i < 7; i++) {
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
  if (v.includes("recebido") || v.includes("liberado")) return "ok";
  return "warn";
}

function slotKey(dateStr, time, tech) {
  return `${tech}_${dateStr}_${time}`;
}

function isBlocked(dateStr, time, tech) {
  return state.blocked.some(b => b.date === dateStr && b.time === time && b.tech === tech);
}

function getAllocsForSlot(dateStr, time, tech) {
  return state.allocations.filter(a => a.date === dateStr && a.time === time && a.tech === tech);
}

function getAllocsForSlotAllTechs(dateStr, time) {
  return state.allocations.filter(a => a.date === dateStr && a.time === time);
}

// ============================================================
// RENDERIZAÇÃO - SIDEBAR
// ============================================================
function renderBacklog() {
  const list = document.getElementById('backlog');
  list.innerHTML = '';
  const searchTerm = (document.getElementById('searchInput').value || '').toLowerCase();

  const filtered = companies.filter(c => {
    if (searchTerm && !c.nome.toLowerCase().includes(searchTerm) && !c.id.includes(searchTerm)) return false;
    return true;
  });

  filtered.forEach(c => list.appendChild(createSidebarCard(c)));
  document.getElementById('backlogCount').textContent = filtered.length;
}

function createSidebarCard(company) {
  const card = document.createElement('div');
  card.className = 'company-card';
  card.draggable = true;
  card.dataset.companyId = company.id;
  card.innerHTML = `<div class="card-name">${company.id} - ${company.nome}</div>`;

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

  card.addEventListener('mouseenter', (e) => showTooltip(e, company));
  card.addEventListener('mousemove', (e) => moveTooltip(e));
  card.addEventListener('mouseleave', hideTooltip);

  return card;
}

// ============================================================
// RENDERIZAÇÃO - CALENDÁRIO (por técnico)
// ============================================================
function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const days = getWeekDays();
  const tech = state.activeTech;

  // Para cada dia, calcula os "spans" reais baseado em alocações consecutivas
  // do mesmo cliente. Retorna um mapa: { "dateStr_time" -> { skip: bool, rowspan: number, allocs: [] } }
  const cellInfo = {};

  days.forEach(d => {
    const dateStr = d.toISOString().slice(0, 10);
    let skipUntilIdx = -1;

    for (let i = 0; i < TIMES.length; i++) {
      const time = TIMES[i];
      const key = `${dateStr}_${time}`;

      if (i <= skipUntilIdx) {
        cellInfo[key] = { skip: true };
        continue;
      }

      const allocs = getAllocsForSlot(dateStr, time, tech);

      if (allocs.length === 0 || isBlocked(dateStr, time, tech)) {
        cellInfo[key] = { skip: false, rowspan: 1, allocs };
        continue;
      }

      // Check for explicit span (from modal with duration 2)
      const maxExplicitSpan = Math.max(...allocs.map(a => a.span || 1));

      // Also detect consecutive same-company allocations
      let consecutiveSpan = 1;
      if (allocs.length === 1) {
        const companyId = allocs[0].companyId;
        for (let j = i + 1; j < TIMES.length; j++) {
          const nextAllocs = getAllocsForSlot(dateStr, TIMES[j], tech);
          if (nextAllocs.length === 1 && nextAllocs[0].companyId === companyId) {
            consecutiveSpan++;
          } else {
            break;
          }
        }
      }

      const finalSpan = Math.max(maxExplicitSpan, consecutiveSpan);
      cellInfo[key] = { skip: false, rowspan: finalSpan, allocs };

      // Mark subsequent cells as skipped
      if (finalSpan > 1) {
        skipUntilIdx = i + finalSpan - 1;
      }
    }
  });

  let html = '<table class="cal-table"><thead><tr><th class="time-cell">HORA</th>';
  days.forEach(d => {
    const dateStr = d.toISOString().slice(0, 10);
    const todayClass = isToday(d) ? ' today' : '';
    const allBlocked = TIMES.every(t => isBlocked(dateStr, t, tech));
    const dayBtnLabel = allBlocked ? '↩' : '🚫';
    const dayBtnTitle = allBlocked ? 'Liberar dia' : 'Bloquear dia inteiro';
    html += `<th class="${todayClass}">${getDayName(d)}<span class="day-number">${d.getDate()}</span>
      <button class="day-block-btn" data-action="${allBlocked ? 'unblock-day' : 'block-day'}" data-date="${dateStr}" data-tech="${tech}" title="${dayBtnTitle}">${dayBtnLabel}</button>
    </th>`;
  });
  html += '</tr></thead><tbody>';

  TIMES.forEach((time, timeIdx) => {
    html += '<tr>';
    html += `<td class="time-cell">${time}</td>`;
    days.forEach(d => {
      const dateStr = d.toISOString().slice(0, 10);
      const key = `${dateStr}_${time}`;
      const info = cellInfo[key] || { skip: false, rowspan: 1, allocs: [] };

      if (info.skip) return;

      const blocked = isBlocked(dateStr, time, tech);
      const allocs = info.allocs || [];
      const rowspan = info.rowspan || 1;

      const cellClass = blocked ? 'slot-cell unavailable' : 'slot-cell';
      const rowspanAttr = rowspan > 1 ? ` rowspan="${rowspan}"` : '';
      const heightStyle = rowspan > 1 ? ` style="height: ${80 * rowspan}px"` : '';

      html += `<td class="${cellClass}"${rowspanAttr}${heightStyle} data-date="${dateStr}" data-time="${time}" data-tech="${tech}">`;

      if (!blocked) {
        const hasClient = allocs.length > 0;
        if (!hasClient) {
          html += `<div class="slot-actions">
            <button class="slot-action-btn add-btn" data-action="add" data-date="${dateStr}" data-time="${time}" data-tech="${tech}" title="Adicionar">+</button>
            <button class="slot-action-btn block-btn" data-action="block" data-date="${dateStr}" data-time="${time}" data-tech="${tech}" title="Bloquear">✕</button>
          </div>`;
        }
        html += '<div class="slot-content">';
        if (hasClient) {
          // Show unique companies (avoid repeating same company in merged cell)
          const seen = new Set();
          allocs.forEach(a => {
            if (seen.has(a.companyId)) return;
            seen.add(a.companyId);
            const comp = companies.find(c => c.id === a.companyId);
            if (comp) {
              const spanLabel = rowspan > 1 ? ` (${rowspan}h)` : '';
              html += `<div class="slot-card${rowspan > 1 ? ' spanning' : ''}" data-company-id="${comp.id}" data-date="${dateStr}" data-time="${time}" data-tech="${tech}">
                <span class="tech-indicator ${TECH_CLASSES[tech]}">${TECH_LETTERS[tech]}</span>
                <span>${comp.id} - ${comp.nome}${spanLabel}</span>
                <button class="remove-btn" data-remove-company="${comp.id}" data-remove-date="${dateStr}" data-remove-time="${time}" data-remove-tech="${tech}" data-remove-span="${rowspan}">✕</button>
              </div>`;
            }
          });
        }
        html += '</div>';
      } else {
        html += `<div class="slot-actions">
          <button class="slot-action-btn add-btn" data-action="unblock" data-date="${dateStr}" data-time="${time}" data-tech="${tech}" title="Desbloquear">↩</button>
        </div>`;
      }

      html += '</td>';
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  grid.innerHTML = html;

  attachCalendarEvents(grid);
}

// ============================================================
// RENDERIZAÇÃO - DASHBOARD (todos os técnicos)
// ============================================================
function renderDashboard() {
  const grid = document.getElementById('dashboardGrid');
  const days = getWeekDays();

  // Build covered cells map (all techs)
  const covered = {};
  days.forEach(d => {
    const dateStr = d.toISOString().slice(0, 10);
    const allocs = state.allocations.filter(a => a.date === dateStr);
    allocs.forEach(a => {
      const span = a.span || 1;
      if (span > 1) {
        const startIdx = TIMES.indexOf(a.time);
        for (let s = 1; s < span; s++) {
          if (startIdx + s < TIMES.length) {
            const coveredKey = `${dateStr}_${TIMES[startIdx + s]}`;
            if (!covered[coveredKey]) covered[coveredKey] = 0;
            covered[coveredKey]++;
          }
        }
      }
    });
  });

  let html = '<table class="cal-table"><thead><tr><th class="time-cell">HORA</th>';
  days.forEach(d => {
    const todayClass = isToday(d) ? ' today' : '';
    html += `<th class="${todayClass}">${getDayName(d)}<span class="day-number">${d.getDate()}</span></th>`;
  });
  html += '</tr></thead><tbody>';

  TIMES.forEach(time => {
    html += '<tr>';
    html += `<td class="time-cell">${time}</td>`;
    days.forEach(d => {
      const dateStr = d.toISOString().slice(0, 10);
      const cellKey = `${dateStr}_${time}`;
      const allocs = getAllocsForSlotAllTechs(dateStr, time);

      // Check if ALL allocs for this cell are covered (continuation of span from above)
      // Only skip if this cell has no primary allocs and is fully covered
      if (covered[cellKey] && allocs.length === 0) return;

      let rowspan = 1;
      if (allocs.length > 0) {
        rowspan = Math.max(...allocs.map(a => a.span || 1));
      }

      const rowspanAttr = rowspan > 1 ? ` rowspan="${rowspan}"` : '';
      const heightStyle = rowspan > 1 ? ` style="height: ${80 * rowspan}px"` : '';

      html += `<td class="slot-cell"${rowspanAttr}${heightStyle} data-date="${dateStr}" data-time="${time}">`;
      html += '<div class="slot-content dashboard-row">';

      if (allocs.length > 0) {
        allocs.forEach(a => {
          const comp = companies.find(c => c.id === a.companyId);
          if (comp) {
            const spanLabel = (a.span || 1) > 1 ? ` (${a.span}h)` : '';
            html += `<div class="slot-card" data-company-id="${comp.id}">
              <span class="tech-indicator ${TECH_CLASSES[a.tech]}">${TECH_LETTERS[a.tech]}</span>
              <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${comp.id} - ${comp.nome}${spanLabel}</span>
            </div>`;
          }
        });
      }

      html += '</div></td>';
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  grid.innerHTML = html;

  // Tooltip on dashboard cards
  grid.querySelectorAll('.slot-card').forEach(card => {
    const cid = card.dataset.companyId;
    const comp = companies.find(c => c.id === cid);
    if (comp) {
      card.addEventListener('mouseenter', (e) => showTooltip(e, comp));
      card.addEventListener('mousemove', (e) => moveTooltip(e));
      card.addEventListener('mouseleave', hideTooltip);
    }
  });
}

// ============================================================
// EVENTOS DO CALENDÁRIO
// ============================================================
function attachCalendarEvents(grid) {
  // Drop zones
  grid.querySelectorAll('.slot-cell:not(.unavailable)').forEach(cell => {
    cell.addEventListener('dragover', (e) => {
      e.preventDefault();
      cell.classList.add('drag-over');
    });
    cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
    cell.addEventListener('drop', async (e) => {
      e.preventDefault();
      cell.classList.remove('drag-over');
      if (!state.draggingId) return;

      const dateStr = cell.dataset.date;
      const time = cell.dataset.time;
      const tech = cell.dataset.tech;

      // Only 1 client per slot per tech
      const existing = getAllocsForSlot(dateStr, time, tech);
      if (existing.length > 0) return;

      await addAllocation(state.draggingId, tech, dateStr, time, 1);
      renderAll();
    });
  });

  // Action buttons (add, block, unblock)
  grid.querySelectorAll('.slot-action-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const dateStr = btn.dataset.date;
      const time = btn.dataset.time;
      const tech = btn.dataset.tech;

      if (action === 'add') {
        openAddModal(dateStr, time, tech);
      } else if (action === 'block') {
        await blockSlot(tech, dateStr, time);
        renderAll();
      } else if (action === 'unblock') {
        await unblockSlot(tech, dateStr, time);
        renderAll();
      }
    });
  });

  // Remove buttons
  grid.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const cid = btn.dataset.removeCompany;
      const date = btn.dataset.removeDate;
      const time = btn.dataset.removeTime;
      const tech = btn.dataset.removeTech;
      const span = parseInt(btn.dataset.removeSpan) || 1;

      // Remove all consecutive allocations of this company
      const startIdx = TIMES.indexOf(time);
      for (let i = 0; i < span; i++) {
        const t = TIMES[startIdx + i];
        if (t) await removeAllocation(cid, date, t, tech);
      }
      renderAll();
    });
  });

  // Tooltip on slot cards
  grid.querySelectorAll('.slot-card').forEach(card => {
    const cid = card.dataset.companyId;
    const comp = companies.find(c => c.id === cid);
    if (comp) {
      card.addEventListener('mouseenter', (e) => showTooltip(e, comp));
      card.addEventListener('mousemove', (e) => moveTooltip(e));
      card.addEventListener('mouseleave', hideTooltip);
    }
  });

  // Day block/unblock buttons
  grid.querySelectorAll('.day-block-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const dateStr = btn.dataset.date;
      const tech = btn.dataset.tech;

      if (action === 'block-day') {
        for (const time of TIMES) {
          if (!isBlocked(dateStr, time, tech)) {
            await blockSlot(tech, dateStr, time);
          }
        }
      } else if (action === 'unblock-day') {
        for (const time of TIMES) {
          if (isBlocked(dateStr, time, tech)) {
            await unblockSlot(tech, dateStr, time);
          }
        }
      }
      renderAll();
    });
  });
}

// ============================================================
// MODAL ADICIONAR
// ============================================================
let modalContext = {};

function openAddModal(dateStr, time, tech) {
  modalContext = { date: dateStr, time: time, tech: tech };
  const modal = document.getElementById('modalOverlay');
  const select = document.getElementById('modalCompanySelect');
  const techSelect = document.getElementById('modalTechSelect');

  select.innerHTML = '';
  companies.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.id} - ${c.nome}`;
    select.appendChild(opt);
  });

  techSelect.value = tech;

  const dateObj = new Date(dateStr + 'T12:00:00');
  document.getElementById('modalTitle').textContent =
    `Adicionar - ${getDayName(dateObj)} ${formatDate(dateObj)} às ${time}`;

  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

async function confirmModal() {
  const companyId = document.getElementById('modalCompanySelect').value;
  const tech = document.getElementById('modalTechSelect').value;
  const duration = parseInt(document.getElementById('modalDuration').value);
  const dateStr = modalContext.date;
  const time = modalContext.time;

  await addAllocation(companyId, tech, dateStr, time, duration);

  closeModal();
  renderAll();
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
    <div class="tt-row"><span class="tt-label">🛒 Meu Carrinho:</span><span class="tt-value tt-${carrClass}">${company.meuCarrinho}</span></div>
    <div class="tt-row"><span class="tt-label">📋 Cardápio:</span><span class="tt-value tt-${cardClass}">${company.cardapio}</span></div>
    <div class="tt-row"><span class="tt-label">📑 Certificado:</span><span class="tt-value tt-${certClass}">${company.certificado}</span></div>
    <div class="tt-row"><span class="tt-label">👤 Responsável:</span><span class="tt-value">${company.responsavel}</span></div>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:6px 0">
    <strong style="font-size:0.7rem">⏰ Horários:</strong>
    <div style="font-size:0.7rem;margin-top:4px">${company.horarios.map(h => '• ' + h).join('<br>')}</div>
  `;
  tip.classList.add('visible');
  moveTooltip(e);
}

function moveTooltip(e) {
  const tip = document.getElementById('tooltip');
  const x = e.clientX + 14;
  const y = e.clientY + 10;
  tip.style.left = Math.min(x, window.innerWidth - 300) + 'px';
  tip.style.top = Math.min(y, window.innerHeight - 250) + 'px';
}

function hideTooltip() {
  document.getElementById('tooltip').classList.remove('visible');
}

// ============================================================
// NAVEGAÇÃO E RENDER
// ============================================================
function renderWeekLabel() {
  const days = getWeekDays();
  document.getElementById('weekLabel').textContent = `${formatDate(days[0])} - ${formatDate(days[6])}`;
}

function renderTabs() {
  document.querySelectorAll('.tech-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tech === state.activeTech);
  });
}

function renderPages() {
  document.getElementById('pageCalendar').classList.toggle('hidden', state.activePage !== 'calendar');
  document.getElementById('pageDashboard').classList.toggle('hidden', state.activePage !== 'dashboard');
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === state.activePage);
  });
}

function renderAll() {
  renderWeekLabel();
  renderBacklog();
  renderTabs();
  renderPages();
  if (state.activePage === 'calendar') {
    renderCalendar();
  } else {
    renderDashboard();
  }
}

// ============================================================
// EVENTOS GLOBAIS
// ============================================================
function setupEvents() {
  // Tech tabs
  document.querySelectorAll('.tech-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.activeTech = tab.dataset.tech;
      renderAll();
    });
  });

  // Page navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activePage = btn.dataset.page;
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
  document.getElementById('resetBtn').addEventListener('click', async () => {
    if (confirm('Tem certeza que deseja apagar todas as alocações e bloqueios?')) {
      await resetAll();
      renderAll();
    }
  });

  // Search
  document.getElementById('searchInput').addEventListener('input', renderBacklog);

  // Modal
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalConfirm').addEventListener('click', confirmModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
}

// ============================================================
// INIT
// ============================================================
async function init() {
  setupEvents();
  await loadFromAPI();
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
