const Loan = require('../models/Loan');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { generateSchedule } = require('../utils/scheduleGenerator'); 

// @desc    Create a New Loan (Disbursement)
// @route   POST /api/loans
const createLoan = async (req, res) => {
    try {
        const {
            customerId,
            loanType,
            disbursementMode,
            financials,
            penaltyConfig,
            lenderId, 
            lenders,
            rollover,
            notes
        } = req.body;

        // 1. Validation
        const customer = await Customer.findById(customerId);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        // 2. Construct Lenders Array
        let finalLenders = lenders || [];
        if (!finalLenders.length && lenderId) {
            finalLenders = [{
                userId: lenderId,
                investedAmount: Number(financials.principalAmount),
                repaidAmount: 0,
                priority: 1,
                status: 'Active'
            }];
        }

        // 3. Calculate Deductions (UPDATED FOR SEPARATE COMMISSIONS)
        let upfrontDeductions = 0;
        const principal = Number(financials.principalAmount);
        const rate = Number(financials.interestRate);
        const duration = Number(financials.duration) || 100; 

        // A. Interest Upfront?
        if (financials.deductionConfig.interest === 'Upfront') {
            // Estimate months for interest calc
             let timeInMonths = Number(financials.interestDurationMonths);            

            if (!timeInMonths) {
                if(loanType === 'Daily') timeInMonths = duration / 30;
                else if(loanType === 'Weekly') timeInMonths = duration / 4;
                else if(loanType === 'Monthly') timeInMonths = duration;
            }           
            const interestAmount = (principal * rate * timeInMonths) / 100;
            upfrontDeductions += interestAmount;
        }

        // B. Admin Commission Upfront?
        if (financials.deductionConfig.adminCommission === 'Upfront') {
            const adminComm = Number(financials.adminCommission?.amount) || 0; // Safe check
            upfrontDeductions += adminComm;
        }

        // C. Staff Commission Upfront?
        if (financials.deductionConfig.staffCommission === 'Upfront') {
            const staffComm = Number(financials.staffCommission?.amount) || 0; // Safe check
            upfrontDeductions += staffComm;
        }

        // D. Rollover Deduction?
        if (rollover && rollover.amountDeducted) {
            upfrontDeductions += Number(rollover.amountDeducted);
            if (rollover.linkedOldLoanId) {
                await Loan.findByIdAndUpdate(rollover.linkedOldLoanId, {
                    status: 'Closed',
                    $push: { riskFlags: 'Closed via Rollover' }
                });
            }
        }

        const netDisbursement = principal - upfrontDeductions;
        // Validate Split Total if provided
        if (disbursementSplit && disbursementSplit.length > 0) {
            const splitTotal = disbursementSplit.reduce((sum, s) => sum + Number(s.amount), 0);
            // Allow small float difference or handle strictly. 
            // Note: netDisbursement might not match exactly if there are manual overrides, 
            // but normally it should match the cash handed over.
        }
        
        // 4. Generate Schedule
        const generatedDues = generateSchedule({
            loanType,
            financials,
            startDate: new Date()
        });

        // 5. Create Loan
        const newLoan = await Loan.create({
            customerId,
            loanType,
            disbursementMode: disbursementMode || 'Cash', 
            financials: {
                ...financials,
                commissionStructure: { // Map frontend fields to schema structure if needed
                   adminShare: Number(financials.adminCommission?.amount) || 0,
                   staffShare: Number(financials.staffCommission?.amount) || 0,
                   receiverType: 'Shared'
                },
                netDisbursementAmount: netDisbursement,
                totalPrincipalPaid: 0,
                totalInterestPaid: 0
            },
            penaltyConfig,
            lenders: finalLenders,
            rollover,
            status: 'Active',
            dues: generatedDues,
            notes
        });

         // --- 6. UPDATE LENDER BALANCES (NEW) ---
        // Deduct the invested amount from the lender's current balance
        if (finalLenders.length > 0) {
            for (const lender of finalLenders) {
                if (lender.userId && lender.investedAmount > 0) {
                    await User.findByIdAndUpdate(lender.userId, {
                        $inc: { 'lenderConfig.currentBalanceWithAdmin': -lender.investedAmount }
                    });
                }
            }
        }
        res.status(201).json(newLoan);
    } catch (error) {
        console.error("Create Loan Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Loans
const getLoans = async (req, res) => {
    try {
        const { status, customerId } = req.query;
        let query = {};
        if (status) query.status = status;
        if (customerId) query.customerId = customerId;

        const loans = await Loan.find(query)
            .populate('customerId', 'fullName mobile')
            .sort({ createdAt: -1 });

        res.json(loans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Single Loan
const getLoanById = async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id)
            .populate('customerId', 'fullName mobile photo locations');
        if (!loan) return res.status(404).json({ message: 'Loan not found' });
        res.json(loan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createLoan, getLoans, getLoanById };