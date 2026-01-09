import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Wallet, ArrowRight, User, Plus, History, TrendingUp, TrendingDown, CreditCard , X
} from 'lucide-react';



// --- HELPER: SPLIT PAYMENT INPUT COMPONENT ---
const PaymentSplitInput = ({ totalAmount, split, setSplit, availableModes }) => {
    const [currentMode, setCurrentMode] = useState('Cash');
    const [currentAmount, setCurrentAmount] = useState('');

    const splitTotal = split.reduce((sum, item) => sum + Number(item.amount), 0);
    const remaining = totalAmount - splitTotal;

    const handleAdd = () => {
        if (!currentAmount || Number(currentAmount) <= 0) return;
        setSplit([...split, { mode: currentMode, amount: Number(currentAmount) }]);
        setCurrentAmount('');
    };

    const handleRemove = (idx) => {
        setSplit(split.filter((_, i) => i !== idx));
    };

    return (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-700 uppercase">Payment Split</label>
                <span className={`text-xs px-2 py-1 rounded ${Math.abs(remaining) < 1 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {Math.abs(remaining) < 1 ? 'Balanced' : `Remaining: ₹${remaining}`}
                </span>
            </div>
            
            {/* List */}
            <div className="space-y-2 mb-3">
                {split.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 text-sm">
                        <span>{item.mode}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">₹{item.amount}</span>
                            <button type="button" onClick={() => handleRemove(idx)} className="text-red-500 hover:text-red-700"><X className="w-3 h-3" /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            {remaining > 0 && (
                <div className="flex gap-2">
                    <select 
                        className="p-2 border rounded text-sm bg-white flex-1"
                        value={currentMode}
                        onChange={(e) => setCurrentMode(e.target.value)}
                    >
                        {availableModes.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                        {!availableModes.length && <option value="Cash">Cash</option>}
                    </select>
                    <input 
                        type="number" 
                        placeholder="Amount" 
                        className="w-24 p-2 border rounded text-sm"
                        value={currentAmount}
                        onChange={(e) => setCurrentAmount(e.target.value)}
                        onFocus={() => !currentAmount && setCurrentAmount(remaining)}
                    />
                    <button type="button" onClick={handleAdd} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

const LenderCashEntry = ({ showToast }) => {
    // --- STATE ---
    const [lenders, setLenders] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [paymentModes, setPaymentModes] = useState([]); // List from DB
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        lenderId: '',
        amount: '',
        type: 'Deposit', // Deposit or Withdrawal
        notes: ''
    });

     // Split State
    const [paymentSplit, setPaymentSplit] = useState([]);
    const [selectedLenderBalance, setSelectedLenderBalance] = useState(0);

    // --- API CONFIG ---
    const API_URL = 'http://localhost:5000/api';
    const api = axios.create({ baseURL: API_URL });
    api.interceptors.request.use((config) => {
        const user = JSON.parse(localStorage.getItem('finance_user'));
        if (user && user.token) config.headers.Authorization = `Bearer ${user.token}`;
        return config;
    });

    // --- INITIAL FETCH ---
    useEffect(() => {
        fetchLenders();
        fetchSettings();
        fetchHistory();
    }, []);

    const fetchLenders = async () => {
        try {
            const { data } = await api.get('/users?role=lender');
            setLenders(data);
        } catch (err) {
            console.error("Fetch lenders failed", err);
        }
    };

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/settings');
            if (data && data.activePaymentModes) {
                setPaymentModes(data.activePaymentModes);
            }
        } catch (err) {
            console.error("Fetch settings failed", err);
        }
    };

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/lender-transactions');
            setTransactions(data);
        } catch (err) {
            console.error("Fetch history failed", err);
        }
    };

    // --- HANDLERS ---
    const handleLenderChange = (e) => {
        const lenderId = e.target.value;
        const lender = lenders.find(l => l._id === lenderId);
        
        setFormData({ ...formData, lenderId });
        // Update displayed balance
        setSelectedLenderBalance(lender?.lenderConfig?.currentBalanceWithAdmin || 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const splitTotal = paymentSplit.reduce((sum, item) => sum + item.amount, 0);
        const totalAmount = Number(formData.amount);

        if (!formData.lenderId || !formData.amount) {
            showToast('Error', 'error', 'Please fill all fields');
            return;
        }

         // Validate Split
        if (paymentSplit.length === 0) {
             // If no split defined, assume all is default mode (e.g. Cash)
             // Let's auto-add 'Cash' if empty for UX
             paymentSplit.push({ mode: 'Cash', amount: totalAmount });
        } else if (Math.abs(splitTotal - totalAmount) > 1) {
             showToast('Error', 'error', `Split total (${splitTotal}) does not match Amount (${totalAmount})`);
             return;
        }

        setLoading(true);
        try {
            await api.post('/lender-transactions', {
                ...formData,
                paymentSplit
            });
            
            showToast('Success', 'success', 'Transaction Recorded Successfully');
            
            // Reset Form
            setFormData({ ...formData, amount: '', notes: '' });
             setPaymentSplit([]);
             
            // Refresh Data
            fetchLenders(); // To update balance in dropdown
            fetchHistory(); // To update table
            
        } catch (err) {
            showToast('Error', 'error', err.response?.data?.message || 'Failed to record');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Wallet className="w-6 h-6 text-blue-600" /> Lender Cash Management
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* --- LEFT: ENTRY FORM --- */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                    <h2 className="font-bold text-gray-700 mb-4">New Entry</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Lender Select */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Select Lender</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <select 
                                    className="w-full pl-10 p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                    value={formData.lenderId}
                                    onChange={handleLenderChange}
                                >
                                    <option value="">-- Choose Lender --</option>
                                    {lenders.map(l => (
                                        <option key={l._id} value={l._id}>
                                            {l.name} (Bal: ₹{l.lenderConfig?.currentBalanceWithAdmin || 0})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {formData.lenderId && (
                                <p className="text-xs text-blue-600 mt-2 font-medium flex items-center gap-1">
                                    <Wallet className="w-3 h-3" /> 
                                    Current Balance: ₹{selectedLenderBalance}
                                </p>
                            )}
                        </div>

                        {/* Transaction Type */}
                        <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
                            {['Deposit', 'Withdrawal'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: t })}
                                    className={`py-2 text-sm font-medium rounded-md transition-all ${
                                        formData.type === t 
                                        ? (t === 'Deposit' ? 'bg-green-500 text-white shadow' : 'bg-red-500 text-white shadow')
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>                       
                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-gray-500 font-bold">₹</span>
                                <input 
                                    type="number" 
                                    className="w-full pl-8 p-3 border rounded-xl font-bold text-lg text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Payment Split Input */}
                        {Number(formData.amount) > 0 && (
                            <PaymentSplitInput 
                                totalAmount={Number(formData.amount)} 
                                split={paymentSplit} 
                                setSplit={setPaymentSplit} 
                                availableModes={paymentModes} 
                            />
                        )}
                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
                            <textarea 
                                className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                rows="2"
                                placeholder="Bank Ref, Check No..."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <button 
                            disabled={loading}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${
                                formData.type === 'Deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            {loading ? 'Processing...' : (formData.type === 'Deposit' ? 'Add Funds' : 'Withdraw Funds')}
                        </button>
                    </form>
                </div>

                {/* --- RIGHT: HISTORY TABLE --- */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            <History className="w-4 h-4" /> Recent Transactions
                        </h2>
                    </div>
                    
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Lender</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Mode</th> 
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-400">No transactions found.</td>
                                    </tr>
                                ) : (
                                    transactions.map(tx => (
                                        <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-gray-500">
                                                {new Date(tx.date).toLocaleDateString()} <br/>
                                                <span className="text-xs">{new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </td>
                                            <td className="p-4 font-medium text-gray-800">
                                                {tx.lenderId?.name || 'Unknown'} <br/>
                                                <span className="text-xs text-gray-400">{tx.lenderId?.mobile}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold flex w-fit items-center gap-1 ${
                                                    tx.type === 'Deposit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {tx.type === 'Deposit' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {tx.paymentSplit && tx.paymentSplit.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {tx.paymentSplit.map((s, i) => (
                                                            <div key={i} className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded w-fit border border-gray-200">
                                                                {s.mode}: ₹{s.amount}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Cash (Legacy)</span>
                                                )}
                                            </td>
                                            <td className={`p-4 font-bold ${tx.type === 'Deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.type === 'Deposit' ? '+' : '-'} ₹{tx.amount}
                                            </td>
                                            <td className="p-4 text-gray-500 max-w-xs truncate" title={tx.notes}>
                                                {tx.notes || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LenderCashEntry;