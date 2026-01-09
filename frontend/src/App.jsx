import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AuthScreen from './components/AuthScreen';
import DashboardHome from './components/DashboardHome';
import CustomerManager from './components/CustomerManager';
import Toast from './components/Toast';
import LenderCashEntry from './components/LenderCashEntry'; 
import PaymentModes from './components/PaymentModes'; 

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [toast, setToast] = useState(null); 

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
          <Toast toast={toast} onClose={() => setToast(null)} />

          <Sidebar user={user} onLogout={handleLogout} />
          <div className="flex-1 ml-0 md:ml-64 transition-all">
             <Routes>
               <Route path="/" element={<DashboardHome user={user} />} />
               
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