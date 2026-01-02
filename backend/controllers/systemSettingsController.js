const SystemSettings = require('../models/systemSettings');

// @desc    Get Global Config (Payment Modes, Rules)
// @route   GET /api/settings
const getSettings = async (req, res) => {
    try {
        // Fetch the config document (assuming single singleton document)
        let settings = await SystemSettings.findOne({ key: 'global_config' });
        
        // Fallback if not found (Should have been seeded, but safety first)
        if (!settings) {
            return res.status(404).json({ message: 'System settings not initialized' });
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getSettings };