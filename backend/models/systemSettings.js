const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    key: { type: String, unique: true, default: 'global_config' },
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

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);