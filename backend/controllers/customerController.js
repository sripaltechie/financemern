const Customer = require('../models/Customer');
const Loan = require('../models/Loan');

// @desc    Create a new customer
// @route   POST /api/customers
const createCustomer = async (req, res) => {
    try {
        const { 
            fullName, mobile, locations, kyc, familyMembers, 
            incomeSource, incomeAmount, proofs, referredBy, collectionBoyId 
        } = req.body;

        const mobileExists = await Customer.findOne({ mobile });
        if (mobileExists) {
            return res.status(400).json({ message: 'Customer with this mobile already exists.' });
        }

        if (kyc.rationCardNumber) {
            const rationExists = await Customer.findOne({ 'kyc.rationCardNumber': kyc.rationCardNumber });
            if (rationExists) {
                return res.status(400).json({ 
                    message: `Ration Card conflict! Used by ${rationExists.fullName}.` 
                });
            }
        }

        let referrerId = null;
        if (referredBy && referredBy !== '') referrerId = referredBy;

        // Create Customer
        const customer = await Customer.create({
            fullName,
            mobile,
            locations,
            kyc,
            familyMembers,
            incomeSource,
            incomeAmount: Number(incomeAmount) || 0,
            proofs,
            referredBy: referrerId,
            collectionBoyId: collectionBoyId || null, // Ensure this is saved
            level: 'Level 1',
            creditScore: 500
        });

        res.status(201).json(customer);

    } catch (error) {
        console.error("Create Customer Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Customers
// @route   GET /api/customers
const getCustomers = async (req, res) => {
    try {
        const { search, level } = req.query;
        let query = { isActive: true };

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } },
                { 'kyc.rationCardNumber': { $regex: search, $options: 'i' } }
            ];
        }

        if (level) query.level = level;

        const customers = await Customer.find(query)
            .populate('referredBy', 'fullName mobile')
            .sort({ createdAt: -1 });
            
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Single Customer Detail
// @route   GET /api/customers/:id
const getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id).populate('referredBy', 'fullName mobile');
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        
        const activeLoans = await Loan.find({ customerId: customer._id, status: 'Active' });

        res.json({ ...customer.toObject(), activeLoans });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Customer (For Linking Collection Boy or Editing)
// @route   PUT /api/customers/:id
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find and update
        const updatedCustomer = await Customer.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true } // Return updated doc
        );

        if (!updatedCustomer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json(updatedCustomer);
    } catch (error) {
        console.error("Update Customer Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check for Family/Ration Conflicts
// @route   POST /api/customers/check-conflict
const checkConflict = async (req, res) => {
    try {
        const { mobile, rationCardNumber } = req.body;
        let warnings = [];

        if (rationCardNumber) {
            const rationMatch = await Customer.findOne({ 'kyc.rationCardNumber': rationCardNumber });
            if (rationMatch) {
                const hasLoan = await Loan.exists({ customerId: rationMatch._id, status: 'Active' });
                if (hasLoan) {
                    warnings.push(`Ration Card matches ${rationMatch.fullName} who has an ACTIVE LOAN.`);
                }
            }
        }

        const reverseMatch = await Customer.findOne({ 
            'familyMembers.mobile': mobile,
            level: 'Level 3' 
        });
        if (reverseMatch) {
            warnings.push(`This person is listed as a relative of ${reverseMatch.fullName} (who is a DEFAULTER).`);
        }

        res.json({ hasConflict: warnings.length > 0, warnings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { 
    createCustomer, 
    getCustomers, 
    getCustomerById, 
    checkConflict,
    updateCustomer // <--- CRITICAL: Make sure this is exported
};