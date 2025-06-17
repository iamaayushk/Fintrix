const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Income = require('../models/income');
const axios = require('axios');

// Register User
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save new user
    user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // Return success response with token
    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      token,
    });

  } catch (error) {
    console.error("Error creating user: ", error.message);
    res.status(500).json({ message: 'Error creating user, please try again later', error: error.message });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;  

   
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // Set token as HTTP-only cookie with secure and sameSite attributes for better security and cross-site usage
    res.cookie('token', token, {
      // httpOnly: true,
      // secure: process.env.NODE_ENV === 'production', // only use secure cookies in production
      sameSite: 'lax', // 'lax' allows sending cookies on top-level navigations
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      message: 'Login successful',
      id: user._id,
      name: user.name,
      email: user.email,
      token,  // include token in response body
    });

  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Dashboard
const dashboard = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const financialData = await Income.findOne({ userId: req.user.id });
    if (!financialData) {
      return res.status(404).json({ message: 'Financial data not found' });
    }

    const categoryExpenses = financialData.categoryExpenses || {};
    const { fixed = 0, variables = 0, investments = 0 } = categoryExpenses;
    const weeklyExpenses = Array.isArray(financialData.weeklyExpenses)
      ? financialData.weeklyExpenses
      : [];

    res.json({
      userName: user.name,
      savings: financialData.savings,
      totalSpent: financialData.totalSpent,
      weeklyExpenses,
      spendingDistribution: [
        { name: "Fixed", value: fixed },
        { name: "Variables", value: variables },
        { name: "Investments", value: investments },
      ],
    });

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
};

// Logout
const logout = async (req, res) => {
  // Clear the token from the cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  // Respond with a success message
  res.json({ message: 'Logged out successfully' });
};

// Post income 
const postIncome = async (req, res) => {
  const { salary, categoryExpenses, note, weeklyExpenses } = req.body;

 
  if (!categoryExpenses) {
    return res.status(400).json({ message: "categoryExpenses is required." });
  }

  const { fixed = 0, food = 0, shopping = 0, entertainment = 0, investments = 0 } = categoryExpenses;

  if (
    typeof salary !== "number" ||
    typeof fixed !== "number" ||
    typeof food !== "number" ||
    typeof shopping !== "number" ||
    typeof entertainment !== "number" ||
    typeof investments !== "number"
  ) {
    return res.status(400).json({ message: "All amounts must be numbers." });
  }

  if (!Array.isArray(weeklyExpenses) || weeklyExpenses.length !== 4) {
    return res.status(400).json({ message: "Weekly expenses must be an array of 4 values." });
  }

  // Calculate total variable expenses
  const variables = food + shopping + entertainment;

  const totalSpent = fixed + variables + investments;
  const savings = salary - totalSpent;

  if (savings < 0) {
    return res.status(400).json({ message: "Expenses exceed salary." });
  }

  try {
    // Create a new income record
    const income = new Income({
      userId: req.user.id,
      salary,
      categoryExpenses: {
        fixed,
        variables,
        investments
      },
      weeklyExpenses,  // Store weekly expenses
      savings,
      totalSpent,
      note,
    });

    await income.save();
    res.status(201).json(income);  // Successfully saved income
  } catch (err) {
    console.error(err);  // Log the error for debugging
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get Income
const getIncome = async (req, res) => {
  try {
    const incomes = await Income.find({ userId: req.user.id }).sort({ date: -1 });

    // Modify each income to combine food + shopping + entertainment into variables
    const modifiedIncomes = incomes.map(income => {
      const { fixed, food = 0, shopping = 0, entertainment = 0, investments } = income.categoryExpenses;
      const variables = food + shopping + entertainment;

      return {
        ...income._doc,  // spread all original fields
        categoryExpenses: {
          fixed,
          variables,
          investments
        }
      };
    });

    res.json(modifiedIncomes);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update income
const updateWeeklyExpense = async (req, res) => {
  const { incomeId, week, amount } = req.body;

  if (!incomeId || !week || typeof amount !== 'number') {
    return res.status(400).json({ message: "incomeId, week, and amount are required." });
  }

  try {
    const income = await Income.findOne({ _id: incomeId, userId: req.user.id });

    if (!income) {
      return res.status(404).json({ message: "Income record not found." });
    }

    // Update the correct week's expense
    const weekIndex = income.weeklyExpenses.findIndex(exp => exp.week === week);

    if (weekIndex === -1) {
      return res.status(400).json({ message: "Week not found in income record." });
    }

    income.weeklyExpenses[weekIndex].amount = amount;

    await income.save();

    res.json({ message: "Weekly expense updated successfully.", income });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};






module.exports = { registerUser, loginUser, postIncome, getIncome, dashboard, logout, updateWeeklyExpense };
