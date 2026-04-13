// ╔══════════════════════════════════════════════════════════════════╗
// ║  js/it.js — Logique Dashboard IT                                 ║
// ║  Stats, liste tickets, filtres, changement statut, équipe, ML    ║
// ╚══════════════════════════════════════════════════════════════════╝

(function guardRoute() {
  if (!Auth.isLoggedIn()) { window.location.href = '/'; return; }
  if (Auth.getUser().role !== 'it') window.location.href = '/pages/doctor.html';
})();

const state = {
  allTickets: [], currentFilter: 'all', searchQuery: '', refreshTimer: null
};

document.addEventListener('DOMContentLoaded', async () => {
  initUserInfo(); initLogout(); initFilters(); initSearch(); initRefreshBtn();
  await Promise.all([loadTickets(), loadStats(), loadTeam(), loadMlInsights()]);
  state.refreshTimer = setInterval(async () => {
    await Promise.all([loadTickets(), loadStats()]);
  }, 30000);
});

function initUserInfo() {
  const el = document.getElementById('user-name');
  if (el) el.textContent = Auth.getUser().name;
}

async function loadTickets() {
  try {
    const data = await API.tickets.list();
    state.allTickets = data.tickets;
    renderTickets();
  } catch (err) {
    document.getElementById('tickets-list').innerHTML =
      `<div class="loading-state">Erreur : ${err.message}</div>`;
  }
}

function renderTickets() {
  const list = document.getElementById('tickets-list');
  let filtered = state.currentFilter === 'all'
    ? state.allTickets
    : state.allTickets.filter(t => t.status === state.currentFilter);

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) ||
      t.createdBy.name.toLowerCase().includes(q) ||
      t.createdBy.department.toLowerCase().includes(q)
    );
  }

  const openCount = state.allTickets.filter(t => t.status === 'open').length;
  const pendingEl = document.getElementById('pending-count');
  if (pendingEl) pendingEl.textContent = openCount;

  if (filtered.length === 0) {
    list.innerHTML = `<div class="loading-state">Aucun ticket trouvé.</div>`;
    return;
  }

  list.innerHTML = filtered.map(t => buildTicketRow(t)).join('');

  list.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await changeTicketStatus(btn.dataset.ticketId, btn.dataset.nextStatus);
    });
  });
}

function buildTicketRow(ticket) {
  const catSVG = {
    soft: '<svg class="ticket-cat-svg cat-soft-color" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="2" width="14" height="9" rx="1.5"/><path d="M5 11v2M11 11v2M3 13h10"/><path d="M5.5 6.5l1.5 1.5 3-3" stroke-linecap="round"/></svg>',
    hard: '<svg class="ticket-cat-svg cat-hard-color" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="8" rx="1"/><path d="M5 14h6M8 11v3" stroke-linecap="round"/><circle cx="8" cy="7" r="2"/></svg>',
    net:  '<svg class="ticket-cat-svg cat-net-color"  viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="12" r="1" fill="currentColor" stroke="none"/><path d="M5 9.5a4 4 0 016 0" stroke-linecap="round"/><path d="M2.5 7a8 8 0 0111 0" stroke-linecap="round"/></svg>'
  };
  const icon = catSVG[ticket.category] || '';

  let actionBtn = '';
  if (ticket.status === 'open') {
    actionBtn = `<button class="action-btn take-charge" data-ticket-id="${ticket.id}" data-next-status="in_progress">Prendre en charge</button>`;
  } else if (ticket.status === 'in_progress') {
    actionBtn = `<button class="action-btn resolve" data-ticket-id="${ticket.id}" data-next-status="resolved">✓ Résoudre</button>`;
  } else {
    actionBtn = `<span class="resolved-mark">✓ Résolu</span>`;
  }

  return `
    <div class="it-ticket-row" role="listitem">
      <span class="ticket-id-badge">${ticket.id}</span>
      <div class="ticket-main">
        <h4>${icon}${escapeHtml(ticket.title)}</h4>
        <div class="ticket-sub">
          ${escapeHtml(ticket.createdBy.name)} · ${escapeHtml(ticket.createdBy.department)} · ${formatDate(ticket.createdAt)}
          ${ticket.assignedTo ? ` · 👤 ${escapeHtml(ticket.assignedTo.name)}` : ''}
        </div>
      </div>
      <span class="pill ${LABELS.urgencyPillClass[ticket.urgency]}">${LABELS.urgencySimple[ticket.urgency]}</span>
      <span class="pill ${LABELS.statusPillClass[ticket.status]}">${LABELS.status[ticket.status]}</span>
      ${actionBtn}
    </div>`;
}

