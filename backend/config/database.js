// ╔══════════════════════════════════════════════════════════════════╗
// ║  config/database.js — Base de données en mémoire (simulation)    ║
// ║  En production : remplacer par MongoDB / PostgreSQL / MySQL       ║
// ╚══════════════════════════════════════════════════════════════════╝

const bcrypt = require('bcryptjs');

// ══════════════════════════════════════════════════════════════════
//  UTILISATEURS
//  Deux rôles possibles : 'doctor' (médecin) et 'it' (technicien IT)
// ══════════════════════════════════════════════════════════════════
const USERS = [
  {
    id: 'u1',
    name: 'Dr. Karim Bensalem',
    email: 'dr.karim@ehu-oran.dz',
    password: bcrypt.hashSync('med123', 10),  // mot de passe hashé
    role: 'doctor',
    department: 'Cardiologie',
    avatar: 'KB'
  },
  {
    id: 'u2',
    name: 'Dr. Amina Rahali',
    email: 'dr.amina@ehu-oran.dz',
    password: bcrypt.hashSync('med456', 10),
    role: 'doctor',
    department: 'Pédiatrie',
    avatar: 'AR'
  },
  {
    id: 'u3',
    name: 'Yacine Belkacem',
    email: 'it.support@ehu-oran.dz',
    password: bcrypt.hashSync('it123', 10),
    role: 'it',
    department: 'Support IT',
    avatar: 'YB'
  },
  {
    id: 'u4',
    name: 'Soraya Hamidi',
    email: 'soraya.it@ehu-oran.dz',
    password: bcrypt.hashSync('it456', 10),
    role: 'it',
    department: 'Support IT',
    avatar: 'SH'
  },
  {
    id: 'u5',
    name: 'Rachid Boudiaf',
    email: 'rachid.it@ehu-oran.dz',
    password: bcrypt.hashSync('it789', 10),
    role: 'it',
    department: 'Support IT',
    avatar: 'RB'
  }
];

// ══════════════════════════════════════════════════════════════════
//  TICKETS PRÉDÉFINIS
//  Organisés en 3 catégories : soft (logiciel), hard (matériel), net (réseau)
// ══════════════════════════════════════════════════════════════════
const PREDEFINED_TICKETS = [
  // ── LOGICIEL ─────────────────────────────────────────────────
  { id: 'p-s1', category: 'soft', title: "Impossible d'ouvrir le logiciel médical",   urgency: 'high',   keywords: ['logiciel','ouvrir','démarrer','lancer'] },
  { id: 'p-s2', category: 'soft', title: "Le logiciel se ferme automatiquement",       urgency: 'high',   keywords: ['ferme','crash','plante','quitte'] },
  { id: 'p-s3', category: 'soft', title: "Erreur lors de la connexion au logiciel",    urgency: 'medium', keywords: ['erreur','connexion','login','accès'] },
  { id: 'p-s4', category: 'soft', title: "Mise à jour du logiciel impossible",         urgency: 'low',    keywords: ['mise à jour','update','version'] },
  { id: 'p-s5', category: 'soft', title: "L'application est très lente",               urgency: 'medium', keywords: ['lent','lente','slow','performance'] },
  { id: 'p-s6', category: 'soft', title: "Problème d'accès au dossier patient",        urgency: 'high',   keywords: ['dossier','patient','accès','fichier'] },
  { id: 'p-s7', category: 'soft', title: "Mot de passe logiciel oublié",               urgency: 'medium', keywords: ['mot de passe','password','oublié','réinitialiser'] },

  // ── MATÉRIEL ─────────────────────────────────────────────────
  { id: 'p-h1', category: 'hard', title: "Imprimante en panne",                        urgency: 'medium', keywords: ['imprimante','imprimer','impression','printer'] },
  { id: 'p-h2', category: 'hard', title: "Ordinateur ne démarre pas",                  urgency: 'high',   keywords: ['démarre','démarrage','allumer','boot'] },
  { id: 'p-h3', category: 'hard', title: "Écran noir",                                 urgency: 'high',   keywords: ['écran','noir','display','moniteur'] },
  { id: 'p-h4', category: 'hard', title: "Clavier ou souris ne fonctionne pas",        urgency: 'low',    keywords: ['clavier','souris','keyboard','mouse'] },
  { id: 'p-h5', category: 'hard', title: "Scanner ne fonctionne pas",                  urgency: 'medium', keywords: ['scanner','scan','numériser'] },
  { id: 'p-h6', category: 'hard', title: "Problème avec lecteur carte vitale",          urgency: 'medium', keywords: ['carte','vitale','lecteur','carte vitale'] },
  { id: 'p-h7', category: 'hard', title: "Ordinateur très lent",                       urgency: 'low',    keywords: ['ordinateur','lent','pc','performance'] },

  // ── RÉSEAU / INTERNET ─────────────────────────────────────────
  { id: 'p-n1', category: 'net',  title: "Pas de connexion Internet",                  urgency: 'high',   keywords: ['internet','connexion','réseau','web'] },
  { id: 'p-n2', category: 'net',  title: "Wi-Fi ne fonctionne pas",                    urgency: 'high',   keywords: ['wifi','wi-fi','sans fil','réseau'] },
  { id: 'p-n3', category: 'net',  title: "Connexion très lente",                       urgency: 'medium', keywords: ['lente','lent','débit','speed'] },
  { id: 'p-n4', category: 'net',  title: "Impossible d'accéder au serveur",             urgency: 'high',   keywords: ['serveur','server','accès','distant'] },
  { id: 'p-n5', category: 'net',  title: "Impossible d'envoyer des emails",             urgency: 'medium', keywords: ['email','mail','messagerie','envoyer'] },
  { id: 'p-n6', category: 'net',  title: "Déconnexion fréquente du réseau",             urgency: 'medium', keywords: ['déconnexion','coupure','instable','réseau'] },
];

