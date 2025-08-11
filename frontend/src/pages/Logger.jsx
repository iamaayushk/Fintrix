import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import Navbar from "../component/Navbar2";

const LogIncomeForm = () => {
  const [formData, setFormData] = useState({
    month: "",
    week: "",
    salary: "",
    fixed: "",
    food: "",
    shopping: "",
    entertainment: "",
    investments: "",
    note: "",
  });

  const [savings, setSavings] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingMonthData, setExistingMonthData] = useState(null);
  const [isFirstWeekOfMonth, setIsFirstWeekOfMonth] = useState(true);
  const [prevTotalSpent, setPrevTotalSpent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) return navigate("/login");

    try {
      const decoded = jwtDecode(token);
      setUserName(decoded.name || decoded.email);
      setUserId(decoded.id || decoded.userId);
    } catch (err) {
      console.error("Invalid token:", err);
      setMessage("Invalid authentication. Please login again.");
      setMessageType("error");
      setTimeout(() => navigate("/login"), 2000);
    }
  }, [navigate]);

  // Fetch existing month data when month is selected
  useEffect(() => {
    if (formData.month && userId) {
      fetchExistingMonthData();
    }
  }, [formData.month, userId]);

  // Auto-fill data when week is selected
  useEffect(() => {
    if (formData.week && existingMonthData) {
      autoFillFromExistingData();
    }
  }, [formData.week, existingMonthData]);

  // Calculate previous total spent when existing data changes
  useEffect(() => {
    if (existingMonthData) {
      let tempWeekly = Array.from({ length: 5 }, (_, i) => ({
        week: `Week ${i + 1}`,
        amount: 0
      }));

      existingMonthData.forEach(entry => {
        if (entry.weeklyExpenses) {
          entry.weeklyExpenses.forEach(weekExpense => {
            const weekIndex = parseInt(weekExpense.week.split(' ')[1]) - 1;
            if (weekIndex >= 0 && weekIndex < 5) {
              tempWeekly[weekIndex].amount = weekExpense.amount;
            }
          });
        }
      });

      const prevTotal = tempWeekly.reduce((sum, week) => sum + week.amount, 0);
      setPrevTotalSpent(prevTotal);
    } else {
      setPrevTotalSpent(0);
    }
  }, [existingMonthData]);

  const fetchExistingMonthData = async () => {
    try {
      const token = Cookies.get("token");
      const currentYear = new Date().getFullYear();
      
      const response = await axios.get("http://localhost:3000/users/getIncome", {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true,
      });

      // Filter for current month and year
      const monthData = response.data.filter(item => {
        const itemDate = new Date(item.date);
        return item.month === formData.month && itemDate.getFullYear() === currentYear;
      });

      if (monthData.length > 0) {
        setExistingMonthData(monthData);
        setIsFirstWeekOfMonth(false);
        setMessage(`Found existing data for ${formData.month}. Salary and fixed expenses will be auto-filled.`);
        setMessageType("success");
      } else {
        setExistingMonthData(null);
        setIsFirstWeekOfMonth(true);
        setMessage(`This is the first week you're logging for ${formData.month}.`);
        setMessageType("warning");
      }
    } catch (err) {
      console.error("Error fetching existing data:", err);
      setExistingMonthData(null);
      setIsFirstWeekOfMonth(true);
    }
  };

  const autoFillFromExistingData = () => {
    if (!existingMonthData || existingMonthData.length === 0) return;

    // Get the first entry to inherit salary and fixed expenses
    const firstEntry = existingMonthData[0];
    
    setFormData(prev => ({
      ...prev,
      salary: firstEntry.salary.toString(),
      fixed: firstEntry.categoryExpenses.fixed.toString(),
      // Don't auto-fill variable expenses - let user enter them fresh for this week
      food: "",
      shopping: "",
      entertainment: "",
      investments: "",
    }));

    setMessage(`Auto-filled salary (₹${firstEntry.salary.toLocaleString()}) and fixed expenses (₹${firstEntry.categoryExpenses.fixed.toLocaleString()}) from previous week data.`);
    setMessageType("success");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = {
      ...formData,
      [name]: value,
    };

    // Calculate savings in real-time
    const { salary, fixed, food, shopping, entertainment, investments } = updatedForm;
    const totalExpenses = Number(fixed || 0) + Number(food || 0) + 
                         Number(shopping || 0) + Number(entertainment || 0) + 
                         Number(investments || 0);
    const calculatedSavings = Number(salary || 0) - (prevTotalSpent + totalExpenses);

    setFormData(updatedForm);
    setSavings(calculatedSavings);
  };

  const validateForm = () => {
    const { month, week, salary, fixed, food, shopping, entertainment, investments } = formData;
    
    if (!month || !week) {
      setMessage("Please select both month and week.");
      setMessageType("error");
      return false;
    }

    if (!salary || Number(salary) <= 0) {
      setMessage("Please enter a valid salary amount.");
      setMessageType("error");
      return false;
    }

    // Check if this week already exists
    if (existingMonthData) {
      const weekExists = existingMonthData.some(entry => entry.week === week);
      if (weekExists) {
        setMessage(`Data for ${week} of ${month} already exists. Please select a different week or update existing data.`);
        setMessageType("error");
        return false;
      }
    }

    const totalExpenses = Number(fixed || 0) + Number(food || 0) + 
                         Number(shopping || 0) + Number(entertainment || 0) + 
                         Number(investments || 0);

    if (totalExpenses + prevTotalSpent >= Number(salary)) {
      setMessage("Your expenses cannot exceed or equal your salary!");
      setMessageType("error");
      return false;
    }

    return true;
  };

  const buildWeeklyExpensesArray = () => {
    const currentWeekExpense = Number(formData.fixed || 0) + Number(formData.food || 0) + 
                              Number(formData.shopping || 0) + Number(formData.entertainment || 0) + 
                              Number(formData.investments || 0);

    // Start with existing week data or initialize empty array
    let weeklyExpenses = Array.from({ length: 5 }, (_, i) => ({
      week: `Week ${i + 1}`,
      amount: 0
    }));

    // If there's existing month data, preserve those week amounts
    if (existingMonthData && existingMonthData.length > 0) {
      existingMonthData.forEach(entry => {
        if (entry.weeklyExpenses) {
          entry.weeklyExpenses.forEach(weekExpense => {
            const weekIndex = parseInt(weekExpense.week.split(' ')[1]) - 1;
            if (weekIndex >= 0 && weekIndex < 5) {
              weeklyExpenses[weekIndex] = {
                week: weekExpense.week,
                amount: weekExpense.amount
              };
            }
          });
        }
      });
    }

    // Update the current week with new data
    const currentWeekIndex = parseInt(formData.week.split(' ')[1]) - 1;
    if (currentWeekIndex >= 0 && currentWeekIndex < 5) {
      weeklyExpenses[currentWeekIndex] = {
        week: formData.week,
        amount: currentWeekExpense
      };
    }

    return weeklyExpenses;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setMessage("");

    const token = Cookies.get("token");
    if (!token) {
      setMessage("User not authenticated. Please login again.");
      setMessageType("error");
      navigate("/login");
      return;
    }

    const { salary, fixed, food, shopping, entertainment, investments, note, month, week } = formData;
    
    // Convert strings to numbers
    const salaryNum = Number(salary);
    const fixedNum = Number(fixed || 0);
    const foodNum = Number(food || 0);
    const shoppingNum = Number(shopping || 0);
    const entertainmentNum = Number(entertainment || 0);
    const investmentsNum = Number(investments || 0);
    
    const variableExpenses = foodNum + shoppingNum + entertainmentNum;
    const currentWeekTotal = fixedNum + variableExpenses + investmentsNum;
    
    // Build the complete weekly expenses array
    const weeklyExpenses = buildWeeklyExpensesArray();
    
    // Calculate total spent across all weeks
    const totalSpent = weeklyExpenses.reduce((sum, week) => sum + week.amount, 0);
    
    // Calculate savings based on total spent
    const calculatedSavings = salaryNum - totalSpent;

    try {
      const response = await axios.post(
        "http://localhost:3000/users/postIncome",
        {
          salary: salaryNum,
          categoryExpenses: {
            fixed: fixedNum,
            variables: variableExpenses,
            investments: investmentsNum,
          },
          weeklyExpenses, // Now contains all 4 weeks with proper data
          savings: calculatedSavings,
          totalSpent,
          note: note || "",
          userId,
          userName,
          month,
          week,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      if (response.status === 201) {
        setMessage(`${response.data.message} Data logged for ${month} ${week}.`);
        setMessageType("success");
        
        // Reset only variable fields, keep salary and fixed for next week
        setFormData(prev => ({
          ...prev,
          week: "",
          food: "",
          shopping: "",
          entertainment: "",
          investments: "",
          note: "",
        }));
        setSavings(0);

        // Refresh existing month data
        fetchExistingMonthData();

        setTimeout(() => {
          setMessage("");
        }, 5000);
      }
    } catch (err) {
      console.error("Error logging income:", err);
      
      let errorMessage = "Failed to log income. Please try again.";
      
      if (err.response) {
        errorMessage = err.response.data.message || errorMessage;
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection.";
      }
      
      setMessage(errorMessage);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const getMessageStyle = () => {
    switch (messageType) {
      case "success":
        return "text-green-400 bg-green-900/20 border border-green-500/20 rounded p-2";
      case "error":
        return "text-red-400 bg-red-900/20 border border-red-500/20 rounded p-2";
      case "warning":
        return "text-yellow-400 bg-yellow-900/20 border border-yellow-500/20 rounded p-2";
      default:
        return "text-blue-400";
    }
  };

  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
  const availableWeeks = weeks.filter(
    week => !existingMonthData || !existingMonthData.some(entry => entry.week === week)
  );

  return (
    <div className="bg-gradient-to-b from-zinc-900 to-gray-900 min-h-screen">
      <Navbar />
      <div className="max-w-xl mx-auto bg-gray-800 text-zinc-200 p-10 rounded-xl shadow-md mt-10">
        {userName && (
          <h3 className="text-lg font-medium mb-2 text-green-400">
            Welcome, {userName} 👋
          </h3>
        )}

        <h2 className="text-2xl font-bold text-zinc-300 mb-6">
          Log Your Weekly Income & Expenses
        </h2>

        {message && (
          <div className={`text-sm mb-4 ${getMessageStyle()}`}>
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Month Selection */}
          <select
            name="month"
            value={formData.month}
            onChange={handleChange}
            className="w-full p-3 border border-zinc-600 rounded-lg text-white bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            <option value="" className="bg-zinc-800">Select Month</option>
            {[
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"
            ].map((month) => (
              <option key={month} value={month} className="bg-zinc-800">{month}</option>
            ))}
          </select>

          {/* Week Selection */}
          {formData.month && (
            <select
              name="week"
              value={formData.week}
              onChange={handleChange}
              className="w-full p-3 border border-zinc-600 rounded-lg text-white bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="" className="bg-zinc-800">Select Week</option>
              {availableWeeks.map((week) => (
                <option key={week} value={week} className="bg-zinc-800">
                  {week} {week === "Week 1" ? "(1st - 7th)" :
                  week === "Week 2" ? "(8th - 14th)" :
                  week === "Week 3" ? "(15th - 21st)" :
                  week === "Week 4" ? "(22nd - 28th)" :
                  "(29th - 31st)"}
                </option>
              ))}
            </select>
          )}

          {/* Income and Expenses Form */}
          {formData.month && formData.week && (
            <>
              {!isFirstWeekOfMonth && (
                <div className="bg-yellow-900/20 border border-yellow-500/20 p-3 rounded-lg mb-4">
                  <p className="text-yellow-400 text-sm font-medium">
                    Salary and Fixed Expenses are auto-filled from existing data and cannot be edited.
                  </p>
                </div>
              )}
              {[
                { name: "salary", placeholder: "Monthly Salary (e.g. 50000)", required: true, disabled: !isFirstWeekOfMonth },
                { name: "fixed", placeholder: "Fixed Expenses (e.g. Rent, Bills)", disabled: !isFirstWeekOfMonth },
                { name: "food", placeholder: "Food & Dining (e.g. 2000)" },
                { name: "shopping", placeholder: "Shopping Expenses (e.g. 3000)" },
                { name: "entertainment", placeholder: "Entertainment (e.g. Movies, Events)" },
                { name: "investments", placeholder: "Investments (e.g. SIPs, Stocks)" },
              ].map(({ name, placeholder, required, disabled }) => (
                <input
                  key={name}
                  type="number"
                  name={name}
                  placeholder={placeholder}
                  value={formData[name]}
                  onChange={handleChange}
                  className="w-full p-3 border border-zinc-600 rounded-lg text-white bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-zinc-400"
                  required={required}
                  min="0"
                  step="0.01"
                  disabled={disabled}
                />
              ))}

              <textarea
                name="note"
                placeholder="Optional Note (e.g. Bonus received, extra expenses)"
                value={formData.note}
                onChange={handleChange}
                className="w-full p-3 border border-zinc-600 rounded-lg text-white bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-zinc-400 resize-none"
                rows="3"
                maxLength="500"
              />

              {/* Savings Display */}
              <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-600">
                <p className={`font-medium text-lg ${savings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <strong>Calculated Savings:</strong> ₹{Math.max(savings, 0).toLocaleString()}
                </p>
                {formData.salary && savings >= 0 && (
                  <p className="text-zinc-400 text-sm mt-1">
                    Savings Rate: {((savings / Number(formData.salary)) * 100).toFixed(1)}%
                  </p>
                )}
              </div>

              {savings < 0 && (
                <div className="bg-red-900/20 border border-red-500/20 p-3 rounded-lg">
                  <p className="text-red-400 text-sm font-medium">
                    ⚠️ Warning: Your expenses exceed your salary by ₹{Math.abs(savings).toLocaleString()}!
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || savings < 0}
                className={`w-full font-semibold px-6 py-3 rounded-lg transition-all duration-200 ${
                  loading 
                    ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed' 
                    : savings < 0
                    ? 'bg-red-600 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg cursor-pointer'
                }`}
              >
                {loading ? "Submitting..." : savings < 0 ? "Cannot Submit - Fix Expenses" : "Submit Income Entry"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default LogIncomeForm;