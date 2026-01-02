const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id, role) => {
    // DEBUG: Check if secret exists, otherwise use a fallback to prevent crash
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
        console.warn("⚠️  WARNING: JWT_SECRET is missing in .env file! Using fallback secret.");
    }

    // Use environment variable OR fallback string
    return jwt.sign({ id, role }, secret || "fallback_dev_secret_key_0212", {
        expiresIn: '1d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    try {
        const { name, mobile, password, role } = req.body;

        const userExists = await User.findOne({ mobile });
        if (userExists) {
            return res.status(400).json({ message: 'User with this mobile number already exists' });
        }

        const user = await User.create({
            name,
            mobile,
            password,
            role
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                mobile: user.mobile,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    try {
        const { mobile, password } = req.body;

        const user = await User.findOne({ mobile });

        if (user && (await user.matchPassword(password))) {
            
            if (!user.isActive) {
                return res.status(403).json({ 
                    message: 'Your account has been blocked. Please contact Admin.' 
                });
            }

            // Update Last Login
            user.securityConfig.lastLogin = new Date();
            await user.save({ validateBeforeSave: false });

            res.json({
                _id: user._id,
                name: user.name,
                mobile: user.mobile,
                role: user.role,
                securityConfig: user.securityConfig, 
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid mobile or password' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser };