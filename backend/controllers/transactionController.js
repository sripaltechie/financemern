const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');

// @desc    Create a Collection Entry
// @route   POST /api/transactions
const createTransaction = async (req, res) => {
    try {
        const { 
            loanId, 
            customerId, 
            amount, 
            collectedBy, 
            paymentMode, 
            notes 
        } = req.body;

        // 1. Fetch the Loan
        const loan = await Loan.findById(loanId);
        if (!loan) return res.status(404).json({ message: 'Loan not found' });

        // 2. FIFO Logic: Clear Dues (Oldest First)
        let remainingPayment = Number(amount);
        
        // Loop through dues to mark them as paid
        // Note: This logic assumes 'dues' are sorted by date in the DB
        loan.dues.forEach(due => {
            if (remainingPayment <= 0) return;
            if (due.status === 'Paid') return;

            // How much is needed to clear this specific due?
            // (Assuming dueAmount is calculated elsewhere or fixed based on interest)
            // For this version, we will simplify: 
            // If loanType is Daily/Weekly, we just mark days as paid based on amount / dailyRate
            // But strict FIFO usually requires knowing the exact due amount per entry.
            
            // SIMPLE UPDATE FOR NOW:
            // Just update the total paid counters. 
            // In a full production version, we would perform the exact array loop here.
        });

        // 3. Update Loan Totals
        // Logic: First clear Interest, then Principal (or based on business rule)
        // For this system, let's assume standard "Interest First"
        
        // Calculate pending interest (Simplified for demo)
        // In real app, calculate exact accrued interest based on dates
        
        // For now, we update the trackers:
        // Assume 'amount' goes to Principal if it's a Monthly Principal Payment
        // Or Interest if it's a Daily collection.
        
        // Let's just track it generally for the MVP:
        loan.financials.totalPrincipalPaid += Number(amount); 
        
        // Check if fully paid
        if (loan.financials.totalPrincipalPaid >= loan.financials.netDisbursementAmount) {
            loan.status = 'Closed';
        }

        await loan.save();

        // 4. Create the Transaction Record
        const transaction = await Transaction.create({
            loanId,
            customerId,
            collectedBy, // Ensure ID is passed from frontend
            amount,
            paymentMode,
            notes,
            paymentType: 'Mixed'
        });

        res.status(201).json(transaction);

    } catch (error) {
        console.error("Collection Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Transaction History for a Customer or Loan
// @route   GET /api/transactions
const getTransactions = async (req, res) => {
    try {
        const { loanId, customerId } = req.query;
        let query = {};
        
        if (loanId) query.loanId = loanId;
        if (customerId) query.customerId = customerId;

        const transactions = await Transaction.find(query)
            .populate('collectedBy', 'name')
            .sort({ date: -1 });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createTransaction, getTransactions };