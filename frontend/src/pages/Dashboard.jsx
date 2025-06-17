import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactECharts from 'echarts-for-react';
import Navbar from "../component/Navbar2";
import { useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';


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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIncome = async () => {
      try {
        const res = await axios.get("http://localhost:3000/users/getIncome", { withCredentials: true });
        const thisMonth = new Date().getMonth();
        const filtered = res.data.filter(item => new Date(item.date).getMonth() === thisMonth);

        let chartWeekly = [];
        let spent = 0, saved = 0;
        let fixed = 0, variables = 0, investments = 0;
        const weekMap = new Map();

        filtered.forEach((item) => {
          const weekExpense = item.weeklyExpenses || [];
          weekExpense.forEach(week => {
            if (!weekMap.has(week.week)) {
              weekMap.set(week.week, week.amount);
              chartWeekly.push({ name: week.week, expense: week.amount });
            }
            spent += week.amount;
          });

          const cat = item.categoryExpenses || {};
          fixed += cat.fixed || 0;
          variables += cat.variables || 0;
          investments += cat.investments || 0;
          saved += item.savings || 0;
        });

        setChartData(chartWeekly);
        setPieData([
          { value: fixed, name: 'Fixed' },
          { value: variables, name: 'Variable' },
          { value: investments, name: 'Investments' }
        ]);
        setTotalSpent(spent);
        setSavings(saved);
        setFixed(fixed);
        setVariables(variables);
        setInvestments(investments);
        setLoading(false);
      } catch (err) {
        setError("No data right now to show");
        setTimeout(() => navigate('/login'), 3000);
        setLoading(false);
      }
    };

    fetchIncome();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center mt-10 text-white">
        <div className="animate-spin border-4 border-t-4 border-white w-12 h-12 rounded-full"></div>
        <span className="ml-4 text-xl">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-10 bg-red-500 text-white py-3 px-6 rounded-md shadow-lg">
        <p className="text-xl font-semibold">{error}</p>
      </div>
    );
  }

  const barOptions = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: chartData.map(d => d.name),
      axisLabel: { color: '#ffffff' },
      axisLine: { lineStyle: { color: '#666' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#ffffff' },
      splitLine: { lineStyle: { color: '#333' } }
    },
    series: [
      // Bar Series
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
      // Line Series (on top of bars)
      {
        data: chartData.map(d => d.expense),
        type: 'line',
        smooth: true,  // Makes the line smooth
        lineStyle: {
          color: '#FFEB3B', // Line color
          width: 3
        },
        symbol: 'circle', // Line points with circles
        symbolSize: 8
      }
    ]
  };
  

  const pieOptions = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
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
        label: { color: '#fff' },
        itemStyle: {
          shadowBlur: 20,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    ]
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <main className="flex-1">
        <Navbar />
        <div className="m-5">
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-gray-300 mb-6">Here's your financial summary for this month.</p>
  
          {/* Weekly Expenses Bar */}
          <div className="bg-zinc-900 p-6 rounded-xl shadow mb-8 mt-20">
            <h2 className="text-xl font-semibold mb-4">Weekly Expenses</h2>
            <ReactECharts option={barOptions} style={{ height: 300, width: '100%' }} />
          </div>
  
          {/* Pie Chart */}
          <div className="bg-zinc-900 p-6 rounded-xl shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Spending Distribution</h2>
            <ReactECharts option={pieOptions} style={{ height: 300, width: '100%' }} />
          </div>
  
          {/* KPI Cards */}
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
  
          {/* Budget Progress Bars */}
          <div className="bg-zinc-900 p-6 rounded-xl shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Budget Utilization</h2>
            <div className="mb-3">
              <p className="text-sm mb-1">Fixed</p>
              <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(fixed / totalSpent) * 100}%` }}></div>
              </div>
            </div>
            <div className="mb-3">
              <p className="text-sm mb-1">Variable</p>
              <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 rounded-full" style={{ width: `${(variables / totalSpent) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <p className="text-sm mb-1">Investments</p>
              <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(investments / totalSpent) * 100}%` }}></div>
              </div>
            </div>
          </div>
  
          {/* Total Savings and Expenses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-zinc-900 p-6 rounded-xl shadow">
              <h3 className="text-md font-semibold mb-2">This Month's Savings</h3>
              <p className="text-green-400 text-xl font-bold">₹{savings.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-900 p-6 rounded-xl shadow">
              <h3 className="text-md font-semibold mb-2">This Month's Expenses</h3>
              <p className="text-red-400 text-xl font-bold">₹{totalSpent.toLocaleString()}</p>
            </div>
          </div>
  
          {/* Insights */}
          <div className="bg-zinc-900 p-6 rounded-xl shadow mb-6">
            <h2 className="text-xl font-semibold mb-3">Smart Insights</h2>
            <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2">
              <li>You saved <span className="text-green-400 font-semibold">₹{savings.toLocaleString()}</span> this month. Great job!</li>
              <li>Your <span className="text-blue-400">investments</span> make up {(investments / totalSpent * 100).toFixed(1)}% of your expenses.</li>
              <li>Consider reducing <span className="text-orange-400">variable spending</span> to increase savings.</li>
            </ul>
          </div>
  
        </div>
      </main>
    </div>
  );
  
};

export default Dashboard;
