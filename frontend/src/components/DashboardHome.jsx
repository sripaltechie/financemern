import React from 'react';
import { Wallet, Banknote, Users } from 'lucide-react';

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

export default DashboardHome;