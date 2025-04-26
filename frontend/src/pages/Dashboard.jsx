import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend} from 'recharts';
import Navbar from "../component/Navbar2";
import { useNavigate } from 'react-router-dom';

const COLORS = ["#34D399", "#60A5FA", "#FBBF24", "#F472B6"];

const Dashboard = () => {
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [savings, setSavings] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [fixed, setFixed] = useState(0);
  const [variables, setVariables] = useState(0);
  const [investments, setInvestments] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        await axios.get("http://localhost:3000/users/dashboard", { withCredentials: true });
      } catch (err) {
       
        navigate("/login");


      }
    };

    const fetchIncome = async () => {
      try {
        const res = await axios.get("http://localhost:3000/users/getIncome", { withCredentials: true });

        if (Array.isArray(res.data) && res.data.length > 0) {
          const thisMonth = new Date().getMonth();
          const filtered = res.data.filter(item => new Date(item.date).getMonth() === thisMonth);

          let chartWeekly = [];
          let spent = 0, saved = 0;
          let fixed = 0, variables = 0, investments = 0;
          let remainingAmount = 0;

          const weekMap = new Map();

          filtered.forEach((item) => {
            const weekExpense = item.weeklyExpenses || [];

            weekExpense.forEach(week => {
              if (!weekMap.has(week.week)) {
                weekMap.set(week.week, week.amount);
                chartWeekly.push({
                  name: week.week,
                  expense: week.amount,
                });
              }
              spent += week.amount;
            });

            const cat = item.categoryExpenses || {};
            fixed += cat.fixed || 0;
            variables += cat.variables || 0; // Correct key is "variables"
            investments += cat.investments || 0;

            saved += item.savings || 0;
          });

          const salary = filtered[0].salary || 0;
          remainingAmount = salary - spent;

          setChartData(chartWeekly);
          setTotalSpent(spent);
          setSavings(saved);
          // setRemaining(remainingAmount);
          setFixed(fixed);
          setVariables(variables);
          setInvestments(investments);

          setPieData([
            { name: "Fixed", value: fixed },
            { name: "Variable", value: variables },
            { name: "Investments", value: investments },
            // { name: "Remaining", value: remainingAmount }
          ]);
        } else {
          setError("No income data found");
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching income:", err);
        setError("Error fetching data");
        setLoading(false);
      }
    };

    checkUserLoggedIn();
    fetchIncome();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:3000/users/logout", {}, { withCredentials: true });
  

      setSavings(0);
      setTotalSpent(0);
      setFixed(0);
      setVariables(0);
      setInvestments(0);
      setChartData([]);
      setPieData([]);
  
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };
  


  
    

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="flex min-h-screen bg-gradient-to-l from-teal-400 to-slate-700 shadow-lg">
      <main className="flex-1">
        <Navbar />
        <h1 className="text-2xl text-white font-semibold mb-4 ml-5">Welcome Back</h1>
        <p className="text-white mb-8 ml-5">Here's your financial summary for this month.</p>

        {/* Existing charts and summaries */}
        <div className="bg-blue-100 p-6 rounded-xl shadow-md mb-8 m-5">
          <h2 className="text-lg font-semibold mb-4">Your Weekly Expenses</h2>
          <ResponsiveContainer width="80%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  color: 'black',
                }}
                cursor={false}
              />
              <Bar dataKey="expense" fill="#163950" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {pieData.length > 0 && (
          <div className="bg-blue-100 p-6 rounded-xl shadow-md mb-8 m-5">
            <h2 className="text-lg font-semibold mb-4">Spending Distribution</h2>
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
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 m-5">
          <div className="bg-blue-100 p-6 rounded-xl shadow-md">
            <h3 className="text-md font-semibold mb-2">This Month's Savings</h3>
            <p className="text-green-500 text-xl font-bold">₹{savings.toLocaleString()}</p>
          </div>
          <div className="bg-blue-100 p-6 rounded-xl shadow-md ">
            <h3 className="text-md font-semibold mb-2">This Month's Expenses</h3>
            <p className="text-red-500 text-xl font-bold">₹{totalSpent.toLocaleString()}</p>
          </div>
        </div>

       
      </main>
    </div>
  );
};

export default Dashboard;
