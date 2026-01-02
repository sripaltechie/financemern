const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['admin', 'lender', 'collection_boy'], 
        required: true 
    },
    isActive: { type: Boolean, default: true }, // Block/Blacklist Logic
    
    // Specific to Collection Boys
    needsApproval: { type: Boolean, default: false }, 
    
    // Security Features (Biometric)
    securityConfig: {
        isBiometricEnabled: { type: Boolean, default: false },
        biometricDeviceId: String,
        lastLogin: Date
    },
    
    // Specific to Lenders
    lenderConfig: {
        minimumPayoutThreshold: Number,
        currentBalanceWithAdmin: { type: Number, default: 0 }
    }
}, { timestamps: true });

// --- FIX: REMOVED 'next' PARAMETER ---
// Modern Mongoose async pre-save hook
userSchema.pre('save', async function() {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return;

    // Generate salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash password
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);