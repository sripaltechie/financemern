import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  User, Lock, Phone, ArrowRight, LayoutDashboard, LogOut, ShieldAlert, 
  Wallet, Users, Banknote, Menu, X, Plus, Search, MapPin, Check, Trash2, Home, Briefcase, FileText, Calculator, Percent, FilePenLine, UserCheck,Settings
} from 'lucide-react';
import LenderCashEntry from './LenderCashEntry';
import PaymentModes from './PaymentModes';

// --- CONFIGURATION ---
const API_URL = 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('finance_user'));
  if (user && user.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

// --- TOAST NOTIFICATION COMPONENT ---
const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(onClose, 3000); // Auto close after 3s
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className={`fixed top-5 right-5 z-[60] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all transform animate-in slide-in-from-right duration-300 ${
      toast.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
    }`}>
      {toast.type === 'error' ? <ShieldAlert className="w-5 h-5" /> : <Check className="w-5 h-5" />}
      <div>
        <h4 className="font-bold text-sm">{toast.title}</h4>
        <p className="text-xs opacity-90">{toast.message}</p>
      </div>
      <button onClick={onClose} className="ml-2 hover:bg-black/5 p-1 rounded-full"><X className="w-4 h-4" /></button>
    </div>
  );
};

// --- 1. SIDEBAR NAVIGATION ---
const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: Wallet, label: 'Loans (Chits)', path: '/loans' }, 
    { icon: Banknote, label: 'Collections', path: '/collections' },
    { icon: Briefcase, label: 'Lender Cash', path: '/lender-cash' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0 z-20 hidden md:flex">
      {/* Brand */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Banknote className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-wide">FinancePro</h1>
          <p className="text-xs text-slate-400">v1.2 Admin</p>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
              isActive(item.path) 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
            <span className="font-medium text-sm">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user.role}</p>
          </div>
          <button onClick={onLogout} className="p-1.5 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};


// --- 2. LOAN FORM MODAL (Updated for New Schema Logic) ---
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

  // State for Form
  const [formData, setFormData] = useState({
    customerId: customer._id,
    loanType: 'Daily',
    disbursementMode: 'Cash', // Default
    financials: {
      principalAmount: '',
      interestRate: '', 
      duration: 100, // Default 100 Days for Daily
      interestDurationMonths: 3, // NEW: Default 3 months interest for 100 days
      fixedInstallmentAmount: '', // For Weekly
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
    // Fetch Lenders
    const fetchLenders = async () => {
        try { const { data } = await api.get('/users?role=lender'); setLendersList(data); } catch (err) {}
    };
    // Fetch Payment Modes
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
      // Use the manual months input for calculation

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

    if (lenderSplits.length === 0) { setError("Link at least one lender."); setLoading(false); return; }
    if (Math.abs(remainingFund) > 1) { setError(`Funding mismatch. Diff: ₹${remainingFund}`); setLoading(false); return; }

    try {
      const payload = {
          ...formData,
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
               {/* DYNAMIC LABEL FOR DURATION */}
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
            {/* NEW: Interest Duration Input (Separate Row or inline) */}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                  <label className="block text-sm font-medium mb-1 text-blue-800">Interest Calc (Months)</label>
                  <input type="number" className="w-full p-2 border rounded border-blue-200 bg-blue-50" value={formData.financials.interestDurationMonths} onChange={e => updateFinancials('interestDurationMonths', e.target.value)} />
              </div>

              {/* NEW: Disbursement Mode */}
              <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Disbursement Mode</label>
                  <select 
                      className="w-full p-2 border rounded bg-white" 
                      value={formData.disbursementMode} 
                      onChange={e => setFormData({ ...formData, disbursementMode: e.target.value })}
                  >
                      {paymentModes.length > 0 ? (
                          paymentModes.map(m => <option key={m.name} value={m.name}>{m.name}</option>)
                      ) : (
                          <option value="Cash">Cash</option>
                      )}
                  </select>
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
                
                {/* Interest Toggle */}
                <div>
                    <label className="text-xs font-bold text-blue-800 uppercase block mb-2">Interest</label>
                    <div className="flex bg-white rounded p-0.5 border w-fit">
                        {['Upfront', 'End'].map(type => (
                        <button key={type} type="button" onClick={() => updateNestedFinancials('deductionConfig', 'interest', type)} className={`px-3 py-1 text-xs rounded ${formData.financials.deductionConfig.interest === type ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>{type}</button>
                        ))}
                    </div>
                </div>

                {/* Admin Comm */}
                <div>
                   <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-blue-800 uppercase">Admin Comm.</label>
                      <div className="flex bg-white rounded p-0.5 border">
                        {['Upfront', 'End'].map(type => (
                          <button key={type} type="button" onClick={() => updateNestedFinancials('deductionConfig', 'adminCommission', type)} className={`px-2 py-0.5 text-xs rounded ${formData.financials.deductionConfig.adminCommission === type ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>{type}</button>
                        ))}
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <input type="number" placeholder="%" className="w-1/3 p-2 border rounded text-sm" value={formData.financials.adminCommission.value} onChange={e => handleCommissionChange('adminCommission', 'value', e.target.value)} />
                      <input type="number" placeholder="₹" className="w-2/3 p-2 border rounded text-sm font-bold" value={formData.financials.adminCommission.amount} onChange={e => handleCommissionChange('adminCommission', 'amount', e.target.value)} />
                   </div>
                </div>

                {/* Staff Comm */}
                <div>
                   <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-blue-800 uppercase">Staff Comm.</label>
                      <div className="flex bg-white rounded p-0.5 border">
                        {['Upfront', 'End'].map(type => (
                          <button key={type} type="button" onClick={() => updateNestedFinancials('deductionConfig', 'staffCommission', type)} className={`px-2 py-0.5 text-xs rounded ${formData.financials.deductionConfig.staffCommission === type ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>{type}</button>
                        ))}
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <input type="number" placeholder="%" className="w-1/3 p-2 border rounded text-sm" value={formData.financials.staffCommission.value} onChange={e => handleCommissionChange('staffCommission', 'value', e.target.value)} />
                      <input type="number" placeholder="₹" className="w-2/3 p-2 border rounded text-sm font-bold" value={formData.financials.staffCommission.amount} onChange={e => handleCommissionChange('staffCommission', 'amount', e.target.value)} />
                   </div>
                </div>
             </div>
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



// --- 3. CUSTOMER FORM MODAL ---
const CustomerForm = ({ onClose, onSuccess, existingCustomers, collectionBoys }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    incomeSource: 'Daily Wage',
    incomeAmount: '',
    locations: {
      residence: { addressText: '' },
      collectionPoint: { 
        placeType: 'Home',
        geo: { lat: '', lng: '' }
      }
    },
    kyc: {
      aadhaarNumber: '',
      rationCardNumber: ''
    },
    familyMembers: [],
    proofs: [],
    referredBy: '',
    collectionBoyId: '' // NEW Field
  });

  const [newFamily, setNewFamily] = useState({ name: '', relation: '', mobile: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Typeahead State
  const [referrerQuery, setReferrerQuery] = useState('');
  const [showReferrerDropdown, setShowReferrerDropdown] = useState(false);

  // Helper to get location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
           setFormData(prev => ({
             ...prev,
             locations: {
               ...prev.locations,
               collectionPoint: {
                 ...prev.locations.collectionPoint,
                 geo: { lat: position.coords.latitude, lng: position.coords.longitude }
               }
             }
           }));
        },
        (error) => alert("Error getting location: " + error.message)
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleAddFamily = () => {
    if (newFamily.name && newFamily.relation) {
      setFormData(prev => ({
        ...prev,
        familyMembers: [...prev.familyMembers, newFamily]
      }));
      setNewFamily({ name: '', relation: '', mobile: '' });
    }
  };

  const handleRemoveFamily = (index) => {
    setFormData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index)
    }));
  };

  const handleProofToggle = (proof) => {
    if (formData.proofs.includes(proof)) {
      setFormData(prev => ({ ...prev, proofs: prev.proofs.filter(p => p !== proof) }));
    } else {
      setFormData(prev => ({ ...prev, proofs: [...prev.proofs, proof] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/customers', formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">Add New Customer</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                required
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <input 
                required
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.mobile}
                onChange={e => setFormData({...formData, mobile: e.target.value})}
              />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Income Source</label>
               <select 
                 className="w-full p-2 border rounded-lg bg-white"
                 value={formData.incomeSource}
                 onChange={e => setFormData({...formData, incomeSource: e.target.value})}
               >
                 <option value="Daily Wage">Daily Wage</option>
                 <option value="Monthly Salary">Monthly Salary</option>
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Income Amount (₹)</label>
               <input 
                 type="number"
                 placeholder="e.g. 500 or 15000"
                 className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                 value={formData.incomeAmount}
                 onChange={e => setFormData({...formData, incomeAmount: e.target.value})}
               />
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" /> Locations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="text-xs text-gray-500 font-bold uppercase">Residence Address</label>
                  <textarea 
                    className="w-full p-2 border rounded-lg text-sm mt-1"
                    rows="3"
                    value={formData.locations.residence.addressText}
                    onChange={e => setFormData({
                      ...formData, 
                      locations: { ...formData.locations, residence: { ...formData.locations.residence, addressText: e.target.value } }
                    })}
                  />
               </div>
               <div>
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-500 font-bold uppercase">Collection Point</label>
                    <button type="button" onClick={getCurrentLocation} className="text-xs flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100">
                      <MapPin className="w-3 h-3" /> Get Current Location
                    </button>
                  </div>
                  
                  <div className="flex gap-2 mt-1 mb-2">
                    {['Home', 'Shop', 'Other'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          locations: { ...formData.locations, collectionPoint: { ...formData.locations.collectionPoint, placeType: type } }
                        })}
                        className={`px-3 py-1 text-xs rounded-full border ${
                          formData.locations.collectionPoint.placeType === type 
                          ? 'bg-blue-100 border-blue-200 text-blue-700' 
                          : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      placeholder="Latitude"
                      className="p-2 border rounded text-sm bg-gray-50"
                      value={formData.locations.collectionPoint.geo.lat}
                      onChange={e => setFormData({
                        ...formData, 
                        locations: { ...formData.locations, collectionPoint: { ...formData.locations.collectionPoint, geo: { ...formData.locations.collectionPoint.geo, lat: e.target.value } } }
                      })}
                    />
                    <input 
                      placeholder="Longitude"
                      className="p-2 border rounded text-sm bg-gray-50"
                      value={formData.locations.collectionPoint.geo.lng}
                      onChange={e => setFormData({
                        ...formData, 
                        locations: { ...formData.locations, collectionPoint: { ...formData.locations.collectionPoint, geo: { ...formData.locations.collectionPoint.geo, lng: e.target.value } } }
                      })}
                    />
                  </div>
               </div>
            </div>
          </div>

          {/* KYC & Proofs */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" /> KYC & Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input 
                 placeholder="Aadhaar Number"
                 className="p-2 border rounded-lg"
                 value={formData.kyc.aadhaarNumber}
                 onChange={e => setFormData({...formData, kyc: { ...formData.kyc, aadhaarNumber: e.target.value }})}
               />
               <input 
                 placeholder="Ration Card Number"
                 className="p-2 border rounded-lg"
                 value={formData.kyc.rationCardNumber}
                 onChange={e => setFormData({...formData, kyc: { ...formData.kyc, rationCardNumber: e.target.value }})}
               />
            </div>
            
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Proofs Submitted:</label>
              <div className="flex flex-wrap gap-2">
                {['Aadhaar Card', 'Ration Card', 'Green Sheet', 'Promissory Note', 'Cheque'].map(proof => (
                  <label key={proof} className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    formData.proofs.includes(proof) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={formData.proofs.includes(proof)}
                      onChange={() => handleProofToggle(proof)}
                    />
                    {formData.proofs.includes(proof) ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 border rounded-full border-gray-400"></div>}
                    {proof}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* References, Family & Collection Boy */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referred By</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search referrer by name/mobile..."
                      className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={referrerQuery}
                      onChange={(e) => {
                          setReferrerQuery(e.target.value);
                          setShowReferrerDropdown(true);
                          if (formData.referredBy) setFormData(p => ({ ...p, referredBy: '' })); 
                      }}
                      onFocus={() => setShowReferrerDropdown(true)}
                    />
                  </div>
                  
                  {showReferrerDropdown && referrerQuery && (
                     <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                        {existingCustomers?.filter(c => 
                            c.fullName.toLowerCase().includes(referrerQuery.toLowerCase()) || 
                            c.mobile.includes(referrerQuery)
                        ).length > 0 ? (
                            existingCustomers.filter(c => 
                                c.fullName.toLowerCase().includes(referrerQuery.toLowerCase()) || 
                                c.mobile.includes(referrerQuery)
                            ).map(c => (
                                <div 
                                    key={c._id}
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                                    onClick={() => {
                                        setFormData({ ...formData, referredBy: c._id });
                                        setReferrerQuery(`${c.fullName} (${c.mobile})`);
                                        setShowReferrerDropdown(false);
                                    }}
                                >
                                    <p className="text-sm font-medium text-gray-800">{c.fullName}</p>
                                    <p className="text-xs text-gray-500">{c.mobile}</p>
                                </div>
                            ))
                        ) : (
                            <div className="p-3 text-sm text-gray-400 text-center">No matches found</div>
                        )}
                     </div>
                  )}
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link Collection Boy</label>
                  <select 
                    className="w-full p-2 border rounded-lg bg-white"
                    value={formData.collectionBoyId}
                    onChange={e => setFormData({...formData, collectionBoyId: e.target.value})}
                  >
                    <option value="">-- Select --</option>
                    {collectionBoys && collectionBoys.map(boy => (
                      <option key={boy._id} value={boy._id}>{boy.name} ({boy.mobile})</option>
                    ))}
                  </select>
               </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm">Family Members</h3>
              
              <div className="space-y-2">
                {formData.familyMembers.map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 text-sm">
                     <span className="flex items-center gap-2">
                       <Users className="w-3 h-3 text-gray-400" />
                       {member.name} <span className="text-gray-400">({member.relation})</span>
                       {member.mobile && <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{member.mobile}</span>}
                     </span>
                     <button type="button" onClick={() => handleRemoveFamily(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                       <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                 <input 
                   placeholder="Name"
                   className="flex-1 p-2 border rounded text-sm"
                   value={newFamily.name}
                   onChange={e => setNewFamily({...newFamily, name: e.target.value})}
                 />
                 <input 
                   placeholder="Relation"
                   className="w-24 p-2 border rounded text-sm"
                   value={newFamily.relation}
                   onChange={e => setNewFamily({...newFamily, relation: e.target.value})}
                 />
                 <input 
                   placeholder="Mobile"
                   className="w-32 p-2 border rounded text-sm"
                   value={newFamily.mobile}
                   onChange={e => setNewFamily({...newFamily, mobile: e.target.value})}
                 />
                 <button 
                   type="button" 
                   onClick={handleAddFamily}
                   className="bg-gray-800 text-white px-3 rounded hover:bg-black"
                 >
                   <Plus className="w-4 h-4" />
                 </button>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3 border-t border-gray-100">
             <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg">Cancel</button>
             <button disabled={loading} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
               {loading ? 'Saving...' : 'Create Customer'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- 4. CUSTOMER MODULE (Split View) ---
const CustomerManager = ({ showToast }) => {
  const [customers, setCustomers] = useState([]);
  const [collectionBoys, setCollectionBoys] = useState([]); // Store Staff
  const [selectedCustomer, setSelectedCustomer] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchCollectionBoys();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load customers", error);
      setLoading(false);
    }
  };

 const fetchCollectionBoys = async () => {
    try {
      // Fetch REAL users with role 'collection_boy'
      const { data } = await api.get('/users?role=collection_boy'); 
      setCollectionBoys(data);
    } catch (error) {
      console.error("Failed to load staff", error);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.mobile.includes(searchTerm)
  );

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50 overflow-hidden">
      {/* Add Modal */}
      {isAddModalOpen && (
        <CustomerForm 
          existingCustomers={customers} 
          collectionBoys={collectionBoys}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchCustomers();
          }}
        />
      )}

      {/* NEW: Loan Modal */}
      {isLoanModalOpen && selectedCustomer && (
        <LoanForm 
          customer={selectedCustomer}
          collectionBoys={collectionBoys}
          onClose={() => setIsLoanModalOpen(false)}
          onUpdateCustomer={(updatedCust) => setSelectedCustomer(updatedCust)} // Updates local state after linking
          showToast={showToast}
          onSuccess={() => {
            setIsLoanModalOpen(false);
            // alert(`Loan Created for ${selectedCustomer.fullName}!`);
            fetchCustomers();
          }}
        />
      )}

      {/* LEFT PANEL: LIST VIEW */}
      <div className={`${selectedCustomer ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 flex-col border-r border-gray-200 bg-white h-full`}>
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
            Customers
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
            </button>
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search name, mobile..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p>No customers found.</p>
              <button onClick={() => setIsAddModalOpen(true)} className="text-blue-600 text-sm font-medium mt-2">Add New?</button>
            </div>
          ) : (
            filteredCustomers.map(cust => (
              <div 
                key={cust._id}
                onClick={() => setSelectedCustomer(cust)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors flex items-center gap-3 ${selectedCustomer?._id === cust._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                  {cust.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{cust.fullName}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {cust.mobile}
                  </p>
                </div>
                <div className="ml-auto">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    cust.level === 'Level 1' ? 'bg-green-100 text-green-700' : 
                    cust.level === 'Level 2' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {cust.level}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: DETAIL VIEW */}
      <div className={`${!selectedCustomer ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-gray-50 h-full`}>
        {selectedCustomer ? (
          <>
            {/* Header */}
            <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedCustomer(null)} className="md:hidden p-2 text-gray-500">
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="text-xl font-bold text-gray-800">{selectedCustomer.fullName}</h2>
              </div>
              <div className="flex gap-2">
                 <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Edit</button>
                 <button 
                   onClick={() => setIsLoanModalOpen(true)} // --- NEW: Open Loan Modal ---
                   className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-md shadow-blue-200"
                 >
                   New Loan
                 </button>
              </div>
            </div>

            {/* Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Credit Score</p>
                    <p className={`text-2xl font-bold mt-1 ${
                      selectedCustomer.creditScore > 700 ? 'text-green-600' : 'text-amber-600'
                    }`}>{selectedCustomer.creditScore}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Active Loans</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{selectedCustomer.activeLoans?.length || 0}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Due</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">₹ 0</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Personal Info */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4" /> Personal Information
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500 text-sm">Mobile</span>
                        <span className="font-medium text-gray-800">{selectedCustomer.mobile}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500 text-sm">Aadhaar</span>
                        <span className="font-medium text-gray-800">{selectedCustomer.kyc?.aadhaarNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-gray-500 text-sm">Income</span>
                        <span className="font-medium text-gray-800">{selectedCustomer.incomeSource || 'N/A'}</span>
                      </div>
                      {selectedCustomer.incomeAmount && (
                        <div className="flex justify-between pt-1">
                          <span className="text-gray-500 text-sm">Amount</span>
                          <span className="font-medium text-gray-800">₹ {selectedCustomer.incomeAmount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Locations
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="flex items-start gap-3">
                         <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                         <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Residence</p>
                            <p className="text-sm text-gray-800">{selectedCustomer.locations?.residence?.addressText || 'No address saved'}</p>
                         </div>
                      </div>
                      <div className="flex items-start gap-3">
                         <div className="mt-1 w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                         <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Collection Point ({selectedCustomer.locations?.collectionPoint?.placeType})</p>
                            {selectedCustomer.locations?.collectionPoint?.geo?.lat ? (
                              <p className="text-sm font-mono text-gray-700 mt-1 bg-gray-50 px-2 py-1 rounded inline-block">
                                {selectedCustomer.locations.collectionPoint.geo.lat}, {selectedCustomer.locations.collectionPoint.geo.lng}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-800">{selectedCustomer.locations?.collectionPoint?.addressText || 'No location saved'}</p>
                            )}
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Family Members */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden lg:col-span-2">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Family & References
                    </div>
                    <div className="p-4">
                      {selectedCustomer.familyMembers?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedCustomer.familyMembers.map((member, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                              <div>
                                <p className="font-medium text-sm text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.relation}</p>
                              </div>
                              {member.mobile && <span className="text-xs bg-white px-2 py-1 rounded border text-gray-600">{member.mobile}</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No family members added.</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Proofs */}
                  {selectedCustomer.proofs?.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden lg:col-span-2">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Documents
                      </div>
                      <div className="p-4 flex flex-wrap gap-2">
                        {selectedCustomer.proofs.map((proof, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-100 flex items-center gap-1">
                            <Check className="w-3 h-3" /> {proof}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-gray-300" />
            </div>
            <p className="font-medium text-lg">Select a customer to view details</p>
            <p className="text-sm">Or click the + button to create new</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 5. MAIN DASHBOARD ---
const DashboardHome = ({ user }) => (
  <div className="p-6 md:p-8 max-w-7xl mx-auto">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
      <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.name}!</h1>
      <p className="text-gray-500 mt-2">Financial Overview & Admin Controls</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Stats Placeholders */}
      {[
        { label: 'Total Collections Today', val: '₹ 12,500', icon: Wallet, color: 'bg-emerald-100 text-emerald-600' },
        { label: 'Pending Dues', val: '₹ 45,000', icon: Banknote, color: 'bg-red-100 text-red-600' },
        { label: 'New Loan Requests', val: '3', icon: Users, color: 'bg-blue-100 text-blue-600' }
      ].map((stat, i) => (
        <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className={`p-4 rounded-xl ${stat.color}`}>
            <stat.icon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-gray-900">{stat.val}</h3>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- 6. AUTH SCREEN ---
const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: '',
    role: 'admin' 
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { mobile: formData.mobile, password: formData.password }
        : formData;

      const { data } = await api.post(endpoint, payload);
      
      localStorage.setItem('finance_user', JSON.stringify(data));
      onLogin(data);
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Connection failed. Is the Backend Server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-600 skew-y-3 origin-top-left -translate-y-20 z-0"></div>
      
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden z-10 relative">
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
             <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            {isLogin ? 'Login to access your dashboard' : 'Create a new account to manage finance'}
          </p>
        </div>

        {error && (
          <div className="mx-8 mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-start gap-2 animate-pulse">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Full Name</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Mobile Number</label>
            <div className="relative">
              <Phone className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="mobile"
                placeholder="9876543210"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
                value={formData.mobile}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Role</label>
              <div className="relative">
                <select
                  name="role"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700 appearance-none"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="admin">Admin (Owner)</option>
                  <option value="lender">Lender (Investor)</option>
                  <option value="collection_boy">Collection Boy</option>
                </select>
                <div className="absolute right-3 top-3 pointer-events-none">
                  <ArrowRight className="w-4 h-4 text-gray-400 rotate-90" />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2
              ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
          >
            {loading ? 'Processing...' : (isLogin ? 'Login Securely' : 'Create Account')}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? "New to FinanceMERN?" : "Already have an account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-blue-700 font-bold hover:underline focus:outline-none"
            >
              {isLogin ? 'Create Account' : 'Login Here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// --- 7. MAIN APP ---
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 1. ADD TOAST STATE
  const [toast, setToast] = useState(null); 

  // 2. ADD SHOW TOAST FUNCTION
  const showToast = (title, type, message) => {
    setToast({ title, type, message });
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('finance_user');
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('finance_user');
    setUser(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">Loading App...</div>;

  return (
    <Router>
      {user ? (
        <div className="flex min-h-screen bg-gray-50">
          {/* 3. RENDER TOAST COMPONENT */}
          <Toast toast={toast} onClose={() => setToast(null)} />

          <Sidebar user={user} onLogout={handleLogout} />
          <div className="flex-1 ml-0 md:ml-64 transition-all">
             <Routes>
               <Route path="/" element={<DashboardHome user={user} />} />
               
               {/* 4. PASS showToast TO CUSTOMER MANAGER */}
               <Route path="/customers" element={<CustomerManager showToast={showToast} />} />
               
               <Route path="*" element={<div className="p-8">Module under construction</div>} />
               <Route path="/lender-cash" element={<LenderCashEntry showToast={showToast} />} />
               <Route path="/settings" element={<PaymentModes showToast={showToast} />} />
             </Routes>
          </div>
        </div>
      ) : (
        <AuthScreen onLogin={setUser} />
      )}
    </Router>
  );
}

export default App;