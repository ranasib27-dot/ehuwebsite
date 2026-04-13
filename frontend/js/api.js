// ╔══════════════════════════════════════════════════════════════════╗
// ║  js/api.js — Client API centralisé                               ║
// ║  Toutes les communications avec le backend Express passent ici   ║
// ╚══════════════════════════════════════════════════════════════════╝

// URL de base du backend — changer si déployé sur un serveur distant
const API_BASE = 'http://localhost:3000/api';

// ══════════════════════════════════════════════════════════════════
//  GESTION DU TOKEN JWT (stocké dans localStorage)
// ══════════════════════════════════════════════════════════════════

const Auth = {
  /** Sauvegarde le token et les infos utilisateur */
  save(token, user) {
    localStorage.setItem('ehu_token', token);
    localStorage.setItem('ehu_user', JSON.stringify(user));
  },

  /** Retourne le token stocké */
  getToken() {
    return localStorage.getItem('ehu_token');
  },

  /** Retourne l'utilisateur connecté */
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('ehu_user'));
    } catch {
      return null;
    }
  },

  /** Efface la session */
  clear() {
    localStorage.removeItem('ehu_token');
    localStorage.removeItem('ehu_user');
  },

  /** Vérifie si l'utilisateur est connecté */
  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  }
};

// ══════════════════════════════════════════════════════════════════
//  FONCTION FETCH CENTRALE
//  Gère automatiquement : headers, token JWT, erreurs HTTP
// ══════════════════════════════════════════════════════════════════

/**
 * Effectue une requête vers le backend
 * @param {string} endpoint - ex: '/tickets', '/auth/login'
 * @param {object} options  - méthode, body, etc.
 * @returns {Promise<any>}  - données JSON ou lance une erreur
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  // Construction des headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Ajouter le token JWT si disponible
  const token = Auth.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Options complètes de la requête
  const config = {
    method:  options.method  || 'GET',
    headers,
    body:    options.body ? JSON.stringify(options.body) : undefined
  };

  try {
    const response = await fetch(url, config);

    // Lire le corps JSON même en cas d'erreur HTTP
    const data = await response.json().catch(() => ({}));

    // Si le token est expiré ou invalide → déconnexion automatique
    if (response.status === 401) {
      Auth.clear();
      window.location.href = '/index.html';
      return;
    }

    // Si la réponse HTTP est une erreur
    if (!response.ok) {
      throw new Error(data.error || `Erreur ${response.status}`);
    }

    return data;

  } catch (err) {
    // Erreur réseau (serveur éteint, pas de connexion)
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error('Impossible de joindre le serveur. Vérifiez que le backend est démarré (npm run dev).');
    }
    throw err;
  }
}

// ══════════════════════════════════════════════════════════════════
//  API MODULES — Endpoints organisés par domaine
// ══════════════════════════════════════════════════════════════════

const API = {

  // ── Authentification ─────────────────────────────────────────
  auth: {
    /** POST /api/auth/login */
    async login(email, password) {
      return apiRequest('/auth/login', {
        method: 'POST',
        body:   { email, password }
      });
    },

    /** GET /api/auth/me — infos utilisateur connecté */
    async me() {
      return apiRequest('/auth/me');
    }
  },

  // ── Tickets ──────────────────────────────────────────────────
  tickets: {
    /**
     * GET /api/tickets — liste des tickets
     * @param {object} filters - { status, category, urgency }
     */
    async list(filters = {}) {
      const params = new URLSearchParams(filters).toString();
      return apiRequest(`/tickets${params ? '?' + params : ''}`);
    },

    /** GET /api/tickets/stats — stats pour dashboard IT */
    async stats() {
      return apiRequest('/tickets/stats');
    },

    /** GET /api/tickets/:id — détail d'un ticket */
    async get(id) {
      return apiRequest(`/tickets/${id}`);
    },

    /**
     * POST /api/tickets — créer un ticket
     * @param {object} data - { title, description, category, urgency, isPredefined?, predefinedId? }
     */
    async create(data) {
      return apiRequest('/tickets', {
        method: 'POST',
        body:   data
      });
    },

    /**
     * PATCH /api/tickets/:id/status — changer statut (IT uniquement)
     * @param {string} id     - ID du ticket (ex: 'TK-001')
     * @param {string} status - 'open' | 'in_progress' | 'resolved'
     */
    async updateStatus(id, status) {
      return apiRequest(`/tickets/${id}/status`, {
        method: 'PATCH',
        body:   { status }
      });
    }
  },

  // ── ML / Intelligence Artificielle ───────────────────────────
  ml: {
    /**
     * GET /api/ml/predefined — tickets prédéfinis
     * @param {string} category - optionnel : 'soft' | 'hard' | 'net'
     */
    async getPredefined(category = '') {
      const params = category ? `?category=${category}` : '';
      return apiRequest(`/ml/predefined${params}`);
    },

    /**
     * GET /api/ml/analyze?text=... — analyse IA d'un texte
     * @param {string} text - texte à analyser
     */
    async analyze(text) {
      return apiRequest(`/ml/analyze?text=${encodeURIComponent(text)}`);
    },

    /** GET /api/ml/insights — données IA pour dashboard IT */
    async insights() {
      return apiRequest('/ml/insights');
    }
  },

  // ── Utilisateurs / Équipe ─────────────────────────────────────
  users: {
    /** GET /api/users/team — membres équipe IT avec charge */
    async team() {
      return apiRequest('/users/team');
    }
  }
};

