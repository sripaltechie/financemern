const express = require('express');
const router = express.Router();
const { addLenderTransaction, getLenderTransactions } = require('../controllers/lenderTransactionController');

router.route('/')
    .post(addLenderTransaction)
    .get(getLenderTransactions);

module.exports = router;