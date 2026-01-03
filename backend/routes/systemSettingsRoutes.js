const express = require('express');
const router = express.Router();
const { getSettings, updatePaymentModes } = require('../controllers/systemSettingsController');

router.get('/', getSettings);
router.put('/payment-modes', updatePaymentModes);

module.exports = router;