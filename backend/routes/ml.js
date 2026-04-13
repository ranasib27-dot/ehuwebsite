// ╔══════════════════════════════════════════════════════════════════╗
// ║  routes/ml.js — Moteur ML : analyse de texte et prédictions      ║
// ║                                                                    ║
// ║  Algorithme : Classification par mots-clés pondérés (TF-IDF       ║
// ║  simplifié). En production : intégrer un vrai modèle NLP          ║
// ║  (ex: scikit-learn, TensorFlow.js, ou API Hugging Face)          ║
// ╚══════════════════════════════════════════════════════════════════╝

const express = require('express');
const router  = express.Router();
const { PREDEFINED_TICKETS } = require('../config/database');

// ══════════════════════════════════════════════════════════════════
//  BASE DE CONNAISSANCES ML
//  Dictionnaire de mots-clés par catégorie avec poids (importance)
//  Plus le poids est élevé, plus le mot est discriminant
// ══════════════════════════════════════════════════════════════════
const ML_KNOWLEDGE = {
  soft: {
    label: 'Logiciel',
    icon: '💻',
    color: '#1a9b8a',
    keywords: {
      // Mots très discriminants (poids 3)
      'logiciel': 3, 'application': 3, 'software': 3, 'programme': 3,
      'his': 3, 'dossier patient': 3,
      // Mots importants (poids 2)
      'erreur': 2, 'crash': 2, 'plante': 2, 'freeze': 2, 'bug': 2,
      'mise à jour': 2, 'update': 2, 'installer': 2, 'version': 2,
      'login': 2, 'accès': 2, 'connexion': 2, 'authentification': 2,
      // Mots de contexte (poids 1)
      'ouvrir': 1, 'fermer': 1, 'lancer': 1, 'démarrer': 1,
      'lent': 1, 'lente': 1, 'performance': 1, 'fenêtre': 1,
      'mot de passe': 1, 'password': 1, 'mdp': 1
    }
  },
  hard: {
    label: 'Matériel',
    icon: '🖥️',
    color: '#c9a84c',
    keywords: {
      // Poids 3 — très discriminants
      'imprimante': 3, 'scanner': 3, 'écran': 3, 'clavier': 3,
      'souris': 3, 'ordinateur': 3, 'pc': 3, 'carte vitale': 3,
      // Poids 2
      'moniteur': 2, 'affichage': 2, 'usb': 2, 'périphérique': 2,
      'câble': 2, 'branchement': 2, 'alimentation': 2, 'batterie': 2,
      'disque dur': 2, 'mémoire': 2, 'ram': 2,
      // Poids 1
      'noir': 1, 'éteint': 1, 'allumer': 1, 'brancher': 1,
      'bruit': 1, 'chaud': 1, 'ventilateur': 1, 'panne': 1
    }
  },
  net: {
    label: 'Réseau / Internet',
    icon: '📶',
    color: '#4a9fe0',
    keywords: {
      // Poids 3
      'internet': 3, 'wifi': 3, 'wi-fi': 3, 'réseau': 3, 'serveur': 3,
      'vpn': 3, 'ip': 3,
      // Poids 2
      'connexion': 2, 'déconnexion': 2, 'coupure': 2, 'débit': 2,
      'bande passante': 2, 'lan': 2, 'ethernet': 2, 'routeur': 2,
      'dns': 2, 'ping': 2, 'email': 2, 'messagerie': 2,
      // Poids 1
      'lent': 1, 'instable': 1, 'accéder': 1, 'partage': 1,
      'télécharger': 1, 'envoyer': 1, 'distant': 1
    }
  }
};

// ══════════════════════════════════════════════════════════════════
//  FONCTION DE CLASSIFICATION ML
//  Retourne les catégories avec leur score de confiance
// ══════════════════════════════════════════════════════════════════
function classifyText(text) {
  if (!text || text.trim().length < 3) return null;

  const normalized = text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprimer les accents pour comparaison
    .trim();

  const scores = {};
  const matchedKeywords = {};

  // Calculer le score pour chaque catégorie
  for (const [cat, data] of Object.entries(ML_KNOWLEDGE)) {
    scores[cat] = 0;
    matchedKeywords[cat] = [];

    for (const [keyword, weight] of Object.entries(data.keywords)) {
      const normalizedKw = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes(normalizedKw)) {
        scores[cat] += weight;
        matchedKeywords[cat].push(keyword);
      }
    }
  }

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  if (totalScore === 0) return null; // aucun mot-clé trouvé

  // Trier les catégories par score décroissant
  const ranked = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([, score]) => score > 0)
    .map(([cat, score]) => ({
      category:    cat,
      label:       ML_KNOWLEDGE[cat].label,
      icon:        ML_KNOWLEDGE[cat].icon,
      color:       ML_KNOWLEDGE[cat].color,
      score,
      confidence:  Math.min(Math.round((score / Math.max(totalScore, 1)) * 100 * 1.5), 96),
      keywords:    matchedKeywords[cat]
    }));

  return ranked;
}

