const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    
    locations: {
        residence: { 
            addressText: String, 
            geo: { lat: Number, lng: Number } 
        },
        collectionPoint: { 
            addressText: String,
            placeType: { type: String, enum: ['Shop', 'Home', 'Other'], default: 'Home' },
            geo: { lat: Number, lng: Number } 
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

    // --- NEW FIELDS ---
    incomeSource: { type: String, enum: ['Daily Wage', 'Monthly Salary'] },
    incomeAmount: { type: Number },
    proofs: [{ type: String }],
    
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },

    // *** THIS WAS MISSING ***
    collectionBoyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // ************************

    creditScore: { type: Number, default: 500 },
    level: { type: String, enum: ['Level 1', 'Level 2', 'Level 3'], default: 'Level 1' },
    bonusCoins: { type: Number, default: 0 },
    
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);