// ╔══════════════════════════════════════════════════════════════════╗
// ║  routes/kb.js — Base de Connaissances auto-générée               ║
// ║  Chaque ticket résolu enrichit une FAQ consultable               ║
// ╚══════════════════════════════════════════════════════════════════╝

const express = require('express');
const router  = express.Router();
const { roleMiddleware } = require('../middleware/auth');

// ══════════════════════════════════════════════════════════════════
//  STOCKAGE EN MÉMOIRE (remplacer par MongoDB en production)
//  Structure d'une entrée KB :
//  {
//    id, title, problem, solution, category, urgency,
//    keywords[], occurrences, lastSeen, solvedBy, ticketIds[]
//  }
// ══════════════════════════════════════════════════════════════════
let knowledgeBase = [
  // Quelques entrées de démonstration
  {
    id: 'kb-001',
    title: 'Mot de passe logiciel oublié',
    problem: 'Le médecin ne peut plus se connecter au logiciel HIS après un changement de mot de passe.',
    solution: 'Aller dans Paramètres → Gestion des utilisateurs → Réinitialiser le mot de passe. Le nouveau mot de passe temporaire est envoyé par email institutionnel. Délai : 5 minutes.',
    category: 'soft',
    urgency: 'medium',
    keywords: ['mot de passe', 'password', 'connexion', 'oublié', 'his', 'logiciel'],
    occurrences: 8,
    lastSeen: new Date(Date.now() - 86400000).toISOString(),
    solvedBy: 'Yacine Belkacem',
    avgResolutionMinutes: 10,
    ticketIds: ['TK-004', 'TK-007']
  },
  {
    id: 'kb-002',
    title: 'Imprimante hors ligne',
    problem: "L'imprimante apparaît comme hors ligne dans Windows alors qu'elle est allumée.",
    solution: "1) Vérifier le câble USB ou réseau. 2) Dans Périphériques et imprimantes, clic droit → Voir ce qui s'imprime → Imprimante → Décocher 'Utiliser l'imprimante hors connexion'. 3) Si persistant : redémarrer le spouleur d'impression (services.msc → Print Spooler → Redémarrer).",
    category: 'hard',
    urgency: 'medium',
    keywords: ['imprimante', 'hors ligne', 'offline', 'imprimer', 'spouleur'],
    occurrences: 12,
    lastSeen: new Date(Date.now() - 3600000).toISOString(),
    solvedBy: 'Rachid Boudiaf',
    avgResolutionMinutes: 15,
    ticketIds: ['TK-011']
  },
  {
    id: 'kb-003',
    title: 'Pas de connexion Wi-Fi',
    problem: "L'appareil ne détecte plus le réseau Wi-Fi de l'hôpital (EHU-Oran-Secure).",
    solution: "1) Oublier le réseau et se reconnecter. 2) Vérifier que le service Wi-Fi Windows est actif (ncpa.cpl). 3) Si échec : ipconfig /release puis ipconfig /renew dans cmd. 4) En dernier recours : désinstaller et réinstaller le pilote Wi-Fi depuis le Gestionnaire de périphériques.",
    category: 'net',
    urgency: 'high',
    keywords: ['wifi', 'wi-fi', 'réseau', 'connexion', 'internet', 'ehu-oran'],
    occurrences: 15,
    lastSeen: new Date().toISOString(),
    solvedBy: 'Yacine Belkacem',
    avgResolutionMinutes: 20,
    ticketIds: ['TK-003', 'TK-012']
  }
];

let kbCounter = 4;

// ══════════════════════════════════════════════════════════════════
//  ALGORITHME DE SIMILARITÉ — Jaccard sur les mots
//  Léger, rapide, zéro dépendance externe
// ══════════════════════════════════════════════════════════════════

// Normaliser un texte : minuscules, sans accents, sans ponctuation
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // supprimer accents
    .replace(/[^a-z0-9\s]/g, ' ')                       // supprimer ponctuation
    .split(/\s+/)
    .filter(w => w.length > 2);                          // mots > 2 lettres
}