// ══════════════════════════════════════════════════════════════════
//  GET /api/ml/predefined
//  Retourne tous les tickets prédéfinis (avec filtre optionnel)
//  Query: ?category=soft|hard|net
// ══════════════════════════════════════════════════════════════════
router.get('/predefined', (req, res) => {
  let tickets = PREDEFINED_TICKETS;

  if (req.query.category) {
    tickets = tickets.filter(t => t.category === req.query.category);
  }

  // Ajouter les métadonnées de catégorie
  const enriched = tickets.map(t => ({
    ...t,
    categoryLabel: ML_KNOWLEDGE[t.category]?.label || t.category,
    categoryIcon:  ML_KNOWLEDGE[t.category]?.icon  || '📋',
    categoryColor: ML_KNOWLEDGE[t.category]?.color || '#888'
  }));

  res.json({ tickets: enriched, total: enriched.length });
});

// ══════════════════════════════════════════════════════════════════
//  GET /api/ml/analyze?text=<texte>
//  Analyse un texte et retourne les catégories détectées
//  Utilisé pour les suggestions en temps réel dans le formulaire
// ══════════════════════════════════════════════════════════════════
router.get('/analyze', (req, res) => {
  const text = req.query.text || '';

  if (text.length < 3) {
    return res.json({ predictions: [], message: 'Texte trop court pour l\'analyse.' });
  }

  const predictions = classifyText(text);

  if (!predictions || predictions.length === 0) {
    return res.json({
      predictions: [],
      message: 'Aucun mot-clé reconnu. Essayez : logiciel, réseau, imprimante...'
    });
  }

  // Trouver les tickets prédéfinis similaires (top catégorie)
  const topCat = predictions[0].category;
  const similar = PREDEFINED_TICKETS
    .filter(t => t.category === topCat)
    .slice(0, 3)
    .map(t => ({ id: t.id, title: t.title, urgency: t.urgency }));

  res.json({
    predictions,
    topCategory:    predictions[0].category,
    topLabel:       predictions[0].label,
    topConfidence:  predictions[0].confidence,
    similarTickets: similar,
    analyzedText:   text
  });
});

// ══════════════════════════════════════════════════════════════════
//  GET /api/ml/insights
//  Insights IA pour le dashboard IT
// ══════════════════════════════════════════════════════════════════
router.get('/insights', (req, res) => {
  const { getTickets } = require('../config/database');
  const allTickets = getTickets();

  // Heure de pointe simulée (basée sur les créatedAt)
  const hours = allTickets.map(t => new Date(t.createdAt).getHours());
  const hourCounts = {};
  hours.forEach(h => { hourCounts[h] = (hourCounts[h] || 0) + 1; });
  const peakHour = Object.entries(hourCounts).sort((a,b) => b[1]-a[1])[0];

  // Distribution par catégorie
  const catDist = { soft: 0, hard: 0, net: 0 };
  allTickets.forEach(t => { if (catDist[t.category] !== undefined) catDist[t.category]++; });
  const total = allTickets.length || 1;

  res.json({
    peakHour:        peakHour ? `${peakHour[0]}h–${parseInt(peakHour[0])+2}h` : '09h–11h',
    avgResolutionTime: '2h 14min',
    satisfactionRate: '88%',
    tomorrowPrediction: '7–9',
    categoryDistribution: {
      soft: Math.round((catDist.soft / total) * 100),
      hard: Math.round((catDist.hard / total) * 100),
      net:  Math.round((catDist.net  / total) * 100)
    },
    topCategory: Object.entries(catDist).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'soft',
    mlModelVersion: '1.0.0-keywords'
  });
});

module.exports = router;