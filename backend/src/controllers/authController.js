const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { db } = require('../config/database');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../config/email');

const JWT_SECRET = process.env.JWT_SECRET || 'simba_supermarket_secret_key_2024';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function getSafeUserById(id) {
  return db.prepare(`
    SELECT id, name, email, phone, gender, district, sector, village, street, role, created_at
    FROM users
    WHERE id = ?
  `).get(id);
}

function buildResetLink(token) {
  return `http://localhost:5000/#login?tab=reset&token=${encodeURIComponent(token)}`;
}

exports.register = (req, res) => {
  const { name, email, password, phone, gender, district, sector, village, street } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered.' });
  }

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password, phone, gender, district, sector, village, street) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(name, email, hashed, phone || null, gender || null, district || null, sector || null, village || null, street || null);

  const user = getSafeUserById(result.lastInsertRowid);
  const token = generateToken(user);

  // Send welcome email (non-blocking)
  sendWelcomeEmail(user.email, user.name);

  res.status(201).json({ success: true, message: 'Account created successfully.', token, user });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const safeUser = getSafeUserById(user.id);
  const token = generateToken(safeUser);
  res.json({ success: true, token, user: safeUser });
};

exports.googleLogin = (req, res) => {
  const { email, name, google_token } = req.body;

  if (!email || !name || !google_token) {
    return res.status(400).json({ success: false, message: 'Google sign-in payload is incomplete.' });
  }

  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (user && user.google_id && user.google_id !== google_token) {
    return res.status(409).json({ success: false, message: 'This email is already linked to another Google account.' });
  }

  if (!user) {
    const generatedPassword = bcrypt.hashSync(crypto.randomUUID(), 10);
    const result = db.prepare(
      'INSERT INTO users (name, email, password, google_id) VALUES (?, ?, ?, ?)'
    ).run(name, email, generatedPassword, google_token);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  } else if (!user.google_id) {
    db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(google_token, user.id);
    user.google_id = google_token;
  }

  const safeUser = getSafeUserById(user.id);
  const token = generateToken(safeUser);

  // Send welcome email for new Google users
  if (!user) {
    sendWelcomeEmail(safeUser.email, safeUser.name);
  }

  res.json({ success: true, message: 'Signed in with Google.', token, user: safeUser });
};

exports.requestPasswordReset = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'No account was found for that email address.' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();
  db.prepare('UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used_at IS NULL').run(user.id);
  db.prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expiresAt);

  const resetLink = buildResetLink(token);

  // Send real password reset email (non-blocking)
  sendPasswordResetEmail(user.email, token);

  res.json({
    success: true,
    message: 'Password reset email sent.',
    reset_token: token,
    reset_link: resetLink
  });
};

exports.resetPassword = (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Reset token and new password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
  }

  const resetRow = db.prepare(`
    SELECT prt.*, u.id as user_id
    FROM password_reset_tokens prt
    JOIN users u ON u.id = prt.user_id
    WHERE prt.token = ? AND prt.used_at IS NULL
  `).get(token);

  if (!resetRow) {
    return res.status(400).json({ success: false, message: 'That reset link is invalid or already used.' });
  }

  if (new Date(resetRow.expires_at).getTime() < Date.now()) {
    return res.status(400).json({ success: false, message: 'That reset link has expired. Please request a new one.' });
  }

  const hashed = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, resetRow.user_id);
  db.prepare('UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?').run(resetRow.id);

  const user = getSafeUserById(resetRow.user_id);
  const tokenOut = generateToken(user);
  res.json({ success: true, message: 'Password updated successfully.', token: tokenOut, user });
};
