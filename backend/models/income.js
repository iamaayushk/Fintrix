const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  salary: {
    type: Number,
    required: true,
    min: [0, 'Salary cannot be negative']
  },
  
  month: {
    type: String,
    required: true,
    enum: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
  },
  
  week: {
    type: String,
    required: true,
    enum: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']
  },
  
  weeklyExpenses: [
    {
      week: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true,
        min: 0
      }
    }
  ],
  
  categoryExpenses: {
    fixed: { 
      type: Number, 
      default: 0,
      min: [0, 'Fixed expenses cannot be negative']
    },
    variables: { 
      type: Number, 
      default: 0,
      min: [0, 'Variable expenses cannot be negative']
    },
    investments: { 
      type: Number, 
      default: 0,
      min: [0, 'Investments cannot be negative']
    }
  },
  
  savings: {
    type: Number,
    required: true
  },
  
  totalSpent: {
    type: Number,
    required: true,
    min: [0, 'Total spent cannot be negative']
  },
  
  note: {
    type: String,
    maxlength: [500, 'Note cannot exceed 500 characters']
  },
  
  date: {
    type: Date,
    default: Date.now
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound index to prevent duplicate entries for same user, month, week, and year
incomeSchema.index({ 
  userId: 1, 
  month: 1, 
  week: 1,
  'date': 1 
}, { 
  unique: true,
  partialFilterExpression: {
    month: { $exists: true },
    week: { $exists: true }
  }
});

// Virtual for savings percentage
incomeSchema.virtual('savingsPercentage').get(function() {
  return this.salary > 0 ? ((this.savings / this.salary) * 100).toFixed(2) : 0;
});

// Pre-save middleware to update the updatedAt field
incomeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to get expense breakdown
incomeSchema.methods.getExpenseBreakdown = function() {
  const total = this.totalSpent;
  if (total === 0) return { fixed: 0, variables: 0, investments: 0 };
  
  return {
    fixed: ((this.categoryExpenses.fixed / total) * 100).toFixed(2),
    variables: ((this.categoryExpenses.variables / total) * 100).toFixed(2),
    investments: ((this.categoryExpenses.investments / total) * 100).toFixed(2)
  };
};

const Income = mongoose.model('Income', incomeSchema);
module.exports = Income;