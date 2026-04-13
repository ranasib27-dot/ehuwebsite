// ╔══════════════════════════════════════════════════════════════════╗
// ║  routes/auth.js — Authentification (Login / Logout)              ║
// ╚══════════════════════════════════════════════════════════════════╝

const express    = require('express');
const bcrypt     = require('bcryptjs');
const router     = express.Router();

const { getUserByEmail } = require('../config/database');
const { generateToken, authMiddleware } = require('../middleware/auth');

// ══════════════════════════════════════════════════════════════════
//  POST /api/auth/login
//  Body: { email, password }
//  Réponse: { token, user }
// ══════════════════════════════════════════════════════════════════
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    // Chercher l'utilisateur en base
    const user = getUserByEmail(email.trim().toLowerCase());

    if (!user) {
      // Ne pas indiquer si c'est l'email ou le mdp qui est faux (sécurité)
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    // Vérifier le mot de passe (bcrypt compare le hash)
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    // Générer le JWT
    const token = generateToken(user);

    // Retourner le token + infos utilisateur (sans le mot de passe)
    res.json({
      token,
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        department: user.department,
        avatar:     user.avatar
      }
    });

    console.log(`✓ Connexion : ${user.name} (${user.role})`);

  } catch (err) {
    console.error('Erreur login:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
});

// ══════════════════════════════════════════════════════════════════
//  GET /api/auth/me
//  Retourne les infos de l'utilisateur connecté (via son token)
// ══════════════════════════════════════════════════════════════════
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
