import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, ArrowRight, User, MapPin, Users, FileText, Check } from 'lucide-react';
import api from '../utils/api';
import LoanForm from './LoanForm';
import CustomerForm from './CustomerForm';

const CustomerManager = ({ showToast }) => {
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
  // ... (Make sure to export default CustomerManager) ...
};

export default CustomerManager;