// ══════════════════════════════════════════════════════════════════
//  TICKETS INITIAUX (données de démonstration)
// ══════════════════════════════════════════════════════════════════
let tickets = [
  {
    id: 'TK-001',
    title: "Impossible d'ouvrir le logiciel médical",
    description: "Depuis ce matin, le logiciel HIS refuse de s'ouvrir. Message d'erreur : code 0x80070002",
    category: 'soft',
    urgency: 'high',
    status: 'open',
    isPredefined: true,
    predefinedId: 'p-s1',
    createdBy: { id: 'u1', name: 'Dr. Karim Bensalem', department: 'Cardiologie' },
    assignedTo: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),   // il y a 1h
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    history: []
  },
  {
    id: 'TK-002',
    title: "Ordinateur ne démarre pas",
    description: "Le PC du bureau 3B ne s'allume plus depuis hier soir.",
    category: 'hard',
    urgency: 'high',
    status: 'in_progress',
    isPredefined: true,
    predefinedId: 'p-h2',
    createdBy: { id: 'u2', name: 'Dr. Amina Rahali', department: 'Pédiatrie' },
    assignedTo: { id: 'u3', name: 'Yacine Belkacem' },
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 5400000).toISOString(),
    history: [{ action: 'Pris en charge', by: 'Yacine Belkacem', at: new Date(Date.now()-5400000).toISOString() }]
  },
  {
    id: 'TK-003',
    title: "Wi-Fi ne fonctionne pas",
    description: "Aucun appareil ne peut se connecter au Wi-Fi dans l'aile Est.",
    category: 'net',
    urgency: 'high',
    status: 'open',
    isPredefined: true,
    predefinedId: 'p-n2',
    createdBy: { id: 'u2', name: 'Dr. Amina Rahali', department: 'Pédiatrie' },
    assignedTo: null,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    history: []
  },
  {
    id: 'TK-004',
    title: "Mise à jour impossible",
    description: "La mise à jour automatique échoue avec code erreur 404.",
    category: 'soft',
    urgency: 'low',
    status: 'resolved',
    isPredefined: true,
    predefinedId: 'p-s4',
    createdBy: { id: 'u1', name: 'Dr. Karim Bensalem', department: 'Cardiologie' },
    assignedTo: { id: 'u4', name: 'Soraya Hamidi' },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
    history: [
      { action: 'Pris en charge', by: 'Soraya Hamidi', at: new Date(Date.now()-80000000).toISOString() },
      { action: 'Résolu', by: 'Soraya Hamidi', at: new Date(Date.now()-43200000).toISOString() }
    ]
  },
  {
    id: 'TK-005',
    title: "Imprimante en panne — Service Accueil",
    description: "L'imprimante HP LaserJet de l'accueil affiche une erreur papier alors que le bac est plein.",
    category: 'hard',
    urgency: 'medium',
    status: 'in_progress',
    isPredefined: false,
    createdBy: { id: 'u2', name: 'Dr. Amina Rahali', department: 'Pédiatrie' },
    assignedTo: { id: 'u5', name: 'Rachid Boudiaf' },
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    updatedAt: new Date(Date.now() - 3000000).toISOString(),
    history: [{ action: 'Pris en charge', by: 'Rachid Boudiaf', at: new Date(Date.now()-3000000).toISOString() }]
  }
];

