// ╔══════════════════════════════════════════════════════════════════╗
// ║  middleware/auth.js — Vérification du token JWT                  ║
// ║  Ce middleware protège les routes qui nécessitent d'être connecté ║
// ╚══════════════════════════════════════════════════════════════════╝

const jwt = require('jsonwebtoken');

// Clé secrète pour signer/vérifier les tokens
// En production : stocker dans .env (process.env.JWT_SECRET)
const JWT_SECRET = 'ehu-oran-secret-2024-very-secure-key';
const JWT_EXPIRES = '8h'; // token valide 8 heures (durée d'une garde)

/**
 * Middleware d'authentification JWT
 * Vérifie que le header Authorization contient un token valide
 * Si valide : attache les infos utilisateur à req.user et passe au suivant
 * Si invalide : renvoie une erreur 401
 */
const authMiddleware = (req, res, next) => {
  // Récupérer le header Authorization
  const authHeader = req.headers['authorization'];

  // Format attendu : "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Token manquant. Veuillez vous connecter.'
    });
  }

  const token = authHeader.split(' ')[1]; // extraire le token

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // attacher les données utilisateur à la requête
    next(); // passer au prochain middleware/route
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
    }
    return res.status(401).json({ error: 'Token invalide.' });
  }
};

/**
 * Middleware de restriction par rôle
 * Usage : roleMiddleware('it') — seuls les IT peuvent accéder
 */
const roleMiddleware = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      error: `Accès refusé. Rôle requis : ${roles.join(' ou ')}`
    });
  }
  next();
};

/**
 * Génère un nouveau token JWT pour un utilisateur
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id:         user.id,
      email:      user.email,
      name:       user.name,
      role:       user.role,
      department: user.department,
      avatar:     user.avatar
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
};

module.exports = { authMiddleware, roleMiddleware, generateToken, JWT_SECRET };