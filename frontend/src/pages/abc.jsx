import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import Navbar from "../component/Navbar2";
const COLORS = ["#00507A", "#D435A2", "#75D1A6"]; // darkblue, pink, light green

const Dashboard = () => {
  // Mock data
  const defaultChartData = [
    { name: "Week 1", expense: 1500 },
    { name: "Week 2", expense: 1800 },
    { name: "Week 3", expense: 1200 },
    { name: "Week 4", expense: 2200 },
  ];

  const defaultPieData = [
    { name: "Household", value: 3000 },
    { name: "Personal", value: 2500 },
    { name: "Investments", value: 2200 },
  ];

  const [chartData, setChartData] = useState(defaultChartData);
  const [pieData, setPieData] = useState(defaultPieData);
  const [savings, setSavings] = useState(4500);
  const [totalSpent, setTotalSpent] = useState(7700);

  return (
    <div className="flex min-h-screen bg-blue-100">
      <main className="flex-1 p-8">
        <Navbar />
        <h1 className="text-2xl font-semibold mb-4">Hey Aayush! 🎉</h1>
        <p className="text-gray-800 mb-8">Here's your financial summary for this month.</p>

      
        <div className="bg-white p-6 rounded-xl shadow-md mb-8 border-2 border-[#0077B6]">
          <h2 className="text-xl font-bold mb-4 text-center">Your Weekly Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="expense" fill="#00507A" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8 border-2 border-[#0077B6]">
          <h2 className="text-lg font-bold mb-4 text-center">Spending Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-md font-semibold mb-2">This Month's Savings</h3>
            <p className="text-green-500 text-xl font-bold">₹{savings.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-md font-semibold mb-2">This Month's Expenses</h3>
            <p className="text-red-500 text-xl font-bold">₹{totalSpent.toLocaleString()}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
