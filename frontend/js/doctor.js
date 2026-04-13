// js/doctor.js — Page Médecin (icônes SVG, zéro emoji)

(function guardRoute() {
  if (!Auth.isLoggedIn()) { window.location.href = '/'; return; }
  if (Auth.getUser().role !== 'doctor') window.location.href = '/pages/it.html';
})();

const state = { predefinedTickets: [], myTickets: [], currentCatFilter: 'all', mlTimer: null };

// ── Icônes SVG par catégorie ────────────────────────────────────────
const CAT_SVG = {
  soft: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="2" y="3" width="16" height="11" rx="2"/>
    <path d="M6 14v2M14 14v2M4 16h12"/>
    <path d="M7 8l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  hard: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="3" y="4" width="14" height="10" rx="1.5"/>
    <path d="M7 18h6M10 14v4" stroke-linecap="round"/>
    <circle cx="10" cy="9" r="2.5"/>
  </svg>`,
  net: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M10 15a1 1 0 100-2 1 1 0 000 2z" fill="currentColor" stroke="none"/>
    <path d="M6.5 12.5a5 5 0 017 0" stroke-linecap="round"/>
    <path d="M3.5 9.5a9 9 0 0113 0" stroke-linecap="round"/>
    <path d="M1 6.5a13 13 0 0118 0" stroke-linecap="round"/>
  </svg>`
};

// Icône SVG inline pour "mes tickets" (catégorie)
const CAT_MINI_SVG = {
  soft: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="2" width="14" height="9" rx="1.5"/><path d="M5 11v2M11 11v2M3 13h10"/><path d="M5.5 6.5l1.5 1.5 3-3" stroke-linecap="round"/></svg>`,
  hard: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="8" rx="1"/><path d="M5 14h6M8 11v3" stroke-linecap="round"/><circle cx="8" cy="7" r="2"/></svg>`,
  net:  `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="12" r="1" fill="currentColor" stroke="none"/><path d="M5 9.5a4 4 0 016 0" stroke-linecap="round"/><path d="M2.5 7a8 8 0 0111 0" stroke-linecap="round"/></svg>`
};

const CAT_LABELS  = { soft: 'Logiciel', hard: 'Matériel', net: 'Réseau' };
const URG_LABELS  = { high: 'Haute', medium: 'Normale', low: 'Basse' };
const STAT_LABELS = { open: 'En attente', in_progress: 'En cours', resolved: 'Résolu' };

document.addEventListener('DOMContentLoaded', async () => {
  initUserInfo();
  await Promise.all([loadPredefinedTickets(), loadMyTickets()]);
  initFilters();
  initManualForm();
  initLogout();
});

function initUserInfo() {
  const user = Auth.getUser();
  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-dept').textContent = user.department;
}

// ── Tickets prédéfinis ──────────────────────────────────────────────
async function loadPredefinedTickets() {
  try {
    const data = await API.ml.getPredefined();
    state.predefinedTickets = data.tickets;
    renderPredefined(state.predefinedTickets);
  } catch (err) {
    document.getElementById('predef-grid').innerHTML =
      `<p style="color:var(--text3);font-size:13px;grid-column:1/-1;padding:8px">
        Erreur de chargement : ${err.message}
      </p>`;
  }
}

function renderPredefined(tickets) {
  const grid = document.getElementById('predef-grid');
  if (!tickets.length) {
    grid.innerHTML = '<p style="color:var(--text3);font-size:13px;grid-column:1/-1">Aucun ticket dans cette catégorie.</p>';
    return;
  }
  grid.innerHTML = tickets.map(t => `
    <div class="predef-ticket-card" role="listitem" data-id="${t.id}" tabindex="0">
      <div class="ticket-cat-badge badge-${t.category}">
        ${CAT_SVG[t.category] || ''}
      </div>
      <p class="predef-ticket-title">${escapeHtml(t.title)}</p>
      <div class="predef-ticket-footer">
        <span class="urg-badge urg-${t.urgency}">
          <span class="urg-dot"></span>${URG_LABELS[t.urgency]}
        </span>
        <span class="send-hint">Cliquer pour envoyer</span>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.predef-ticket-card').forEach(card => {
    card.addEventListener('click', () => {
      const t = state.predefinedTickets.find(x => x.id === card.dataset.id);
      if (t) confirmSendPredefined(t);
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });
}

// ── Filtres catégorie ───────────────────────────────────────────────
function initFilters() {
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      state.currentCatFilter = cat;
      const filtered = cat === 'all' ? state.predefinedTickets : state.predefinedTickets.filter(t => t.category === cat);
      renderPredefined(filtered);
    });
  });
}

// ── Confirmation envoi prédéfini ────────────────────────────────────
function confirmSendPredefined(ticket) {
  showModal(
    'Confirmer l\'envoi',
    `<strong>${escapeHtml(ticket.title)}</strong><br><br>
     Catégorie : ${CAT_LABELS[ticket.category]} &nbsp;|&nbsp; Urgence : ${URG_LABELS[ticket.urgency]}
     <br><br>Ce ticket sera envoyé immédiatement à l'équipe IT.`,
    () => sendPredefined(ticket)
  );
}

