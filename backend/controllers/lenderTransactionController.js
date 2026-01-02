const LenderTransaction = require('../models/LenderTransaction');
const User = require('../models/User');

// @desc    Add Cash Entry (Lender -> Admin)
// @route   POST /api/lender-transactions
const addLenderTransaction = async (req, res) => {
    try {
         const { lenderId, amount, type, notes, paymentMode } = req.body;

        // 1. Validate Lender
        const lender = await User.findById(lenderId);
        if (!lender || lender.role !== 'lender') {
            return res.status(404).json({ message: 'Lender not found' });
        }

        // 2. Create Transaction Record
        const transaction = await LenderTransaction.create({
            lenderId,
            amount: Number(amount),
            type: type || 'Deposit',
            paymentMode: paymentMode || 'Cash', // Default to Cash if missing
            notes
        });

        // 3. Update Lender's Wallet Balance
        // If 'Deposit': Lender GAVE money to system -> Balance Increases
        // If 'Withdrawal': Lender TOOK money back -> Balance Decreases
        const adjustment = (type === 'Withdrawal') ? -Number(amount) : Number(amount);

        // Ensure lenderConfig exists before incrementing
        if (!lender.lenderConfig) {
            lender.lenderConfig = { currentBalanceWithAdmin: 0 };
        }
        
        // MongoDB Atomic Update
        await User.findByIdAndUpdate(lenderId, {
            $inc: { 'lenderConfig.currentBalanceWithAdmin': adjustment }
        });

        res.status(201).json(transaction);

    } catch (error) {
        console.error("Lender Transaction Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Lender Transactions
// @route   GET /api/lender-transactions
const getLenderTransactions = async (req, res) => {
    try {
        const { lenderId } = req.query;
        let query = {};
        
        if (lenderId) query.lenderId = lenderId;

        const transactions = await LenderTransaction.find(query)
            .populate('lenderId', 'name mobile')
            .sort({ createdAt: -1 });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addLenderTransaction, getLenderTransactions };