// Compteur pour générer les IDs de tickets
let ticketCounter = 6;

// ══════════════════════════════════════════════════════════════════
//  FONCTIONS UTILITAIRES D'ACCÈS AUX DONNÉES
// ══════════════════════════════════════════════════════════════════

/** Retourne tous les utilisateurs (sans les mots de passe) */
const getUsers = () => USERS.map(u => ({ ...u, password: undefined }));

/** Cherche un utilisateur par email (avec le mot de passe pour vérification) */
const getUserByEmail = (email) => USERS.find(u => u.email === email.toLowerCase());

/** Retourne un utilisateur par son ID */
const getUserById = (id) => USERS.find(u => u.id === id);

/** Retourne tous les tickets IT (optionnellement filtrés) */
const getTickets = (filters = {}) => {
  let result = [...tickets];

  if (filters.status)   result = result.filter(t => t.status === filters.status);
  if (filters.category) result = result.filter(t => t.category === filters.category);
  if (filters.urgency)  result = result.filter(t => t.urgency === filters.urgency);
  if (filters.userId)   result = result.filter(t => t.createdBy.id === filters.userId);

  // Tri : haute urgence + plus récent en premier
  return result.sort((a, b) => {
    const urgOrder = { high: 0, medium: 1, low: 2 };
    if (urgOrder[a.urgency] !== urgOrder[b.urgency])
      return urgOrder[a.urgency] - urgOrder[b.urgency];
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
};

/** Retourne un ticket par son ID */
const getTicketById = (id) => tickets.find(t => t.id === id);

/** Crée un nouveau ticket et l'ajoute à la liste */
const createTicket = (data) => {
  const id = `TK-${String(ticketCounter++).padStart(3, '0')}`;
  const ticket = {
    id,
    title:        data.title,
    description:  data.description || '',
    category:     data.category    || 'soft',
    urgency:      data.urgency     || 'medium',
    status:       'open',
    isPredefined: data.isPredefined || false,
    predefinedId: data.predefinedId || null,
    createdBy:    data.createdBy,
    assignedTo:   null,
    createdAt:    new Date().toISOString(),
    updatedAt:    new Date().toISOString(),
    history:      []
  };
  tickets.unshift(ticket);  // ajouter en tête de liste
  return ticket;
};

/** Met à jour le statut d'un ticket et enregistre l'historique */
const updateTicketStatus = (id, newStatus, assignedTo) => {
  const ticket = tickets.find(t => t.id === id);
  if (!ticket) return null;

  const actionMap = {
    'in_progress': 'Pris en charge',
    'resolved':    'Résolu',
    'open':        'Réouvert'
  };

  ticket.status    = newStatus;
  ticket.updatedAt = new Date().toISOString();

  if (assignedTo) ticket.assignedTo = assignedTo;

  ticket.history.push({
    action: actionMap[newStatus] || newStatus,
    by:     assignedTo ? assignedTo.name : 'Système',
    at:     new Date().toISOString()
  });

  return ticket;
};

/** Statistiques pour le dashboard IT */
const getStats = () => {
  const all       = tickets;
  const open      = all.filter(t => t.status === 'open').length;
  const progress  = all.filter(t => t.status === 'in_progress').length;
  const resolved  = all.filter(t => t.status === 'resolved').length;
  const highPrio  = all.filter(t => t.urgency === 'high' && t.status !== 'resolved').length;

  // Catégorie la plus fréquente
  const catCount  = { soft: 0, hard: 0, net: 0 };
  all.forEach(t => { if (catCount[t.category] !== undefined) catCount[t.category]++; });
  const topCat    = Object.entries(catCount).sort((a,b) => b[1]-a[1])[0];

  return {
    total:      all.length,
    open,
    in_progress: progress,
    resolved,
    highPriority: highPrio,
    topCategory: topCat ? topCat[0] : 'soft',
    topCategoryCount: topCat ? topCat[1] : 0
  };
};

module.exports = {
  USERS,
  PREDEFINED_TICKETS,
  getUsers,
  getUserByEmail,
  getUserById,
  getTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  getStats
};