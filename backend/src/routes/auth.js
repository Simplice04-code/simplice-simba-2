const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  requestPasswordReset,
  resetPassword
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

module.exports = router;
