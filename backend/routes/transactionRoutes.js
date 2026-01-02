const express = require('express');
const router = express.Router();
const { createTransaction, getTransactions } = require('../controllers/transactionController');

router.route('/')
    .post(createTransaction)
    .get(getTransactions);

module.exports = router;