async function sendPredefined(ticket) {
  try {
    await API.tickets.create({
      title: ticket.title,
      description: `Ticket prédéfini — ${CAT_LABELS[ticket.category]}`,
      category: ticket.category, urgency: ticket.urgency,
      isPredefined: true, predefinedId: ticket.id
    });
    showToast(`Ticket envoyé à l'équipe IT`);
    await loadMyTickets();
  } catch (err) { showToast(`Erreur : ${err.message}`, true); }
}

// ── Formulaire manuel + ML ──────────────────────────────────────────
function initManualForm() {
  const title = document.getElementById('ticket-title');
  const desc  = document.getElementById('ticket-desc');
  title.addEventListener('input', () => triggerML());
  desc.addEventListener('input',  () => triggerML());
  document.getElementById('manual-form').addEventListener('submit', async e => {
    e.preventDefault(); await submitManual();
  });
  const btnR = document.getElementById('btn-refresh-tickets');
  if (btnR) btnR.addEventListener('click', loadMyTickets);
}

function triggerML() {
  clearTimeout(state.mlTimer);
  const text = (document.getElementById('ticket-title').value + ' ' +
                document.getElementById('ticket-desc').value).trim();
  if (text.length < 4) { document.getElementById('ml-box').hidden = true; return; }
  state.mlTimer = setTimeout(async () => {
    try { renderML(await API.ml.analyze(text)); } catch {}
  }, 400);
}

function renderML(result) {
  const box  = document.getElementById('ml-box');
  const tags = document.getElementById('ml-suggestions');
  const conf = document.getElementById('ml-confidence');
  if (!result.predictions?.length) { box.hidden = true; return; }

  conf.textContent = `Confiance ${result.topConfidence}%`;
  tags.innerHTML = result.predictions.map((p, i) => `
    <button type="button" class="ml-tag${i === 0 ? ' top-match' : ''}" data-category="${p.category}">
      ${CAT_MINI_SVG[p.category] || ''} ${p.label}${i === 0 ? ` — ${p.confidence}%` : ''}
    </button>
  `).join('');

  tags.querySelectorAll('.ml-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      document.getElementById('ticket-category').value = tag.dataset.category;
      showToast(`Catégorie "${CAT_LABELS[tag.dataset.category]}" appliquée`);
    });
  });
  box.hidden = false;
}

async function submitManual() {
  const title    = document.getElementById('ticket-title').value.trim();
  const desc     = document.getElementById('ticket-desc').value.trim();
  const urgency  = document.getElementById('ticket-urgency').value;
  const category = document.getElementById('ticket-category').value;
  if (!title) { showToast('Le titre est obligatoire.', true); return; }

  const btn  = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.querySelector('.btn-text').hidden  = true;
  btn.querySelector('.btn-loader').hidden = false;
  try {
    await API.tickets.create({ title, description: desc, category, urgency, isPredefined: false });
    document.getElementById('manual-form').reset();
    document.getElementById('ml-box').hidden = true;
    showToast('Ticket créé et envoyé à l\'équipe IT');
    await loadMyTickets();
  } catch (err) { showToast(`Erreur : ${err.message}`, true);
  } finally {
    btn.disabled = false;
    btn.querySelector('.btn-text').hidden  = false;
    btn.querySelector('.btn-loader').hidden = true;
  }
}

