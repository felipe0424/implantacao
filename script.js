const TECHS = ["DIAS", "FRANÇA", "RAMOS", "VIDAL"];
const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const TIMES = ["09h", "16h", "17h"];
const STORAGE_KEY = "implantacao_allocations_v1";

const companies = [
  {
    id: "74051",
    nome: "74051 - SORVETES NESTLE VILAREJO - PETROLINA",
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
    nome: "74041 - SORVETES NETLE SHOPPING - PETROLINA",
    link: "sorvetesnetle.meusoftcom.com.br",
    meuCarrinho: "Pendente",
    cardapio: "✅",
    certificado: "✅",
    responsavel: "Timoteo Gerente Sorvetes Nestle River",
    horarios: [
      "31/07 (9h) - Instalação + Treinamento",
      "01/08 (9h) - Virada de sistema"
    ]
  }
];

const state = {
  allocations: loadAllocations(),
  draggingCompanyId: null
};

function loadAllocations() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveAllocations() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.allocations));
}

function statusBadge(text) {
  const v = String(text).toLowerCase();
  if (v.includes("✅") || v.includes("recebido")) return "ok";
  if (v.includes("pendente") || v.includes("não cadastrado")) return "warn";
  if (v.includes("não")) return "bad";
  return "warn";
}

function createCompanyCard(company) {
  const tpl = document.getElementById("companyCardTemplate");
  const node = tpl.content.firstElementChild.cloneNode(true);

  node.dataset.companyId = company.id;
  node.querySelector(".company-name").textContent = company.nome;
  node.querySelector(".company-link").textContent = company.link;
  node.querySelector(".responsavel").textContent = `Responsável: ${company.responsavel}`;

  const badges = node.querySelector(".badges");
  const entries = [
    ["Meu Carrinho", company.meuCarrinho],
    ["Cardápio", company.cardapio],
    ["Certificado", company.certificado]
  ];

  entries.forEach(([label, value]) => {
    const span = document.createElement("span");
    span.className = `badge ${statusBadge(value)}`;
    span.textContent = `${label}: ${value}`;
    badges.appendChild(span);
  });

  const details = node.querySelector(".details");
  details.innerHTML = `
    <strong>Horários sugeridos:</strong>
    <ul>${company.horarios.map(h => `<li>${h}</li>`).join("")}</ul>
  `;

  node.querySelector(".toggle-details").addEventListener("click", () => {
    details.classList.toggle("hidden");
  });

  node.addEventListener("dragstart", () => {
    state.draggingCompanyId = company.id;
    node.classList.add("dragging");
  });

  node.addEventListener("dragend", () => {
    state.draggingCompanyId = null;
    node.classList.remove("dragging");
    clearHighlights();
  });

  return node;
}

function buildFilters() {
  const techFilter = document.getElementById("techFilter");
  const dayFilter = document.getElementById("dayFilter");

  TECHS.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    techFilter.appendChild(opt);
  });

  DAYS.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    dayFilter.appendChild(opt);
  });

  techFilter.addEventListener("change", renderBoard);
  dayFilter.addEventListener("change", renderBoard);
}

