const express = require('express');
const router = express.Router();
const { 
    createCustomer, 
    getCustomers, 
    getCustomerById, 
    checkConflict,
    updateCustomer
} = require('../controllers/customerController');

// Protect all routes (only logged in users)
// Note: We need to import the protect middleware later, for now we keep it open or assume global auth
// For this step, we will just link the controller.

router.route('/')
    .post(createCustomer)
    .get(getCustomers);

router.route('/:id')
    .get(getCustomerById)
    .put(updateCustomer);

router.post('/check-conflict', checkConflict);

module.exports = router;