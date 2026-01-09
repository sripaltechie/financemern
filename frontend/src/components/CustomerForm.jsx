import React, { useState } from 'react';
import { X, ShieldAlert, MapPin, Check, Plus, Search, Users, Trash2, FileText } from 'lucide-react';
import api from '../utils/api';

const CustomerForm = ({ onClose, onSuccess, existingCustomers, collectionBoys }) => {
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
      collectionBoyId: '' 
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
  // ... (Make sure to export default CustomerForm) ...
};

export default CustomerForm;