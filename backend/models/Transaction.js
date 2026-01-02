const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    loanId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Loan', 
        required: true 
    },
    customerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Customer', 
        required: true 
    },
    collectedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    amount: { type: Number, required: true },
    
    // What is this payment for?
    paymentType: { 
        type: String, 
        enum: ['Interest', 'Principal', 'Penalty', 'Mixed'], 
        default: 'Mixed' 
    },
    
    paymentMode: { type: String, default: 'Cash' }, // Cash, PhonePe, GPay
    
    // For Daily/Weekly loans: Which specific days does this cover?
    installmentIndexes: [Number], 
    
    date: { type: Date, default: Date.now },
    
    approvalStatus: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Rejected'], 
        default: 'Approved' 
    },
    
    notes: String,

    // LENDER ALLOCATION (Profit Sharing)
    allocations: [{
        type: { type: String, enum: ['Lender', 'AdminProfit'] },
        recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        amount: Number,
        isSettled: { type: Boolean, default: false }
    }],

    // --- NEW: OFFLINE SYNC ENGINE SUPPORT ---
    syncDetails: {
        isOfflineEntry: { type: Boolean, default: false },
        deviceTransactionId: { type: String, unique: true, sparse: true }, // UUID from App
        syncedAt: Date
    }

}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);