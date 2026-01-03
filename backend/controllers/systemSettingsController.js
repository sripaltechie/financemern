const SystemSettings = require('../models/SystemSettings');

// @desc    Get All Settings
// @route   GET /api/settings
const getSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne({ key: 'global_config' });
        if (!settings) {
            // Auto-create if missing (Safe Fallback)
            settings = await SystemSettings.create({
                key: 'global_config',
                activePaymentModes: [{ name: 'Cash', type: 'Cash' }]
            });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Payment Modes List
// @route   PUT /api/settings/payment-modes
const updatePaymentModes = async (req, res) => {
    try {
        const { modes } = req.body; // Expects array: [{name: 'GPay', type: 'Online'}, ...]
        
        const settings = await SystemSettings.findOneAndUpdate(
            { key: 'global_config' },
            { $set: { activePaymentModes: modes } },
            { new: true, upsert: true }
        );

        res.json(settings.activePaymentModes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getSettings, updatePaymentModes };