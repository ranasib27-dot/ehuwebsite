// js/login.js — Logique page de connexion

// Si déjà connecté → rediriger
(function() {
  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    redirectByRole(user.role);
  }
})();

const loginForm     = document.getElementById('login-form');
const emailInput    = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn      = document.getElementById('login-btn');
const loginError    = document.getElementById('login-error');
const loginErrMsg   = document.getElementById('login-error-msg');
const togglePwd     = document.getElementById('toggle-pwd');

// Afficher/masquer mot de passe
togglePwd.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
});

// Soumission formulaire
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  await doLogin();
});

async function doLogin() {
  const email    = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) { showError('Veuillez remplir tous les champs.'); return; }

  setLoading(true);
  hideError();

  try {
    const response = await API.auth.login(email, password);
    Auth.save(response.token, response.user);
    redirectByRole(response.user.role);
  } catch (err) {
    showError(err.message || 'Email ou mot de passe incorrect.');
    setLoading(false);
    passwordInput.value = '';
  }
}

// Redirection selon rôle — chemins absolus depuis la racine
function redirectByRole(role) {
  if (role === 'doctor') {
    window.location.href = '/pages/doctor.html';
  } else if (role === 'it') {
    window.location.href = '/pages/it.html';
  } else {
    showError('Rôle inconnu.');
  }
}

function showError(msg) { loginErrMsg.textContent = msg; loginError.hidden = false; }
function hideError()     { loginError.hidden = true; }
function setLoading(on)  {
  loginBtn.disabled = on;
  loginBtn.querySelector('.btn-text').hidden  =  on;
  loginBtn.querySelector('.btn-loader').hidden = !on;
}

[emailInput, passwordInput].forEach(i => i.addEventListener('input', hideError));
