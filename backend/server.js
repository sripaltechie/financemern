const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load Config
dotenv.config();

// Initialize App
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*', // Allows mobile devices and web browsers to connect
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Database Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/finance_mern_db");
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

// Routes
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const loanRoutes = require('./routes/loanRoutes'); 
const userRoutes = require('./routes/userRoutes'); 
const transactionRoutes = require('./routes/transactionRoutes');
const lenderTransactionRoutes = require('./routes/lenderTransactionRoutes');
const systemSettingsRoutes = require('./routes/systemSettingsRoutes'); 

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/loans', loanRoutes);app.use('/api/users', userRoutes); 
app.use('/api/transactions', transactionRoutes);
app.use('/api/lender-transactions', lenderTransactionRoutes);
app.use('/api/settings', systemSettingsRoutes); 

// Base Route
app.get('/', (req, res) => {
    res.send('Finance & Lending API is running...');
});

// Add this near your other routes
const User = require('./models/User'); // Ensure this path is correct

app.get('/api/admin-check', async (req, res) => {
    try {
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            res.json({ name: admin.name, role: admin.role });
        } else {
            res.status(404).json({ message: "No admin found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});


// Start Server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
});