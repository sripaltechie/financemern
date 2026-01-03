import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Plus, Trash2, Save, X, Settings } from 'lucide-react';

const PaymentModes = ({ showToast }) => {
    const [modes, setModes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newMode, setNewMode] = useState({ name: '', type: 'Online' });

    // --- API CONFIG ---
    const API_URL = 'http://localhost:5000/api';
    const api = axios.create({ baseURL: API_URL });
    api.interceptors.request.use((config) => {
        const user = JSON.parse(localStorage.getItem('finance_user'));
        if (user && user.token) config.headers.Authorization = `Bearer ${user.token}`;
        return config;
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/settings');
            if (data && data.activePaymentModes) {
                setModes(data.activePaymentModes);
            }
        } catch (err) {
            console.error("Failed to load settings", err);
        }
    };

    const handleAdd = () => {
        if (!newMode.name.trim()) return;
        setModes([...modes, { ...newMode }]);
        setNewMode({ name: '', type: 'Online' });
    };

    const handleDelete = (index) => {
        const updated = modes.filter((_, i) => i !== index);
        setModes(updated);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put('/settings/payment-modes', { modes });
            showToast('Success', 'success', 'Payment Modes Updated!');
        } catch (err) {
            showToast('Error', 'error', 'Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Settings className="w-6 h-6 text-blue-600" /> System Settings
            </h1>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" /> Manage Payment Modes
                </h2>
                
                {/* List Existing */}
                <div className="space-y-3 mb-6">
                    {modes.map((mode, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full ${mode.type === 'Cash' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                                <span className="font-medium text-gray-800">{mode.name}</span>
                                <span className="text-xs text-gray-500 uppercase px-2 py-0.5 bg-gray-200 rounded">{mode.type}</span>
                            </div>
                            <button onClick={() => handleDelete(idx)} className="text-red-400 hover:text-red-600 p-1">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {modes.length === 0 && <p className="text-gray-400 italic text-sm">No payment modes defined.</p>}
                </div>

                {/* Add New */}
                <div className="flex gap-2 items-center mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <input 
                        type="text" 
                        placeholder="Mode Name (e.g. Paytm)" 
                        className="flex-1 p-2 border rounded-lg text-sm"
                        value={newMode.name}
                        onChange={e => setNewMode({ ...newMode, name: e.target.value })}
                    />
                    <select 
                        className="p-2 border rounded-lg text-sm bg-white"
                        value={newMode.type}
                        onChange={e => setNewMode({ ...newMode, type: e.target.value })}
                    >
                        <option value="Online">Online</option>
                        <option value="Cash">Cash</option>
                    </select>
                    <button onClick={handleAdd} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="text-right">
                    <button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="bg-gray-900 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2 ml-auto"
                    >
                        <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModes;