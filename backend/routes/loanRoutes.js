const express = require('express');
const router = express.Router();
const { createLoan, getLoans, getLoanById } = require('../controllers/loanController');

router.route('/')
    .post(createLoan)
    .get(getLoans);

router.route('/:id')
    .get(getLoanById);

module.exports = router;