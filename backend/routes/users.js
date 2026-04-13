// ╔══════════════════════════════════════════════════════════════════╗
// ║  routes/users.js — Gestion des utilisateurs                      ║
// ╚══════════════════════════════════════════════════════════════════╝

const express = require('express');
const router  = express.Router();
const { getUsers, getUserById } = require('../config/database');
const { roleMiddleware } = require('../middleware/auth');

// GET /api/users — liste des utilisateurs IT (admin seulement)
router.get('/', roleMiddleware('it'), (req, res) => {
  const users = getUsers();
  res.json({ users, total: users.length });
});

// GET /api/users/team — membres de l'équipe IT avec leurs stats de charge
router.get('/team', roleMiddleware('it'), (req, res) => {
  const { getTickets } = require('../config/database');
  const itUsers = getUsers().filter(u => u.role === 'it');
  const allTickets = getTickets();

  const team = itUsers.map(u => {
    const active = allTickets.filter(
      t => t.assignedTo?.id === u.id && t.status !== 'resolved'
    ).length;
    const resolved = allTickets.filter(
      t => t.assignedTo?.id === u.id && t.status === 'resolved'
    ).length;

    // Calcul de la charge (% de capacité, max = 5 tickets actifs)
    const loadPercent = Math.min(Math.round((active / 5) * 100), 100);

    return {
      ...u,
      activeTickets:   active,
      resolvedTickets: resolved,
      loadPercent,
      loadStatus: loadPercent < 60 ? 'ok' : loadPercent < 85 ? 'warning' : 'full'
    };
  });

  res.json({ team });
});

module.exports = router;