async function changeTicketStatus(ticketId, newStatus) {
  const labels = { 'in_progress': 'pris en charge', 'resolved': 'marqué résolu' };
  try {
    await API.tickets.updateStatus(ticketId, newStatus);
    showToast(`Ticket ${ticketId} ${labels[newStatus] || newStatus} ✓`);
    await Promise.all([loadTickets(), loadStats()]);
  } catch (err) {
    showToast(`Erreur : ${err.message}`, true);
  }
}

async function loadStats() {
  try {
    const s = await API.tickets.stats();
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('stat-total', s.total); set('stat-open', s.open);
    set('stat-progress', s.in_progress); set('stat-resolved', s.resolved);
    set('stat-high', `${s.highPriority} haute priorité`);
    set('pending-count', s.open);
  } catch {}
}

async function loadTeam() {
  const el = document.getElementById('team-list');
  if (!el) return;
  try {
    const data = await API.users.team();
    const colors = ['av-gold','av-teal','av-blue','av-red'];
    el.innerHTML = data.team.map((m, i) => `
      <div class="team-member-row">
        <div class="avatar ${colors[i % colors.length]}">${m.avatar}</div>
        <div class="member-info">
          <div class="member-name">${escapeHtml(m.name)}</div>
          <div class="member-load-txt">${m.activeTickets} ticket${m.activeTickets !== 1 ? 's' : ''} actif${m.activeTickets !== 1 ? 's' : ''}</div>
          <div class="load-bar-track">
            <div class="load-bar-fill fill-${m.loadStatus}" style="width:${m.loadPercent}%"></div>
          </div>
        </div>
      </div>`).join('');
  } catch { el.innerHTML = '<div class="loading-state small">Données indisponibles</div>'; }
}

async function loadMlInsights() {
  const el = document.getElementById('ml-insights');
  if (!el) return;
  try {
    const d = await API.ml.insights();
    el.innerHTML = `
      <div class="ml-insight-row"><span class="ml-ins-label">Catégorie dominante</span><span class="ml-ins-val">${LABELS.category[d.topCategory]||d.topCategory}</span></div>
      <div class="ml-insight-row"><span class="ml-ins-label">Heure de pointe</span><span class="ml-ins-val">${d.peakHour}</span></div>
      <div class="ml-insight-row"><span class="ml-ins-label">Temps moyen résolution</span><span class="ml-ins-val">${d.avgResolutionTime}</span></div>
      <div class="ml-insight-row"><span class="ml-ins-label">Taux de satisfaction</span><span class="ml-ins-val">${d.satisfactionRate}</span></div>
      <div class="ml-insight-row"><span class="ml-ins-label">Prévision demain</span><span class="ml-ins-val">${d.tomorrowPrediction} tickets</span></div>`;

    const dist = d.categoryDistribution;
    const setBar = (barId, pctId, pct) => {
      const b = document.getElementById(barId); const p = document.getElementById(pctId);
      if (b) b.style.width = pct + '%'; if (p) p.textContent = pct + '%';
    };
    setBar('cat-soft-bar','cat-soft-pct', dist.soft);
    setBar('cat-hard-bar','cat-hard-pct', dist.hard);
    setBar('cat-net-bar', 'cat-net-pct',  dist.net);
  } catch { el.innerHTML = '<div class="loading-state small">Analyse indisponible</div>'; }
}

function initFilters() {
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.currentFilter = tab.dataset.filter;
      renderTickets();
    });
  });
}

function initSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.searchQuery = input.value.trim(); renderTickets(); }, 250);
  });
}

function initRefreshBtn() {
  const btn = document.getElementById('btn-refresh');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    btn.textContent = '↻ ...';
    await Promise.all([loadTickets(), loadStats()]);
    btn.textContent = '↻';
    showToast('Données actualisées');
  });
}

function initLogout() {
  const btn = document.getElementById('btn-logout');
  if (btn) btn.addEventListener('click', () => {
    clearInterval(state.refreshTimer);
    Auth.clear();
    window.location.href = '/';
  });
}