// Similarité de Jaccard entre deux sets de mots
// Score entre 0 (rien en commun) et 1 (identique)
function jaccardSimilarity(wordsA, wordsB) {
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  const intersection = [...setA].filter(w => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

// Rechercher les entrées KB similaires à une requête
function searchKB(query, topK = 5) {
  const queryWords = normalize(query);
  if (queryWords.length === 0) return [];

  return knowledgeBase
    .map(entry => {
      // Combiner tous les champs textuels pour la comparaison
      const entryText = [
        entry.title, entry.problem, entry.solution,
        ...entry.keywords
      ].join(' ');
      const entryWords = normalize(entryText);
      const score = jaccardSimilarity(queryWords, entryWords);
      return { ...entry, score };
    })
    .filter(e => e.score > 0.05)            // seuil minimum de pertinence
    .sort((a, b) => b.score - a.score)      // trier par score décroissant
    .slice(0, topK);                         // garder les top K
}

// ══════════════════════════════════════════════════════════════════
//  GET /api/kb/search?q=<texte>
//  Rechercher dans la base de connaissances
//  Accessible par médecins ET IT
// ══════════════════════════════════════════════════════════════════
router.get('/search', (req, res) => {
  const query = req.query.q || '';
  if (query.length < 3) {
    return res.json({ results: [], message: 'Requête trop courte.' });
  }

  const results = searchKB(query);
  res.json({
    results,
    total:    results.length,
    query,
    message:  results.length > 0
      ? `${results.length} solution(s) trouvée(s)`
      : 'Aucune solution connue — créez un ticket.'
  });
});

// ══════════════════════════════════════════════════════════════════
//  GET /api/kb
//  Liste complète de la base de connaissances (IT uniquement)
//  Triée par occurrences décroissantes (problèmes les plus fréquents)
// ══════════════════════════════════════════════════════════════════
router.get('/', roleMiddleware('it'), (req, res) => {
  const sorted = [...knowledgeBase].sort((a, b) => b.occurrences - a.occurrences);
  res.json({ entries: sorted, total: sorted.length });
});

// ══════════════════════════════════════════════════════════════════
//  POST /api/kb/from-ticket
//  Créer ou enrichir une entrée KB depuis un ticket résolu
//  Appelé automatiquement quand un technicien passe un ticket à "résolu"
//  Body: { ticketId, title, problem, solution, category, urgency,
//          keywords?, resolutionMinutes? }
// ══════════════════════════════════════════════════════════════════
router.post('/from-ticket', roleMiddleware('it'), (req, res) => {
  const { ticketId, title, problem, solution, category, urgency, resolutionMinutes } = req.body;

  if (!title || !solution) {
    return res.status(400).json({ error: 'Titre et solution sont obligatoires.' });
  }

  // Vérifier si une entrée similaire existe déjà (score > 0.4 = très similaire)
  const existing = searchKB(title + ' ' + problem, 1);
  const duplicate = existing.length > 0 && existing[0].score > 0.4;

  if (duplicate) {
    // Enrichir l'entrée existante : incrémenter les occurrences, mettre à jour
    const entry = knowledgeBase.find(e => e.id === existing[0].id);
    entry.occurrences++;
    entry.lastSeen = new Date().toISOString();
    if (ticketId && !entry.ticketIds.includes(ticketId)) {
      entry.ticketIds.push(ticketId);
    }
    // Mettre à jour le temps moyen de résolution
    if (resolutionMinutes) {
      entry.avgResolutionMinutes = Math.round(
        (entry.avgResolutionMinutes * (entry.occurrences - 1) + resolutionMinutes) / entry.occurrences
      );
    }
    // Enrichir les mots-clés avec les nouveaux
    if (problem) {
      const newWords = normalize(title + ' ' + problem).filter(w => w.length > 3);
      const existingKw = new Set(entry.keywords);
      newWords.forEach(w => existingKw.add(w));
      entry.keywords = [...existingKw].slice(0, 20); // max 20 mots-clés
    }

    console.log(`✓ KB enrichie : ${entry.id} (${entry.occurrences} occurrences)`);
    return res.json({ action: 'updated', entry, message: 'Entrée existante enrichie.' });
  }

  // Créer une nouvelle entrée KB
  const newEntry = {
    id:          `kb-${String(kbCounter++).padStart(3, '0')}`,
    title:       title.trim(),
    problem:     (problem || title).trim(),
    solution:    solution.trim(),
    category:    category || 'soft',
    urgency:     urgency  || 'medium',
    keywords:    normalize(title + ' ' + (problem || '')).filter(w => w.length > 3).slice(0, 20),
    occurrences: 1,
    lastSeen:    new Date().toISOString(),
    solvedBy:    req.user.name,
    avgResolutionMinutes: resolutionMinutes || null,
    ticketIds:   ticketId ? [ticketId] : []
  };

  knowledgeBase.push(newEntry);
  console.log(`✓ KB nouvelle entrée : ${newEntry.id} — "${newEntry.title}"`);
  res.status(201).json({ action: 'created', entry: newEntry, message: 'Nouvelle entrée ajoutée à la KB.' });
});

// ══════════════════════════════════════════════════════════════════
//  DELETE /api/kb/:id — Supprimer une entrée (IT uniquement)
// ══════════════════════════════════════════════════════════════════
router.delete('/:id', roleMiddleware('it'), (req, res) => {
  const idx = knowledgeBase.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Entrée introuvable.' });
  knowledgeBase.splice(idx, 1);
  res.json({ message: 'Entrée supprimée.' });
});

module.exports = router;