// ══════════════════════════════════════════════════════════════════
//  UTILITAIRES UI (partagés par toutes les pages)
// ══════════════════════════════════════════════════════════════════

/**
 * Affiche une notification toast (bas de page)
 * @param {string} message  - texte à afficher
 * @param {boolean} isError - true = rouge, false = vert
 * @param {number} duration - durée en ms (défaut: 3500)
 */
function showToast(message, isError = false, duration = 3500) {
  const toast   = document.getElementById('toast');
  const msg     = document.getElementById('toast-msg');
  const icon    = document.getElementById('toast-icon');
  if (!toast) return;

  msg.textContent    = message;
  icon.textContent   = isError ? '✕' : '✓';
  toast.className    = `toast${isError ? ' toast-error' : ''}`;
  toast.setAttribute('aria-hidden', 'false');

  // Effacer le timer précédent
  if (window._toastTimer) clearTimeout(window._toastTimer);

  window._toastTimer = setTimeout(() => {
    toast.setAttribute('aria-hidden', 'true');
  }, duration);
}

/**
 * Affiche une modal de confirmation
 * @param {string}   title    - titre de la modal
 * @param {string}   body     - HTML du contenu
 * @param {Function} onConfirm - callback au clic "Confirmer"
 */
function showModal(title, body, onConfirm) {
  const modal   = document.getElementById('modal');
  const mTitle  = document.getElementById('modal-title');
  const mBody   = document.getElementById('modal-body');
  const mConfirm = document.getElementById('modal-confirm');
  const mCancel  = document.getElementById('modal-cancel');
  if (!modal) return;

  mTitle.textContent = title;
  mBody.innerHTML    = body;
  modal.hidden       = false;

  // Remplacer le listener (clone pour éviter les doublons)
  const newConfirm = mConfirm.cloneNode(true);
  mConfirm.replaceWith(newConfirm);
  newConfirm.addEventListener('click', () => {
    modal.hidden = true;
    onConfirm();
  });

  mCancel.onclick = () => { modal.hidden = true; };
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.hidden = true;
  }, { once: true });
}

/** Labels lisibles */
const LABELS = {
  urgency: { high: '🔴 Haute', medium: '🟡 Normale', low: '🟢 Basse' },
  status:  { open: 'En attente', in_progress: 'En cours', resolved: 'Résolu' },
  category:{ soft: '💻 Logiciel', hard: '🖥️ Matériel', net: '📶 Réseau' },
  urgencySimple: { high: 'Haute', medium: 'Normale', low: 'Basse' },
  statusPillClass: { open: 'pill-open', in_progress: 'pill-progress', resolved: 'pill-resolved' },
  urgencyPillClass: { high: 'pill-high', medium: 'pill-medium', low: 'pill-low' }
};

/** Formate une date ISO en string lisible */
function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const now = new Date();
  const diffMin = Math.round((now - d) / 60000);

  if (diffMin < 1)   return 'à l\'instant';
  if (diffMin < 60)  return `il y a ${diffMin} min`;
  if (diffMin < 1440) {
    const h = Math.round(diffMin / 60);
    return `il y a ${h}h`;
  }
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

// ── Base de Connaissances ─────────────────────────────────────────
API.kb = {
  /** GET /api/kb/search?q=<texte> — chercher une solution */
  async search(query) {
    return apiRequest(`/kb/search?q=${encodeURIComponent(query)}`);
  },

  /** GET /api/kb — liste complète (IT uniquement) */
  async list() {
    return apiRequest('/kb');
  },

  /** POST /api/kb/from-ticket — ajouter depuis un ticket résolu */
  async addFromTicket(data) {
    return apiRequest('/kb/from-ticket', { method: 'POST', body: data });
  },

  /** DELETE /api/kb/:id — supprimer une entrée */
  async delete(id) {
    return apiRequest(`/kb/${id}`, { method: 'DELETE' });
  }
};