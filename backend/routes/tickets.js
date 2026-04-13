// ╔══════════════════════════════════════════════════════════════════╗
// ║  routes/tickets.js — CRUD complet des tickets IT                 ║
// ╚══════════════════════════════════════════════════════════════════╝

const express = require('express');
const router  = express.Router();

const {
  getTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  getStats
} = require('../config/database');

const { roleMiddleware } = require('../middleware/auth');

// ══════════════════════════════════════════════════════════════════
//  GET /api/tickets
//  Retourne la liste des tickets
//  - Médecin : ses propres tickets uniquement
//  - IT      : tous les tickets (avec filtres optionnels)
//  Query params: ?status=open|in_progress|resolved
//               ?category=soft|hard|net
//               ?urgency=high|medium|low
// ══════════════════════════════════════════════════════════════════
router.get('/', (req, res) => {
  const user    = req.user;
  const filters = {};

  // Filtres depuis les query params
  if (req.query.status)   filters.status   = req.query.status;
  if (req.query.category) filters.category = req.query.category;
  if (req.query.urgency)  filters.urgency  = req.query.urgency;

  // Un médecin ne voit que ses propres tickets
  if (user.role === 'doctor') {
    filters.userId = user.id;
  }

  const list = getTickets(filters);
  res.json({ tickets: list, total: list.length });
});

// ══════════════════════════════════════════════════════════════════
//  GET /api/tickets/stats
//  Statistiques pour le dashboard IT
//  Accessible uniquement par l'équipe IT
// ══════════════════════════════════════════════════════════════════
router.get('/stats', roleMiddleware('it'), (req, res) => {
  res.json(getStats());
});

// ══════════════════════════════════════════════════════════════════
//  GET /api/tickets/:id
//  Retourne un ticket spécifique par son ID
// ══════════════════════════════════════════════════════════════════
router.get('/:id', (req, res) => {
  const ticket = getTicketById(req.params.id);

  if (!ticket) {
    return res.status(404).json({ error: `Ticket ${req.params.id} introuvable.` });
  }

  // Un médecin ne peut voir que ses propres tickets
  if (req.user.role === 'doctor' && ticket.createdBy.id !== req.user.id) {
    return res.status(403).json({ error: 'Accès refusé à ce ticket.' });
  }

  res.json(ticket);
});

// ══════════════════════════════════════════════════════════════════
//  POST /api/tickets
//  Crée un nouveau ticket (médecin ou IT)
//  Body: { title, description, category, urgency, isPredefined?, predefinedId? }
// ══════════════════════════════════════════════════════════════════
router.post('/', (req, res) => {
  const { title, description, category, urgency, isPredefined, predefinedId } = req.body;

  // Validation
  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: 'Le titre du ticket est obligatoire.' });
  }
  if (!['soft', 'hard', 'net'].includes(category)) {
    return res.status(400).json({ error: 'Catégorie invalide (soft | hard | net).' });
  }
  if (!['high', 'medium', 'low'].includes(urgency)) {
    return res.status(400).json({ error: 'Urgence invalide (high | medium | low).' });
  }

  const ticket = createTicket({
    title:       title.trim(),
    description: description ? description.trim() : '',
    category,
    urgency,
    isPredefined: isPredefined || false,
    predefinedId: predefinedId || null,
    createdBy: {
      id:         req.user.id,
      name:       req.user.name,
      department: req.user.department
    }
  });

  console.log(`✓ Ticket créé : ${ticket.id} par ${req.user.name}`);
  res.status(201).json(ticket);
});

// ══════════════════════════════════════════════════════════════════
//  PATCH /api/tickets/:id/status
//  Met à jour le statut d'un ticket (IT uniquement)
//  Body: { status: 'in_progress' | 'resolved' | 'open' }
// ══════════════════════════════════════════════════════════════════
router.patch('/:id/status', roleMiddleware('it'), (req, res) => {
  const { status } = req.body;
  const validStatuses = ['open', 'in_progress', 'resolved'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Statut invalide. Valeurs possibles : ${validStatuses.join(', ')}` });
  }

  const ticket = getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: `Ticket ${req.params.id} introuvable.` });
  }

  const assignedTo = status === 'in_progress'
    ? { id: req.user.id, name: req.user.name }
    : ticket.assignedTo;

  const updated = updateTicketStatus(req.params.id, status, assignedTo);

  console.log(`✓ Ticket ${req.params.id} → ${status} par ${req.user.name}`);
  res.json(updated);
});

module.exports = router;