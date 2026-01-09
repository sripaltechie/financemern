import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

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

export default PaymentSplitInput;