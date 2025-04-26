import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import Navbar from "../component/Navbar2";

const LogIncomeForm = () => {
  const [formData, setFormData] = useState({
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
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
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
      navigate("/login");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = ["salary", "fixed", "food", "shopping", "entertainment", "investments"].includes(name)
      ? Number(value)
      : value;

    const updatedForm = {
      ...formData,
      [name]: parsedValue,
    };

    const { salary, fixed, food, shopping, entertainment, investments } = updatedForm;
    const totalExpenses = Number(fixed) + Number(food) + Number(shopping) + Number(entertainment) + Number(investments);
    const calculatedSavings = Number(salary) - totalExpenses;

    setFormData(updatedForm);
    setSavings(calculatedSavings);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = Cookies.get("token");
    if (!token) {
      setMessage("User not authenticated. Please login again.");
      navigate("/login");
      return;
    }

    const { salary, fixed, food, shopping, entertainment, investments, note } = formData;
    const totalSpent = fixed + food + shopping + entertainment + investments;
    const calculatedSavings = salary - totalSpent;

    const weeklyExpenses = Array.from({ length: 4 }, (_, i) => ({
      week: `Week ${i + 1}`,
      amount: totalSpent * 0.25,
    }));

    try {
      await axios.post(
        "https://localhost:3000/users/postIncome",
        {
          salary,
          categoryExpenses: { fixed, food, shopping, entertainment, investments },
          weeklyExpenses,
          savings: calculatedSavings,
          totalSpent,
          note,
          userId,
        },
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Income logged successfully!");
      setFormData({
        salary: "",
        fixed: "",
        food: "",
        shopping: "",
        entertainment: "",
        investments: "",
        note: "",
      });
      setSavings(0);
    } catch (err) {
      console.error(err);
      setMessage("Failed to log income.");
    }
  };

  return (
    <div className="bg-gradient-to-l from-teal-500 to-slate-700 min-h-screen">
      <Navbar />
      <div className="max-w-xl mx-auto bg-white p-10 rounded-xl shadow-md mt-10">
        {userName && (
          <h3 className="text-lg font-medium mb-2 text-green-600">
            Welcome, {userName} 👋
          </h3>
        )}

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Log Your Monthly Income & Expenses
        </h2>

        {message && <p className="text-sm mb-4 text-blue-600">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: "salary", placeholder: "Monthly Salary (e.g. 50000)" },
            { name: "fixed", placeholder: "Fixed Expenses (e.g. Rent, Bills)" },
            { name: "food", placeholder: "Food & Dining (e.g. 2000)" },
            { name: "shopping", placeholder: "Shopping Expenses (e.g. 3000)" },
            { name: "entertainment", placeholder: "Entertainment (e.g. Movies, Events)" },
            { name: "investments", placeholder: "Investments (e.g. SIPs, Stocks)" },
          ].map(({ name, placeholder }) => (
            <input
              key={name}
              type="number"
              name={name}
              placeholder={placeholder}
              value={formData[name]}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg"
              required
            />
          ))}

          <textarea
            name="note"
            placeholder="Optional Note (e.g. Bonus received)"
            value={formData.note}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
          />

          <p className="text-gray-700 font-medium">
            <strong>Calculated Savings:</strong> ₹{savings >= 0 ? savings : 0}
          </p>

          {savings < 0 && (
            <p className="text-red-600 text-sm">
              Warning: Your expenses exceed your salary!
            </p>
          )}

          <button
            type="submit"
            className="bg-blue-400 text-black font-semibold px-6 py-3 rounded-lg hover:bg-black hover:text-white transition"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default LogIncomeForm;