// ── Mes tickets ─────────────────────────────────────────────────────
async function loadMyTickets() {
  const list  = document.getElementById('my-tickets-list');
  const empty = document.getElementById('tickets-empty');
  const badge = document.getElementById('my-count');
  try {
    const data = await API.tickets.list();
    state.myTickets = data.tickets;
    const active = data.tickets.filter(t => t.status !== 'resolved').length;
    if (badge) badge.textContent = active;
    if (!data.tickets.length) { if (empty) empty.hidden = false; return; }
    if (empty) empty.hidden = true;

    list.innerHTML = data.tickets.map(t => {
      const statClass = t.status === 'open' ? 's-open' : t.status === 'in_progress' ? 's-progress' : 's-resolved';
      return `
      <div class="my-ticket-row" role="listitem">
        <div class="status-indicator ${statClass}">
          <span class="s-dot"></span>
        </div>
        <div class="ticket-info">
          <h4>${escapeHtml(t.title)}</h4>
          <div class="ticket-meta">
            <span class="cat-label">${CAT_MINI_SVG[t.category] || ''} ${CAT_LABELS[t.category]}</span>
            &nbsp;·&nbsp; ${t.id} &nbsp;·&nbsp; ${formatDate(t.createdAt)}
          </div>
        </div>
        <span class="pill ${LABELS.statusPillClass[t.status]}">${STAT_LABELS[t.status]}</span>
      </div>`;
    }).join('');
  } catch (err) {
    list.innerHTML = `<p style="color:var(--text3);font-size:13px;padding:12px">Erreur : ${err.message}</p>`;
  }
}

// ── Logout ──────────────────────────────────────────────────────────
function initLogout() {
  document.getElementById('btn-logout').addEventListener('click', () => {
    Auth.clear(); window.location.href = '/';
  });
}

function escapeHtml(str) {
  const m = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'};
  return String(str||'').replace(/[&<>"']/g, c => m[c]);
}

// ══════════════════════════════════════════════════════════════════
//  BASE DE CONNAISSANCES — Recherche côté médecin
// ══════════════════════════════════════════════════════════════════
(function initKB() {
  const input   = document.getElementById('kb-input');
  const btn     = document.getElementById('kb-search-btn');
  const results = document.getElementById('kb-results');
  if (!input) return;

  // Debounce : recherche automatique après 400ms sans frappe
  let kbTimer;
  input.addEventListener('input', () => {
    clearTimeout(kbTimer);
    const q = input.value.trim();
    if (q.length < 3) { results.innerHTML = ''; return; }
    kbTimer = setTimeout(() => searchKB(q), 400);
  });

  btn.addEventListener('click', () => {
    const q = input.value.trim();
    if (q.length >= 3) searchKB(q);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); btn.click(); }
  });
})();

async function searchKB(query) {
  const results = document.getElementById('kb-results');
  results.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:8px 0">Recherche en cours...</div>';

  try {
    const data = await API.kb.search(query);

    if (!data.results || data.results.length === 0) {
      results.innerHTML = `
        <div class="kb-no-result">
          Aucune solution connue pour cette recherche.<br>
          <span style="color:var(--text3);font-size:11px">Créez un ticket ci-dessous — l'équipe IT va résoudre et documenter le problème.</span>
        </div>`;
      return;
    }

    const catLabels = { soft: 'Logiciel', hard: 'Matériel', net: 'Réseau' };

    results.innerHTML = data.results.map(entry => `
      <div class="kb-result-card" tabindex="0" role="article">
        <div class="kb-result-header">
          <div class="kb-result-title">${escapeHtml(entry.title)}</div>
          <span class="kb-score">Pertinence ${Math.round(entry.score * 100)}%</span>
        </div>
        <div class="kb-result-problem">${escapeHtml(entry.problem)}</div>
        <div class="kb-solution-box">
          <div class="kb-solution-label">Solution</div>
          <div class="kb-solution-text">${escapeHtml(entry.solution)}</div>
        </div>
        <div class="kb-result-footer">
          <span class="kb-meta">Catégorie : ${catLabels[entry.category] || entry.category}</span>
          <span class="kb-meta">·</span>
          <span class="kb-meta">Résolu <span class="kb-occ">${entry.occurrences}×</span></span>
          ${entry.avgResolutionMinutes
            ? `<span class="kb-meta">· Durée ~${entry.avgResolutionMinutes} min</span>`
            : ''}
          ${entry.solvedBy
            ? `<span class="kb-meta">· Par ${escapeHtml(entry.solvedBy)}</span>`
            : ''}
        </div>
      </div>
    `).join('');

  } catch (err) {
    results.innerHTML = `<div class="kb-no-result" style="color:var(--text3)">Erreur : ${err.message}</div>`;
  }
}
