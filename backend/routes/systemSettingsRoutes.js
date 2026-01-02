const express = require('express');
const router = express.Router();
const { getSettings } = require('../controllers/systemSettingsController');

router.get('/', getSettings);

module.exports = router;