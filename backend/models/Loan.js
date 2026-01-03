const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    customerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Customer', 
        required: true 
    },
    loanType: { 
        type: String, 
        enum: ['Daily', 'Weekly', 'Monthly'], 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['Active', 'Closed', 'Default'], 
        default: 'Active' 
    },
    riskFlags: [String], // e.g., "Family Conflict Ignored"
    disbursementMode: { type: String, default: 'Cash' }, 
    financials: {
        principalAmount: { type: Number, required: true },
        interestRate: { type: Number, required: true },
        duration: { type: Number, default: 100 }, // Default 100 for Daily
        interestDurationMonths: { type: Number, default: 3 }, // Basis for interest calc
        fixedInstallmentAmount: Number,           // For Weekly logic (e.g., 2000)
        deductionConfig: {
            interest: { type: String, enum: ['Upfront', 'End'], default: 'End' },
             adminCommission: { type: String, enum: ['Upfront', 'End'] }, // Separated
            staffCommission: { type: String, enum: ['Upfront', 'End'] }  // Separated
        },
        
        commissionStructure: {
            percentage: Number,
            totalAmount: Number,
            receiverType: { type: String, enum: ['Admin', 'CollectionBoy', 'Shared'] },
            adminShare: Number,
            staffShare: Number,
            staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        },
        
        netDisbursementAmount: Number,
        totalPrincipalPaid: { type: Number, default: 0 },
        totalInterestPaid: { type: Number, default: 0 },
        totalPenaltyPaid: { type: Number, default: 0 }
    },

    rollover: {
        linkedOldLoanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
        amountDeducted: Number,
        notes: String
    },

    penaltyConfig: {
        method: { type: String, enum: ['Recurring_Percentage', 'One_Time_Fixed', 'None'], default: 'None' },
        value: Number,
        frequency: { type: String, enum: ['Monthly', 'Daily', 'OneTime'] }
    },

    // Repayment Schedule
    dues: [{
        date: Date,
        type: { type: String, default: 'Interest' }, // 'Interest' or 'Principal'
        amount: Number,
        status: { type: String, enum: ['Unpaid', 'Partial', 'Paid'], default: 'Unpaid' },
        paidDate: Date
    }],

    // Separate Penalty Ledger
    penalties: [{
        dateApplied: { type: Date, default: Date.now },
        amount: Number,
        balance: Number,
        type: { type: String, enum: ['Auto', 'Manual'] },
        reason: String,
        status: { type: String, enum: ['Unpaid', 'Partial', 'Paid', 'Waived'], default: 'Unpaid' },
        waivedAmount: Number,
        waivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],

    // Lender Allocation
    lenders: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        investedAmount: Number,
        repaidAmount: { type: Number, default: 0 },
        priority: Number, // 1, 2, 3...
        status: { type: String, enum: ['Active', 'FullyRepaid'], default: 'Active' }
    }]

}, { timestamps: true });

module.exports = mongoose.model('Loan', loanSchema);