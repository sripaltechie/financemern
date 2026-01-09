import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Calculator, Wallet, Plus, CreditCard } from 'lucide-react';
import api from '../utils/api';
import PaymentSplitInput from './PaymentSplitInput';

const LoanForm = ({ customer, collectionBoys, onClose, onSuccess, onUpdateCustomer, showToast }) => {
  const LoanForm = ({ customer, collectionBoys, onClose, onSuccess, onUpdateCustomer, showToast }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Payment Modes State
    const [paymentModes, setPaymentModes] = useState([]);
    
    // Missing Collection Boy Logic
    const [missingLinkMode, setMissingLinkMode] = useState(false);
    const [selectedBoyId, setSelectedBoyId] = useState('');
  
    // Lenders List State
    const [lendersList, setLendersList] = useState([]);
    const [lenderSplits, setLenderSplits] = useState([]); 
    const [currentLenderSelection, setCurrentLenderSelection] = useState({ userId: '', amount: '' });
  
    // Disbursement Split State
    const [disbursementSplit, setDisbursementSplit] = useState([]);
  
    // State for Form
    const [formData, setFormData] = useState({
      customerId: customer._id,
      loanType: 'Daily',
      financials: {
        principalAmount: '',
        interestRate: '', 
        duration: 100, 
        interestDurationMonths: 3, 
        fixedInstallmentAmount: '', 
        deductionConfig: {
          interest: 'End',
          adminCommission: 'End', 
          staffCommission: 'End' 
        },
        adminCommission: { type: 'Percentage', value: '', amount: '' },
        staffCommission: { type: 'Percentage', value: '', amount: '' }
      },
      penaltyConfig: { method: 'None', value: 0, frequency: 'OneTime' },
      notes: '' 
    });
  
    const [netDisbursement, setNetDisbursement] = useState(0);
    const [deductions, setDeductions] = useState({ interest: 0, adminComm: 0, staffComm: 0 });
  
    useEffect(() => {
      const fetchLenders = async () => {
          try { const { data } = await api.get('/users?role=lender'); setLendersList(data); } catch (err) {}
      };
      const fetchModes = async () => {
          try { 
              const { data } = await api.get('/settings'); 
              if(data && data.activePaymentModes) setPaymentModes(data.activePaymentModes);
          } catch (err) {}
      };
  
      fetchLenders();
      fetchModes();
      if (!customer.collectionBoyId) setMissingLinkMode(true);
    }, [customer]);
  
    const handleLinkBoy = async () => {
      if (!selectedBoyId) return;
      setLoading(true);
      try {
        await api.put(`/customers/${customer._id}`, { collectionBoyId: selectedBoyId });
        if (onUpdateCustomer) onUpdateCustomer({ ...customer, collectionBoyId: selectedBoyId });
        setMissingLinkMode(false);
        showToast('Linked Successfully', 'success', 'Collection Boy assigned.');
      } catch (err) { setError(err.response?.data?.message || 'Failed'); } finally { setLoading(false); }
    };
  
    // --- CALCULATION LOGIC ---
    useEffect(() => {
      const principal = Number(formData.financials.principalAmount) || 0;
      const rate = Number(formData.financials.interestRate) || 0;
      const duration = Number(formData.financials.duration) || 0;
      const intMonths = Number(formData.financials.interestDurationMonths) || 0;
      
      const adminCommVal = Number(formData.financials.adminCommission.amount) || 0;
      const staffCommVal = Number(formData.financials.staffCommission.amount) || 0;
  
      let interestDed = 0;
      let adminCommDed = 0;
      let staffCommDed = 0;
  
      if (formData.financials.deductionConfig.interest === 'Upfront') {
        interestDed = (principal * rate * intMonths) / 100;
      }
  
      if (formData.financials.deductionConfig.adminCommission === 'Upfront') adminCommDed = adminCommVal;
      if (formData.financials.deductionConfig.staffCommission === 'Upfront') staffCommDed = staffCommVal;
  
      setDeductions({ interest: interestDed, adminComm: adminCommDed, staffComm: staffCommDed });
      setNetDisbursement(principal - interestDed - adminCommDed - staffCommDed);
    }, [
      formData.financials.principalAmount, formData.financials.interestRate, formData.financials.duration,
      formData.financials.interestDurationMonths, 
      formData.financials.adminCommission.amount, formData.financials.staffCommission.amount,
      formData.financials.deductionConfig
    ]);
  
    const fundedAmount = lenderSplits.reduce((sum, item) => sum + Number(item.amount), 0);
    const remainingFund = netDisbursement - fundedAmount;
  
    const addLenderSplit = () => {
      const { userId, amount } = currentLenderSelection;
      if(!userId || !amount) return;
      const lenderObj = lendersList.find(l => l._id === userId);
      const availableBalance = lenderObj?.lenderConfig?.currentBalanceWithAdmin || 0;
      
      if (Number(amount) > availableBalance) { showToast('Insufficient Balance', 'error', `Available: ₹${availableBalance}`); return; }
      if (Number(amount) > remainingFund) { showToast('Exceeds Needed', 'error', `Needed: ₹${remainingFund}`); return; }
      
      setLenderSplits(prev => [...prev, { userId, name: lenderObj?.name, amount: Number(amount), priority: prev.length + 1 }]);
      setCurrentLenderSelection({ userId: '', amount: '' });
    };
  
    const removeLenderSplit = (index) => setLenderSplits(prev => prev.filter((_, i) => i !== index));
  
    const handleTypeChange = (e) => {
      const type = e.target.value;
      let defDuration = 100;
      let defIntMonths = 3; 
      if (type === 'Weekly') { defDuration = 14; defIntMonths = 3; }
      if (type === 'Monthly') { defDuration = 1; defIntMonths = 1; }
  
      setFormData(prev => ({
          ...prev, 
          loanType: type,
          financials: { ...prev.financials, duration: defDuration, interestDurationMonths: defIntMonths }
      }));
    };
  
    const handleCommissionChange = (who, field, value) => {
      const principal = Number(formData.financials.principalAmount) || 0;
      let newAmount = 0;
      let newPercent = 0;
  
      if (field === 'value') { 
          newPercent = Number(value);
          newAmount = (principal * newPercent) / 100;
          setFormData(prev => ({ ...prev, financials: { ...prev.financials, [who]: { ...prev.financials[who], value: value, amount: newAmount } } }));
      } else { 
          newAmount = Number(value);
          newPercent = principal > 0 ? (newAmount / principal) * 100 : 0;
          setFormData(prev => ({ ...prev, financials: { ...prev.financials, [who]: { ...prev.financials[who], value: newPercent.toFixed(2), amount: value } } }));
      }
    };
  
    const updateFinancials = (field, value) => setFormData(p => ({ ...p, financials: { ...p.financials, [field]: value } }));
    const updateNestedFinancials = (section, field, value) => setFormData(p => ({ ...p, financials: { ...p.financials, [section]: { ...p.financials[section], [field]: value } } }));
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
  
      const splitTotal = disbursementSplit.reduce((sum, item) => sum + item.amount, 0);
  
      if (lenderSplits.length === 0) { setError("Link at least one lender."); setLoading(false); return; }
      if (Math.abs(remainingFund) > 1) { setError(`Funding mismatch. Diff: ₹${remainingFund}`); setLoading(false); return; }
      
      // Validate Split vs Net Disbursement
      let finalSplit = [...disbursementSplit];
      if (finalSplit.length === 0) {
          finalSplit = [{ mode: 'Cash', amount: netDisbursement }];
      } else if (Math.abs(splitTotal - netDisbursement) > 1) {
          setError(`Disbursement Split Total (${splitTotal}) must match Net Cash (${netDisbursement})`);
          setLoading(false);
          return;
      }
  
      try {
        const payload = {
            ...formData,
            disbursementSplit: finalSplit,
            lenders: lenderSplits.map(l => ({ userId: l.userId, investedAmount: l.amount, repaidAmount: 0, priority: l.priority, status: 'Active' }))
        };
        await api.post('/loans', payload);
        showToast('Loan Created', 'success', `Disbursed ₹${netDisbursement}`);
        onSuccess();
      } catch (err) { setError(err.response?.data?.message || 'Failed'); } finally { setLoading(false); }
    };
  
    if (missingLinkMode) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="bg-white p-6 rounded-xl w-full max-w-md text-center"><h2 className="text-xl font-bold">Link Collection Boy</h2><select className="w-full p-3 border rounded my-4" value={selectedBoyId} onChange={e => setSelectedBoyId(e.target.value)}><option value="">Select</option>{collectionBoys.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}</select><button onClick={handleLinkBoy} className="w-full bg-blue-600 text-white py-3 rounded">Link</button></div></div>;
  
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
            <div><h2 className="text-xl font-bold">New Loan</h2><p className="text-sm text-gray-500">{customer.fullName}</p></div>
            <button onClick={onClose}><X className="w-5 h-5" /></button>
          </div>
  
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded flex items-center gap-2"><ShieldAlert className="w-4 h-4" />{error}</div>}
  
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                 <label className="block text-sm font-medium mb-1">Type</label>
                 <select className="w-full p-2 border rounded" value={formData.loanType} onChange={handleTypeChange}>
                   <option value="Daily">Daily</option><option value="Weekly">Weekly</option><option value="Monthly">Monthly</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium mb-1">Principal</label>
                 <input type="number" className="w-full p-2 border rounded font-bold" value={formData.financials.principalAmount} onChange={e => updateFinancials('principalAmount', e.target.value)} required />
              </div>
              <div>
                 <label className="block text-sm font-medium mb-1">
                     {formData.loanType === 'Daily' ? 'Days' : formData.loanType === 'Weekly' ? 'Weeks' : 'Months'}
                 </label>
                 <input type="number" className="w-full p-2 border rounded" value={formData.financials.duration} onChange={e => updateFinancials('duration', e.target.value)} />
              </div>
              <div>
                 <label className="block text-sm font-medium mb-1">Interest Rate (%/mo)</label>
                 <input type="number" className="w-full p-2 border rounded" value={formData.financials.interestRate} onChange={e => updateFinancials('interestRate', e.target.value)} required />
              </div>
            </div>
             
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-blue-800">Interest Calc (Months)</label>
                    <input type="number" className="w-full p-2 border rounded border-blue-200 bg-blue-50" value={formData.financials.interestDurationMonths} onChange={e => updateFinancials('interestDurationMonths', e.target.value)} />
                </div>
            </div>
  
            {/* Conditional Weekly Input */}
            {formData.loanType === 'Weekly' && (
               <div className="bg-amber-50 p-3 rounded border border-amber-200">
                  <label className="block text-sm font-bold text-amber-800 mb-1">Fixed Weekly Installment</label>
                  <input type="number" placeholder="e.g. 2000" className="w-full p-2 border rounded" value={formData.financials.fixedInstallmentAmount} onChange={e => updateFinancials('fixedInstallmentAmount', e.target.value)} />
                  <p className="text-xs text-amber-600 mt-1">System will auto-calculate last installment balance.</p>
               </div>
            )}
  
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
               <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2"><Calculator className="w-4 h-4" /> Deductions</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                      <label className="text-xs font-bold text-blue-800 uppercase block mb-2">Interest</label>
                      <div className="flex bg-white rounded p-0.5 border w-fit">
                          {['Upfront', 'End'].map(type => (
                          <button key={type} type="button" onClick={() => updateNestedFinancials('deductionConfig', 'interest', type)} className={`px-3 py-1 text-xs rounded ${formData.financials.deductionConfig.interest === type ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>{type}</button>
                          ))}
                      </div>
                  </div>
                  <div>
                     <div className="flex justify-between items-center mb-1"><label className="text-xs font-bold text-blue-800 uppercase">Admin Comm.</label><div className="flex bg-white rounded p-0.5 border">{['Upfront', 'End'].map(type => (<button key={type} type="button" onClick={() => updateNestedFinancials('deductionConfig', 'adminCommission', type)} className={`px-2 py-0.5 text-xs rounded ${formData.financials.deductionConfig.adminCommission === type ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>{type}</button>))}</div></div>
                     <div className="flex gap-2"><input type="number" placeholder="%" className="w-1/3 p-2 border rounded text-sm" value={formData.financials.adminCommission.value} onChange={e => handleCommissionChange('adminCommission', 'value', e.target.value)} /><input type="number" placeholder="₹" className="w-2/3 p-2 border rounded text-sm font-bold" value={formData.financials.adminCommission.amount} onChange={e => handleCommissionChange('adminCommission', 'amount', e.target.value)} /></div>
                  </div>
                  <div>
                     <div className="flex justify-between items-center mb-1"><label className="text-xs font-bold text-blue-800 uppercase">Staff Comm.</label><div className="flex bg-white rounded p-0.5 border">{['Upfront', 'End'].map(type => (<button key={type} type="button" onClick={() => updateNestedFinancials('deductionConfig', 'staffCommission', type)} className={`px-2 py-0.5 text-xs rounded ${formData.financials.deductionConfig.staffCommission === type ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>{type}</button>))}</div></div>
                     <div className="flex gap-2"><input type="number" placeholder="%" className="w-1/3 p-2 border rounded text-sm" value={formData.financials.staffCommission.value} onChange={e => handleCommissionChange('staffCommission', 'value', e.target.value)} /><input type="number" placeholder="₹" className="w-2/3 p-2 border rounded text-sm font-bold" value={formData.financials.staffCommission.amount} onChange={e => handleCommissionChange('staffCommission', 'amount', e.target.value)} /></div>
                  </div>
               </div>
            </div>
  
            {/* NEW: Payment Split for Disbursement */}
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <h3 className="font-semibold text-indigo-900 mb-2 text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Disbursement Mode
                </h3>
                {netDisbursement > 0 && (
                    <PaymentSplitInput 
                        totalAmount={netDisbursement}
                        split={disbursementSplit}
                        setSplit={setDisbursementSplit}
                        availableModes={paymentModes}
                    />
                )}
            </div>
  
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
               <div className="flex justify-between items-center mb-3">
                   <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Wallet className="w-4 h-4" /> Lenders</h3>
                   <span className={`text-xs font-bold px-2 py-1 rounded ${remainingFund === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{remainingFund === 0 ? 'Funded' : `Need: ₹${remainingFund}`}</span>
               </div>
               <div className="flex gap-2 mb-3">
                   <select className="flex-1 p-2 border rounded text-sm" value={currentLenderSelection.userId} onChange={e => setCurrentLenderSelection({ ...currentLenderSelection, userId: e.target.value })}>
                      <option value="">Select Lender...</option>
                      {lendersList.map(l => (<option key={l._id} value={l._id} disabled={lenderSplits.some(split => split.userId === l._id)}>{l.name} - Bal: ₹{l.lenderConfig?.currentBalanceWithAdmin || 0}</option>))}
                   </select>
                   <input type="number" placeholder="Amt" className="w-24 p-2 border rounded text-sm" value={currentLenderSelection.amount} onChange={e => setCurrentLenderSelection({ ...currentLenderSelection, amount: e.target.value })} onFocus={() => !currentLenderSelection.amount && remainingFund > 0 && setCurrentLenderSelection(prev => ({ ...prev, amount: remainingFund }))} />
                   <button type="button" onClick={addLenderSplit} disabled={!currentLenderSelection.userId} className="bg-gray-800 text-white px-3 rounded hover:bg-black disabled:bg-gray-300"><Plus className="w-4 h-4" /></button>
               </div>
               <div className="space-y-1">
                   {lenderSplits.map((split, idx) => (
                       <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border text-sm">
                           <span>{split.name}</span>
                           <div className="flex items-center gap-2 font-bold">₹{split.amount} <button type="button" onClick={() => removeLenderSplit(idx)} className="text-red-500"><X className="w-4 h-4" /></button></div>
                       </div>
                   ))}
               </div>
            </div>
  
            <div className="bg-gray-900 text-white p-5 rounded-xl shadow-lg flex items-center justify-between">
               <div><p className="text-gray-400 text-xs uppercase font-bold">Net Cash</p><h3 className="text-3xl font-bold mt-1">₹ {netDisbursement.toLocaleString()}</h3></div>
               <button disabled={loading || remainingFund !== 0} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold disabled:bg-gray-600">Disburse</button>
            </div>
  
          </form>
        </div>
      </div>
    );
  };
//   ... (Make sure to export default LoanForm) ...
};

export default LoanForm;