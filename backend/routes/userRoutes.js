const express = require('express');
const router = express.Router();
const { registerUser, loginUser, postIncome, getIncome, dashboard ,logout, updateWeeklyExpense } = require('../controllers/userController');
const auth = require('../middleware/auth')
const axios  = require('axios');
router.post('/signup', registerUser);
router.post('/login', loginUser);
router.get('/dashboard', auth, dashboard);
router.post('/postIncome', auth, postIncome);
router.patch('/updateIncome', auth, updateWeeklyExpense);
router.post('/logout', logout)
router.get('/getIncome', auth, getIncome);


// router.post('/api/finance/chat', chatbotHandler);
module.exports = router;
