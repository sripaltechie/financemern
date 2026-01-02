/*
  ===================================================================
  FINANCE APP - MASTER DATABASE SETUP SCRIPT
  ===================================================================
  Run this script ONCE to initialize the database structure, 
  create indexes, and seed default system settings.
*/

const mongoose = require('mongoose');

// REPLACE WITH YOUR MONGODB CONNECTION STRING
const MONGO_URI = "mongodb://localhost:27017/finance_mern_db"; 

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");
    } catch (err) {
        console.error("❌ Connection Failed:", err);
        process.exit(1);
    }
};

// =================================================================
// 1. DEFINE SCHEMAS
// =================================================================

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'lender', 'collection_boy'], required: true },
    isActive: { type: Boolean, default: true },
    needsApproval: { type: Boolean, default: false }, // For Collection Boys
    securityConfig: {
        isBiometricEnabled: { type: Boolean, default: false },
        biometricDeviceId: String,
        lastLogin: Date
    },
    lenderConfig: {
        minimumPayoutThreshold: Number,
        currentBalanceWithAdmin: { type: Number, default: 0 }
    }
}, { timestamps: true });

const customerSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    locations: {
        residence: { addressText: String, geo: { lat: Number, lng: Number } },
        collectionPoint: { 
            addressText: String, 
            geo: { lat: Number, lng: Number }, 
            placeType: { type: String, enum: ['Shop', 'Home', 'Other'] } 
        }
    },
    kyc: {
        aadhaarNumber: String,
        aadhaarPhoto: String,
        profilePhoto: String,
        panCardNumber: String,
        panCardPhoto: String,
        rationCardNumber: String,
        rationCardPhoto: String
    },
    familyMembers: [{
        name: String,
        relation: String,
        mobile: String,
        hasActiveLoan: { type: Boolean, default: false }
    }],
    creditScore: { type: Number, default: 0 },
    level: { type: String, enum: ['Level 1', 'Level 2', 'Level 3'], default: 'Level 1' },
    bonusCoins: { type: Number, default: 0 },
    incomeSource: { type: String, enum: ['Daily Wage', 'Monthly Salary'] }
}, { timestamps: true });

const loanSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    loanType: { type: String, enum: ['Daily', 'Weekly', 'Monthly'], required: true },
    status: { type: String, enum: ['Active', 'Closed', 'Default'], default: 'Active' },
    riskFlags: [String],
    financials: {
        principalAmount: Number,
        interestRate: Number,
        
        // --- Added based on request ---
        // Stores "100" for Daily, or specific weeks/months
        duration: { type: Number, default: 100 }, 
        // Stores the manually defined installment (e.g., 2000 for Weekly)
        fixedInstallmentAmount: Number, 
        // ------------------------------

        deductionConfig: {
            interest: { type: String, enum: ['Upfront', 'End'] },
            adminCommission: { type: String, enum: ['Upfront', 'End'] },
            staffCommission: { type: String, enum: ['Upfront', 'End'] }
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
        method: { type: String, enum: ['Recurring_Percentage', 'One_Time_Fixed', 'None'] },
        value: Number,
        frequency: { type: String, enum: ['Monthly', 'Daily', 'OneTime'] }
    },
    dues: [{
        date: Date,
        type: { type: String, default: 'Interest' },
        amount: Number,
        status: { type: String, enum: ['Unpaid', 'Partial', 'Paid'] },
        paidDate: Date
    }],
    penalties: [{
        dateApplied: Date,
        amount: Number,
        balance: Number,
        type: { type: String, enum: ['Auto', 'Manual'] },
        reason: String,
        status: { type: String, enum: ['Unpaid', 'Partial', 'Paid', 'Waived'] },
        waivedAmount: Number,
        waivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    lenders: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        investedAmount: Number,
        repaidAmount: { type: Number, default: 0 },
        priority: Number,
        status: { type: String, enum: ['Active', 'FullyRepaid'], default: 'Active' }
    }]
}, { timestamps: true });

const transactionSchema = new mongoose.Schema({
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    paymentType: { type: String, enum: ['Interest', 'Principal', 'Penalty'] },
    paymentMode: String, // e.g., "PhonePe"
    modeCategory: { type: String, enum: ['Cash', 'Online'] },
    notes: String,
    installmentIndexes: [Number],
    date: { type: Date, default: Date.now },
    approvalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Approved' },
    syncDetails: {
        isOfflineEntry: { type: Boolean, default: false },
        deviceTransactionId: String,
        syncedAt: Date
    },
    allocations: [{
        type: { type: String, enum: ['Lender', 'AdminProfit'] },
        recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        amount: Number,
        isSettled: { type: Boolean, default: false },
        settledDate: Date
    }]
}, { timestamps: true });

// --- ADDED: LENDER TRANSACTION SCHEMA ---
const lenderTransactionSchema = new mongoose.Schema({
    lenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['Deposit', 'Withdrawal'], default: 'Deposit' }, // Deposit = Lender gave money to Admin
    paymentMode: { type: String, required: true },
    date: { type: Date, default: Date.now },
    notes: String,
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
// ----------------------------------------

const routeSchema = new mongoose.Schema({
    name: String,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    stops: [{
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
        sequenceOrder: Number
    }],
    sharedWith: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        permission: { type: String, enum: ['View', 'Edit'] }
    }]
}, { timestamps: true });

const dailyAssignmentSchema = new mongoose.Schema({
    date: Date,
    collectionBoyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    adminNote: String,
    status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' }
});

const reminderSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    collectionBoyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reminderDate: Date,
    note: String,
    voiceNoteUrl: String,
    linkedContext: {
        loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
        paymentTypes: [String],
        targetDueDates: [Date],
        targetPenaltyIds: [mongoose.Schema.Types.ObjectId]
    },
    postponeCount: { type: Number, default: 0 },
    status: { type: String, enum: ['Pending', 'Paid', 'Partial', 'Ignored'], default: 'Pending' }
});

