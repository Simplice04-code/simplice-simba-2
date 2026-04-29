const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { processMoMo, processAirtel, confirmCOD } = require('../controllers/paymentController');

router.post('/momo', auth, processMoMo);
router.post('/airtel', auth, processAirtel);
router.post('/cod', auth, confirmCOD);

module.exports = router;
