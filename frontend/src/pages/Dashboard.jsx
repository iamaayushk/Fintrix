import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactECharts from 'echarts-for-react';
import Navbar from "../component/Navbar2";
import { useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import Cookies from "js-cookie";

const Dashboard = () => {
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [savings, setSavings] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [fixed, setFixed] = useState(0);
  const [variables, setVariables] = useState(0);
  const [investments, setInvestments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [salary, setSalary] = useState(0);
  const [noData, setNoData] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const navigate = useNavigate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    const fetchIncome = async () => {
      try {
        setLoading(true);
        setError("");
        setNoData(false);

        const token = Cookies.get("token");
        if (!token) {
          setError("Please login to view dashboard");
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const res = await axios.get("http://localhost:3000/users/getIncome", { 
          withCredentials: true,
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const filtered = res.data.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === selectedYear;
        });

        if (filtered.length === 0) {
          setNoData(true);
          setLoading(false);
          return;
        }

        // Initialize all weeks (Week 1 to Week 5) with zero expenses
        let chartWeekly = Array.from({ length: 5 }, (_, i) => ({
          name: `Week ${i + 1}`,
          expense: 0
        }));
        let spent = 0, saved = 0;
        let fixedTotal = 0, variablesTotal = 0, investmentsTotal = 0;
        let salaryTotal = 0;

        filtered.forEach((item) => {
          const weekExpense = item.weeklyExpenses || [];
          weekExpense.forEach(week => {
            const weekIndex = parseInt(week.week.split(' ')[1]) - 1;
            if (weekIndex >= 0 && weekIndex < 5) {
              chartWeekly[weekIndex].expense = week.amount || 0;
              spent += week.amount || 0;
            }
          });

          const cat = item.categoryExpenses || {};
          fixedTotal += cat.fixed || 0;
          variablesTotal += cat.variables || 0;
          investmentsTotal += cat.investments || 0;
          saved += item.savings || 0;
          salaryTotal += item.salary || 0;
        });

        setChartData(chartWeekly);
        setPieData([
          { value: fixedTotal, name: 'Fixed', itemStyle: { color: '#FBBF24' } },
          { value: variablesTotal, name: 'Variable', itemStyle: { color: '#FB923C' } },
          { value: investmentsTotal, name: 'Investments', itemStyle: { color: '#3B82F6' } }
        ].filter(item => item.value > 0));
        setTotalSpent(spent);
        setSavings(saved);
        setFixed(fixedTotal);
        setVariables(variablesTotal);
        setInvestments(investmentsTotal);
        setSalary(salaryTotal);
        setLoading(false);
      } catch (err) {
        console.error("Dashboard error:", err);
        if (err.response?.status === 401) {
          setError("Please login to continue");
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError("No data right now to show");
          setTimeout(() => navigate('/login'), 3000);
        }
        setLoading(false);
      }
    };

    fetchIncome();
  }, [navigate, selectedMonth, selectedYear]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-zinc-950">
        <main className="flex-1">
          <Navbar />
          <div className="flex justify-center items-center mt-10 text-white">
            <div className="animate-spin border-4 border-t-4 border-green-500 w-12 h-12 rounded-full"></div>
            <span className="ml-4 text-xl">Loading your dashboard...</span>
          </div>
        </main>
      </div>
    );
  }

  if (noData) {
    return (
      <div className="flex min-h-screen bg-zinc-950 text-white">
        <main className="flex-1">
          <Navbar />
          <div className="text-center mt-10 p-8">
            <div className="bg-zinc-800 rounded-xl p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-bold mb-4">No Data for {monthNames[selectedMonth]} {selectedYear}</h2>
              <p className="text-gray-400 mb-6">No income data found for this period</p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSelectedMonth(new Date().getMonth());
                    setSelectedYear(new Date().getFullYear());
                    setNoData(false);
                    setError("");
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  View Current Month
                </button>
                <button
                  onClick={() => navigate('/logger')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Log Income Now
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-zinc-950">
        <main className="flex-1">
          <Navbar />
          <div className="text-center mt-10 bg-red-500 text-white py-3 px-6 rounded-md shadow-lg max-w-md mx-auto">
            <p className="text-xl font-semibold">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  const barOptions = {
    backgroundColor: 'transparent',
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: '#333',
      textStyle: { color: '#fff' },
      formatter: function(params) {
        return `${params[0].axisValue}<br/>Expense: ₹${params[0].value.toLocaleString()}`;
      }
    },
    xAxis: {
      type: 'category',
      data: chartData.map(d => d.name),
      axisLabel: { color: '#ffffff' },
      axisLine: { lineStyle: { color: '#666' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { 
        color: '#ffffff',
        formatter: '₹{value}'
      },
      splitLine: { lineStyle: { color: '#333' } }
    },
    series: [
      {
        data: chartData.map(d => d.expense),
        type: 'bar',
        barWidth: '40%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#34D399' },
            { offset: 1, color: '#10B981' }
          ]),
          borderRadius: [10, 10, 0, 0]
        }
      },
      {
        data: chartData.map(d => d.expense),
        type: 'line',
        smooth: true,
        lineStyle: {
          color: '#FFEB3B',
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8
      }
    ]
  };

  const pieOptions = {
    backgroundColor: 'transparent',
    tooltip: { 
      trigger: 'item',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: '#333',
      textStyle: { color: '#fff' },
      formatter: '{a} <br/>{b}: ₹{c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 10,
      textStyle: { color: '#fff' }
    },
    series: [
      {
        name: 'Spending',
        type: 'pie',
        radius: '60%',
        data: pieData,
        label: { 
          color: '#fff',
          formatter: '{b}\n₹{c}'
        },
        itemStyle: {
          shadowBlur: 20,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    ]
  };

  const savingsRate = salary > 0 ? ((savings / salary) * 100).toFixed(1) : 0;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <main className="flex-1">
        <Navbar />
        <div className="m-5">
          <div className="mb-6 bg-zinc-900 p-4 rounded-xl shadow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">Select Period</h2>
                <div className="flex gap-3">
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(parseInt(e.target.value));
                      setNoData(false);
                      setError("");
                    }}
                    className="bg-zinc-700 text-white p-2 rounded-lg border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index} value={index} className="bg-zinc-800">
                        {month}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(parseInt(e.target.value));
                      setNoData(false);
                      setError("");
                    }}
                    className="bg-zinc-700 text-white p-2 rounded-lg border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <option key={year} value={year} className="bg-zinc-800">
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Viewing data for</p>
                <p className="text-xl font-bold text-green-400">
                  {monthNames[selectedMonth]} {selectedYear}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="text-gray-300 mb-2">Here's your financial summary for {monthNames[selectedMonth]} {selectedYear}.</p>
            <div className="text-sm text-gray-400">
              Income: ₹{salary.toLocaleString()} | Savings Rate: {savingsRate}%
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-xl shadow mb-8 mt-20">
            <h2 className="text-xl font-semibold mb-4">Weekly Expenses</h2>
            {chartData.length > 0 ? (
              <ReactECharts option={barOptions} style={{ height: 300, width: '100%' }} />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <p>No weekly data available</p>
              </div>
            )}
          </div>

          <div className="bg-zinc-900 p-6 rounded-xl shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Spending Distribution</h2>
            {pieData.length > 0 ? (
              <ReactECharts option={pieOptions} style={{ height: 300, width: '100%' }} />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <p>No expense data available</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-zinc-900 p-4 rounded-xl shadow">
              <h3 className="text-md font-semibold mb-1">Fixed Expenses</h3>
              <p className="text-yellow-400 text-lg font-bold">₹{fixed.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl shadow">
              <h3 className="text-md font-semibold mb-1">Variable Expenses</h3>
              <p className="text-orange-400 text-lg font-bold">₹{variables.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl shadow">
              <h3 className="text-md font-semibold mb-1">Investments</h3>
              <p className="text-blue-400 text-lg font-bold">₹{investments.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-xl shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Budget Utilization</h2>
            <div className="mb-3">
              <p className="text-sm mb-1">Fixed</p>
              <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${totalSpent > 0 ? (fixed / totalSpent) * 100 : 0}%` }}></div>
              </div>
              <p className="text-xs text-gray-400 mt-1">{totalSpent > 0 ? ((fixed / totalSpent) * 100).toFixed(1) : 0}%</p>
            </div>
            <div className="mb-3">
              <p className="text-sm mb-1">Variable</p>
              <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 rounded-full transition-all duration-500" style={{ width: `${totalSpent > 0 ? (variables / totalSpent) * 100 : 0}%` }}></div>
              </div>
              <p className="text-xs text-gray-400 mt-1">{totalSpent > 0 ? ((variables / totalSpent) * 100).toFixed(1) : 0}%</p>
            </div>
            <div>
              <p className="text-sm mb-1">Investments</p>
              <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${totalSpent > 0 ? (investments / totalSpent) * 100 : 0}%` }}></div>
              </div>
              <p className="text-xs text-gray-400 mt-1">{totalSpent > 0 ? ((investments / totalSpent) * 100).toFixed(1) : 0}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-zinc-900 p-6 rounded-xl shadow">
              <h3 className="text-md font-semibold mb-2">{monthNames[selectedMonth]}'s Savings</h3>
              <p className="text-green-400 text-xl font-bold">₹{savings.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">Savings Rate: {savingsRate}%</p>
            </div>
            <div className="bg-zinc-900 p-6 rounded-xl shadow">
              <h3 className="text-md font-semibold mb-2">{monthNames[selectedMonth]}'s Expenses</h3>
              <p className="text-red-400 text-xl font-bold">₹{totalSpent.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">
                {salary > 0 ? `${((totalSpent / salary) * 100).toFixed(1)}% of income` : ''}
              </p>
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-xl shadow mb-6">
            <h3 className="text-md font-semibold mb-2">{monthNames[selectedMonth]} Income</h3>
            <p className="text-green-400 text-2xl font-bold">₹{salary.toLocaleString()}</p>
            <div className="mt-4 text-sm text-gray-400">
              <p>After expenses: ₹{savings.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-xl shadow mb-6">
            <h2 className="text-xl font-semibold mb-3">Smart Insights</h2>
            <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2">
              <li>You saved <span className="text-green-400 font-semibold">₹{savings.toLocaleString()}</span> in {monthNames[selectedMonth]}. {savingsRate >= 20 ? 'Excellent!' : savingsRate >= 10 ? 'Good job!' : 'Consider saving more.'}</li>
              <li>Your <span className="text-blue-400">investments</span> make up {totalSpent > 0 ? (investments / totalSpent * 100).toFixed(1) : 0}% of your expenses.</li>
              <li>Consider reducing <span className="text-orange-400">variable spending</span> to increase savings.</li>
              {savingsRate < 10 && <li className="text-yellow-400">💡 Try to save at least 10% of your income for better financial health.</li>}
              {investments === 0 && <li className="text-blue-400">💡 Consider starting investments for long-term wealth building.</li>}
              {selectedMonth !== new Date().getMonth() && selectedYear === new Date().getFullYear() && (
                <li className="text-blue-300">📊 You're viewing historical data for {monthNames[selectedMonth]}.</li>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;