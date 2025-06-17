const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  salary: {
    type: Number,
    required: true
  },
  weeklyExpenses: [
    {
      week: String, // e.g., "Week 1"
      amount: Number // e.g., 1500
    }
  ],
  categoryExpenses: {
    fixed: { type: Number, default: 0 },
    variables: { type: Number, default: 0 },
    investments: { type: Number, default: 0 }
  },
  savings: {
    type: Number,
    required: true
  },
  totalSpent: {
    type: Number,
    required: true
  },
  note: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Income = mongoose.model('Income', incomeSchema);
module.exports = Income;
