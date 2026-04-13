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
const kbRoutes     = require('./routes/kb');
const { authMiddleware } = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3000;


// ── CORS (au cas où on utilise quand même Live Server) ─────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());

// ── SERVIR LE FRONTEND STATIQUE ────────────────────────────────────
// Le dossier frontend/ est un niveau au-dessus du backend/
const FRONTEND_PATH = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_PATH));

// Logger
app.use('/api', (req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString('fr-FR')}] ${req.method} /api${req.path}`);
  next();
});

// ── ROUTES API ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));
app.use('/api/auth',    authRoutes);
app.use('/api/tickets', authMiddleware, ticketRoutes);
app.use('/api/users',   authMiddleware, userRoutes);
app.use('/api/ml',      authMiddleware, mlRoutes);
app.use('/api/kb',      authMiddleware, kbRoutes);

// ── Fallback : toutes les routes non-API → index.html ──────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint introuvable' });
  }
  res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});
// ── Erreurs ────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Erreur:', err.message);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   ✓  EHU ORAN — Serveur démarré                       ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(║   Ouvrir dans le navigateur :                          ║);
  console.log(║   → http://localhost:${PORT}                              ║);
  console.log('║                                                        ║');
  console.log('║   (Plus besoin de Live Server !)                       ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║   Médecin  : dr.karim@ehu-oran.dz    / med123         ║');
  console.log('║   IT Admin : it.support@ehu-oran.dz  / it123          ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
});
// ── Démarrage ──────────────────────────────────────────────────────
