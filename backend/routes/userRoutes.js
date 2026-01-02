const express = require('express');
const router = express.Router();
const { getUsersByRole } = require('../controllers/userController');

router.get('/', getUsersByRole);

module.exports = router;