function escapeHtml(str) {
  const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'};
  return String(str||'').replace(/[&<>"']/g, c => map[c]);
}

// ══════════════════════════════════════════════════════════════════
//  MODAL DE RÉSOLUTION — Technicien entre la solution → KB enrichie
// ══════════════════════════════════════════════════════════════════

// Remplacer le changement de statut "resolved" par une modal avec champ solution
const _origChangeStatus = changeTicketStatus;

async function changeTicketStatus(ticketId, newStatus) {
  if (newStatus !== 'resolved') {
    return _origChangeStatus(ticketId, newStatus);
  }
  // Pour "résolu" → afficher une modal pour saisir la solution
  showResolutionModal(ticketId);
}

function showResolutionModal(ticketId) {
  const ticket = state.allTickets.find(t => t.id === ticketId);
  if (!ticket) return;

  const modal   = document.getElementById('resolution-modal');
  const overlay = document.getElementById('resolution-overlay');
  if (!overlay) {
    // Créer la modal dynamiquement si elle n'existe pas
    const div = document.createElement('div');
    div.id = 'resolution-overlay';
    div.style.cssText = 'position:fixed;inset:0;background:rgba(5,13,26,0.88);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s ease';
    div.innerHTML = `
      <div style="background:var(--navy2);border:1px solid var(--border2);border-radius:14px;padding:28px;max-width:480px;width:100%;box-shadow:0 32px 80px rgba(0,0,0,0.6)">
        <h3 style="font-family:'Playfair Display',serif;font-size:18px;color:var(--gold);margin-bottom:6px">Résoudre le ticket</h3>
        <p id="res-ticket-title" style="font-size:13px;color:var(--text2);margin-bottom:18px"></p>

        <div class="kb-save-note">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="10" cy="10" r="7"/>
            <path d="M10 9v4M10 7h.01" stroke-linecap="round"/>
          </svg>
          La solution sera automatiquement ajoutée à la base de connaissances pour les futurs problèmes similaires.
        </div>

        <label class="form-label" style="font-size:12px;color:var(--text2);margin-bottom:6px;display:block;font-weight:500">
          Solution appliquée *
        </label>
        <textarea id="res-solution" class="resolution-textarea"
          placeholder="Décrivez comment vous avez résolu ce problème (étapes, commandes, manipulations)..."></textarea>

        <label class="form-label" style="font-size:12px;color:var(--text2);margin-bottom:6px;display:block;font-weight:500">
          Durée de résolution (minutes)
        </label>
        <input id="res-duration" type="number" min="1" max="480" placeholder="ex: 15"
          style="width:120px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:13px;outline:none;margin-bottom:18px"/>

        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button id="res-cancel" style="background:transparent;border:1px solid var(--border);border-radius:8px;padding:9px 18px;color:var(--text2);font-family:inherit;font-size:13px;cursor:pointer">Annuler</button>
          <button id="res-confirm" style="background:linear-gradient(135deg,var(--teal),#158476);border:none;border-radius:8px;padding:9px 20px;color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer">Résoudre et sauvegarder</button>
        </div>
      </div>`;
    document.body.appendChild(div);
  }

  const overlayEl = document.getElementById('resolution-overlay');
  overlayEl.style.display = 'flex';
  document.getElementById('res-ticket-title').textContent = `${ticket.id} — ${ticket.title}`;
  document.getElementById('res-solution').value = '';
  document.getElementById('res-duration').value = '';

  document.getElementById('res-cancel').onclick = () => {
    overlayEl.style.display = 'none';
  };

  document.getElementById('res-confirm').onclick = async () => {
    const solution  = document.getElementById('res-solution').value.trim();
    const duration  = parseInt(document.getElementById('res-duration').value) || null;

    if (!solution) {
      document.getElementById('res-solution').style.borderColor = 'var(--red)';
      return;
    }

    const btn = document.getElementById('res-confirm');
    btn.textContent = 'Sauvegarde...';
    btn.disabled = true;

    try {
      // 1) Résoudre le ticket
      await API.tickets.updateStatus(ticket.id, 'resolved');

      // 2) Ajouter à la base de connaissances
      await API.kb.addFromTicket({
        ticketId:            ticket.id,
        title:               ticket.title,
        problem:             ticket.description || ticket.title,
        solution,
        category:            ticket.category,
        urgency:             ticket.urgency,
        resolutionMinutes:   duration
      });

      overlayEl.style.display = 'none';
      showToast(`✓ Ticket résolu + solution sauvegardée dans la KB`);
      await Promise.all([loadTickets(), loadStats()]);

    } catch (err) {
      showToast(`Erreur : ${err.message}`, true);
    } finally {
      btn.textContent = 'Résoudre et sauvegarder';
      btn.disabled = false;
    }
  };

  // Fermer en cliquant l'overlay
  overlayEl.addEventListener('click', e => {
    if (e.target === overlayEl) overlayEl.style.display = 'none';
  }, { once: false });
}