const systemSettingsSchema = new mongoose.Schema({
    key: { type: String, unique: true }, // e.g., 'global_config'
    activePaymentModes: [{
        name: String,
        type: { type: String, enum: ['Cash', 'Online'] }
    }],
    creditScoreRules: {
        dailyOnTime: Number,
        dailyLate: Number,
        monthlyOnTime: Number,
        defaultPenalty: Number
    },
    bonusRules: {
        dailyFixedReward: Number,
        dailyBulkReduction: Number,
        monthlyPrincipalPercent: Number,
        monthlyInterestPercent: Number
    }
});

const cashHandoverSchema = new mongoose.Schema({
    collectionBoyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receivedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending', 'Verified'], default: 'Pending' }
});

const creditScoreLogSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
    previousScore: Number,
    newScore: Number,
    changeAmount: Number,
    reason: String,
    date: { type: Date, default: Date.now }
});

const coinTransactionSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
    type: { type: String, enum: ['Earned', 'Redeemed', 'Expired'] },
    amount: Number,
    description: String,
    date: { type: Date, default: Date.now }
});

const coinRedemptionSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    coinsToRedeem: Number,
    valueInCash: Number,
    redemptionType: { type: String, enum: ['Cash', 'LoanDeduction'] },
    targetLoanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    adminNote: String
}, { timestamps: true });

const loanRequestSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    requestedDate: { type: Date, default: Date.now },
    adminNote: String
});

const routeSessionSchema = new mongoose.Schema({
    originalRouteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
    collectionBoyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startTime: Date,
    endTime: Date,
    navigationEnabled: Boolean,
    status: { type: String, enum: ['In Progress', 'Completed', 'Partial'] },
    gpsPath: [{ lat: Number, lng: Number, timestamp: Date }],
    startLocation: { lat: Number, lng: Number },
    endLocation: { lat: Number, lng: Number },
    sessionStops: [{
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
        status: { type: String, enum: ['Pending', 'Visited', 'Skipped', 'Rescheduled'] },
        visitedAt: Date,
        transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
        isRescheduled: { type: Boolean, default: false },
        originalIndex: Number,
        actualVisitOrder: Number
    }]
});

const expenseSchema = new mongoose.Schema({
    title: String,
    category: { type: String, enum: ['Operational', 'Salary', 'Rent', 'Utilities', 'Other'] },
    amount: Number,
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receiptPhoto: String,
    date: { type: Date, default: Date.now },
    isReimbursed: { type: Boolean, default: false }
});

const profitWithdrawalSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    date: { type: Date, default: Date.now },
    description: String
});

// =================================================================
// 2. MODEL CREATION
// =================================================================

const User = mongoose.model('User', userSchema);
const Customer = mongoose.model('Customer', customerSchema);
const Loan = mongoose.model('Loan', loanSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
// --- ADDED ---
const LenderTransaction = mongoose.model('LenderTransaction', lenderTransactionSchema);
// -------------
const Route = mongoose.model('Route', routeSchema);
const DailyAssignment = mongoose.model('DailyAssignment', dailyAssignmentSchema);
const Reminder = mongoose.model('Reminder', reminderSchema);
const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
const CashHandover = mongoose.model('CashHandover', cashHandoverSchema);
const CreditScoreLog = mongoose.model('CreditScoreLog', creditScoreLogSchema);
const CoinTransaction = mongoose.model('CoinTransaction', coinTransactionSchema);
const CoinRedemption = mongoose.model('CoinRedemption', coinRedemptionSchema);
const LoanRequest = mongoose.model('LoanRequest', loanRequestSchema);
const RouteSession = mongoose.model('RouteSession', routeSessionSchema);
const Expense = mongoose.model('Expense', expenseSchema);
const ProfitWithdrawal = mongoose.model('ProfitWithdrawal', profitWithdrawalSchema);

// =================================================================
// 3. SEEDING & EXECUTION
// =================================================================

const initializeDatabase = async () => {
    await connectDB();

    console.log("🛠  Checking System Settings...");
    const existingSettings = await SystemSettings.findOne({ key: 'global_config' });

    if (!existingSettings) {
        console.log("⚙️  Creating Default System Settings...");
        await SystemSettings.create({
            key: 'global_config',
            activePaymentModes: [
                { name: 'Cash', type: 'Cash' },
                { name: 'PhonePe', type: 'Online' },
                { name: 'GPay', type: 'Online' },
                { name: 'Paytm', type: 'Online' }
            ],
            creditScoreRules: {
                dailyOnTime: 10,
                dailyLate: -5,
                monthlyOnTime: 20,
                defaultPenalty: -50
            },
            bonusRules: {
                dailyFixedReward: 1,
                dailyBulkReduction: 0.5,
                monthlyPrincipalPercent: 3,
                monthlyInterestPercent: 1
            }
        });
        console.log("✅ Default Settings Created.");
    } else {
        console.log("✅ System Settings already exist.");
    }

    console.log("🚀 All 17 Collections are initialized in Mongoose!");
    console.log("   (MongoDB will physically create them when you add the first document).");
    
    // Optional: Create a Dummy Admin User if none exists
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
        console.log("👤 Creating Dummy Admin User...");
        // In real app, hash this password!
        await User.create({
            name: "Super Admin",
            mobile: "9999999999",
            password: "admin_password", 
            role: "admin"
        });
        console.log("✅ Dummy Admin Created (Mobile: 9999999999).");
    }

    console.log("🎉 Database Setup Complete!");
    process.exit(0);
};

initializeDatabase();