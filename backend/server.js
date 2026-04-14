// ╔══════════════════════════════════════════════════════════════════╗
// ║  server.js — Backend Express EHU Oran                            ║
// ║  PRODUCTION READY (Render + Express 5 safe)                      ║
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

// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','PATCH','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());

// ─────────────────────────────────────────────
// FRONTEND STATIC (React / HTML build)
// ─────────────────────────────────────────────
const FRONTEND_PATH = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_PATH));

// ─────────────────────────────────────────────
// LOGS API
// ─────────────────────────────────────────────
app.use('/api', (req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString('fr-FR')}] ${req.method} ${req.originalUrl}`);
  next();
});

// ─────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.use('/api/auth',    authRoutes);
app.use('/api/tickets', authMiddleware, ticketRoutes);
app.use('/api/users',   authMiddleware, userRoutes);
app.use('/api/ml',      authMiddleware, mlRoutes);

// ─────────────────────────────────────────────
// SPA FALLBACK (FIX EXPRESS 5 SAFE)
// ─────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: `API endpoint not found: ${req.path}`
    });
  }

  res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

// ─────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   ✓ EHU ORAN SERVER RUNNING               ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║   PORT: ${PORT}`);
  console.log('║   STATUS: READY 🚀');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
});