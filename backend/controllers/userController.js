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
  const { 
    salary, 
    categoryExpenses, 
    weeklyExpenses, 
    savings, 
    totalSpent, 
    note, 
    userId, 
    userName,
    month,
    week
  } = req.body;

  // Validate required fields
  if (!salary || salary <= 0) {
    return res.status(400).json({ message: "Valid salary is required." });
  }

  if (!categoryExpenses) {
    return res.status(400).json({ message: "categoryExpenses is required." });
  }

  const { fixed = 0, variables = 0, investments = 0 } = categoryExpenses;

  // Type validation
  if (
    typeof salary !== "number" ||
    typeof fixed !== "number" ||
    typeof variables !== "number" ||
    typeof investments !== "number"
  ) {
    return res.status(400).json({ message: "All amounts must be numbers." });
  }

  // Validate weekly expenses if provided
  if (weeklyExpenses && (!Array.isArray(weeklyExpenses) || weeklyExpenses.length !== 4)) {
    return res.status(400).json({ message: "Weekly expenses must be an array of 4 values." });
  }

  // Calculate totals
  const calculatedTotalSpent = fixed + variables + investments;
  const calculatedSavings = salary - calculatedTotalSpent;

  // Validate expenses don't exceed salary
  if (calculatedSavings < 0) {
    return res.status(400).json({ 
      message: "Expenses exceed salary.", 
      details: {
        salary,
        totalExpenses: calculatedTotalSpent,
        deficit: Math.abs(calculatedSavings)
      }
    });
  }

  try {
    // Use userId from token (preferred) or from request body (fallback)
    const userIdToUse = req.user?.id || userId;
    
    if (!userIdToUse) {
      return res.status(401).json({ message: "User authentication required." });
    }

    // Check if income for this specific month AND week already exists
    const existingIncome = await Income.findOne({
      userId: userIdToUse,
      month: month,
      week: week,
      $expr: {
        $and: [
          { $eq: [{ $month: "$date" }, new Date().getMonth() + 1] },
          { $eq: [{ $year: "$date" }, new Date().getFullYear()] }
        ]
      }
    });

    if (existingIncome) {
      return res.status(400).json({ 
        message: `Income for ${month} ${week} already exists. Use update endpoint to modify.` 
      });
    }

    // Create a new income record
    const income = new Income({
      userId: userIdToUse,
      salary,
      categoryExpenses: {
        fixed,
        variables,
        investments
      },
      weeklyExpenses: weeklyExpenses || [],
      savings: calculatedSavings,
      totalSpent: calculatedTotalSpent,
      note: note || "",
      month,
      week
    });

    await income.save();
    
    // Return success response with created data
    res.status(201).json({
      message: "Income logged successfully!",
      data: income,
      summary: {
        salary,
        totalExpenses: calculatedTotalSpent,
        savings: calculatedSavings,
        savingsPercentage: ((calculatedSavings / salary) * 100).toFixed(2)
      }
    });
    
  } catch (err) {
    console.error("Error saving income:", err);
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: "Income record for this specific week already exists." 
      });
    }
    
    res.status(500).json({ 
      message: "Server error while saving income.", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Get Income (your original function with enhancements)
const getIncome = async (req, res) => {
  try {
    // Keep your original logic but add fallback for authentication
    const userId = req.user?.id || req.body.userId || req.query.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "User authentication required" });
    }

    const incomes = await Income.find({ userId: userId }).sort({ date: -1 });

    // Your original modification logic - keep exactly the same
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

    // Enhanced response - but still return the same structure you expect
    res.json(modifiedIncomes);
  } catch (err) {
    // Enhanced error handling but keep same response structure
    console.error("Error in getIncome:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get Income by Month (additional endpoint for better filtering)
const getIncomeByMonth = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const { month, year } = req.query;
    
    if (!userId) {
      return res.status(401).json({ message: "User authentication required." });
    }

    let query = { userId };
    
    // Add month/year filtering if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const incomes = await Income.find(query).sort({ date: -1 });

    // Aggregate data for charts
    const aggregatedData = {
      weeklyExpenses: {},
      categoryTotals: {
        fixed: 0,
        variables: 0,
        investments: 0
      },
      totalSavings: 0,
      totalSpent: 0,
      totalSalary: 0
    };

    incomes.forEach(income => {
      // Aggregate weekly expenses
      if (income.weeklyExpenses) {
        income.weeklyExpenses.forEach(week => {
          if (!aggregatedData.weeklyExpenses[week.week]) {
            aggregatedData.weeklyExpenses[week.week] = 0;
          }
          aggregatedData.weeklyExpenses[week.week] += week.amount;
        });
      }

      // Aggregate category expenses
      if (income.categoryExpenses) {
        aggregatedData.categoryTotals.fixed += income.categoryExpenses.fixed || 0;
        aggregatedData.categoryTotals.variables += income.categoryExpenses.variables || 0;
        aggregatedData.categoryTotals.investments += income.categoryExpenses.investments || 0;
      }

      // Aggregate totals
      aggregatedData.totalSavings += income.savings || 0;
      aggregatedData.totalSpent += income.totalSpent || 0;
      aggregatedData.totalSalary += income.salary || 0;
    });

    res.status(200).json({
      message: "Filtered income data retrieved successfully.",
      data: incomes,
      aggregated: aggregatedData,
      summary: {
        totalRecords: incomes.length,
        period: month && year ? `${month}/${year}` : 'All time'
      }
    });

  } catch (err) {
    console.error("Error fetching filtered income data:", err);
    res.status(500).json({ 
      message: "Server error while fetching filtered income data.", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
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