function renderBoard() {
  const headRow = document.getElementById("headRow");
  const boardBody = document.getElementById("boardBody");
  const techFilter = document.getElementById("techFilter").value;
  const dayFilter = document.getElementById("dayFilter").value;

  const visibleTechs = techFilter === "ALL" ? TECHS : [techFilter];
  const visibleDays = dayFilter === "ALL" ? DAYS : [dayFilter];

  headRow.innerHTML = "<th>Horário</th>";
  visibleDays.forEach(day => {
    visibleTechs.forEach(tech => {
      const th = document.createElement("th");
      th.textContent = `${day} • ${tech}`;
      headRow.appendChild(th);
    });
  });

  boardBody.innerHTML = "";
  TIMES.forEach(time => {
    const tr = document.createElement("tr");

    const timeTd = document.createElement("td");
    timeTd.className = "time-col";
    timeTd.textContent = time;
    tr.appendChild(timeTd);

    visibleDays.forEach(day => {
      visibleTechs.forEach(tech => {
        const td = document.createElement("td");
        td.className = "slot";

        const slotHeader = document.createElement("div");
        slotHeader.className = "slot-header";
        slotHeader.textContent = `${day} às ${time}`;
        td.appendChild(slotHeader);

        const inner = document.createElement("div");
        inner.className = "slot-inner dropzone";
        inner.dataset.zone = "slot";
        inner.dataset.day = day;
        inner.dataset.tech = tech;
        inner.dataset.time = time;

        setupDropzone(inner);
        td.appendChild(inner);
        tr.appendChild(td);
      });
    });

    boardBody.appendChild(tr);
  });

  paintAllocations();
}

function setupDropzone(el) {
  el.addEventListener("dragover", e => {
    e.preventDefault();
    el.classList.add("drag-over");
  });

  el.addEventListener("dragleave", () => el.classList.remove("drag-over"));

  el.addEventListener("drop", e => {
    e.preventDefault();
    el.classList.remove("drag-over");
    const companyId = state.draggingCompanyId;
    if (!companyId) return;

    const incoming = {
      tech: el.dataset.tech,
      day: el.dataset.day,
      time: el.dataset.time
    };

    const existingCompany = findCompanyInSlot(incoming);
    if (existingCompany && existingCompany !== companyId) {
      const replace = confirm("Este slot já possui uma empresa. Deseja substituir?");
      if (!replace) return;
      delete state.allocations[existingCompany];
    }

    state.allocations[companyId] = incoming;
    saveAllocations();
    renderAll();
  });
}

function setupBacklogDropzone() {
  const backlog = document.getElementById("backlog");
  backlog.addEventListener("dragover", e => {
    e.preventDefault();
    backlog.classList.add("drag-over");
  });

  backlog.addEventListener("dragleave", () => backlog.classList.remove("drag-over"));

  backlog.addEventListener("drop", e => {
    e.preventDefault();
    backlog.classList.remove("drag-over");
    const companyId = state.draggingCompanyId;
    if (!companyId) return;
    delete state.allocations[companyId];
    saveAllocations();
    renderAll();
  });
}

function findCompanyInSlot(slot) {
  return Object.keys(state.allocations).find(cid => {
    const a = state.allocations[cid];
    return a.tech === slot.tech && a.day === slot.day && a.time === slot.time;
  });
}

function paintAllocations() {
  document.querySelectorAll(".slot-inner").forEach(s => (s.innerHTML = ""));

  Object.entries(state.allocations).forEach(([companyId, alloc]) => {
    const slot = document.querySelector(
      `.slot-inner[data-tech="${alloc.tech}"][data-day="${alloc.day}"][data-time="${alloc.time}"]`
    );
    if (!slot) return;

    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    slot.appendChild(createCompanyCard(company));
  });

  const backlog = document.getElementById("backlog");
  backlog.innerHTML = "";
  const allocatedIds = new Set(Object.keys(state.allocations));
  companies
    .filter(c => !allocatedIds.has(c.id))
    .forEach(c => backlog.appendChild(createCompanyCard(c)));

  document.getElementById("backlogCount").textContent = String(
    companies.filter(c => !allocatedIds.has(c.id)).length
  );
}

function clearHighlights() {
  document.querySelectorAll(".dropzone").forEach(el => el.classList.remove("drag-over"));
}

function renderAll() {
  renderBoard();
}

function setupReset() {
  document.getElementById("resetBtn").addEventListener("click", () => {
    const ok = confirm("Tem certeza que deseja apagar todas as alocações?");
    if (!ok) return;
    state.allocations = {};
    saveAllocations();
    renderAll();
  });
}

function init() {
  buildFilters();
  setupBacklogDropzone();
  setupReset();
  renderAll();
}

init();
