const User = require('../models/User');

// @desc    Get users by role (e.g., ?role=collection_boy)
// @route   GET /api/users
const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.query;
        const query = role ? { role } : {};
        
        const users = await User.find(query).select('-password'); // Exclude password
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getUsersByRole };