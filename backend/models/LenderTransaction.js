const mongoose = require('mongoose');

const lenderTransactionSchema = new mongoose.Schema({
    lenderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    amount: { type: Number, required: true },
    type: { 
        type: String, 
        enum: ['Deposit', 'Withdrawal'], 
        default: 'Deposit' 
    }, 
    paymentSplit: [{
        mode: { type: String, required: true }, // e.g., 'Cash', 'PhonePe'
        amount: { type: Number, required: true }
    }],   
    date: { type: Date, default: Date.now },
    notes: String,
    
    processedBy: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('LenderTransaction', lenderTransactionSchema);