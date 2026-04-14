// ╔══════════════════════════════════════════════════════════════════╗
// ║  server.js — Backend Express EHU Oran                            ║
// ║  Sert AUSSI le frontend statique → une seule commande suffit     ║
// ╚══════════════════════════════════════════════════════════════════╝

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes   = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const userRoutes   = require('./routes/users');
const mlRoutes     = require('./routes/ml');
const { authMiddleware } = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS ────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','PATCH','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());

// ── SERVIR LE FRONTEND STATIQUE ────────────────────────────────────
const FRONTEND_PATH = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_PATH));

// Logger API
app.use('/api', (req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString('fr-FR')}] ${req.method} /api${req.path}`);
  next();
});

// ── ROUTES API ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', timestamp: new Date() })
);

app.use('/api/auth',    authRoutes);
app.use('/api/tickets', authMiddleware, ticketRoutes);
app.use('/api/users',   authMiddleware, userRoutes);
app.use('/api/ml',      authMiddleware, mlRoutes);

// ── FALLBACK (IMPORTANT FIX EXPRESS 5) ─────────────────────────────
app.use((req, res) => {

  // Si route API inconnue → JSON 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: `Endpoint ${req.path} introuvable`
    });
  }

  // Sinon → frontend
  res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

// ── ERREURS SERVEUR ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Erreur:', err.message);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// ── DÉMARRAGE ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   ✓  EHU ORAN — Serveur démarré                       ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║   http://localhost:${PORT}                              ║`);
  console.log('║   (Plus besoin de Live Server !)                       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
});