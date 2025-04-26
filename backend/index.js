const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const axios = require('axios');
dotenv.config();

const app = express(); 

const Port = process.env.PORT || 3000;

connectDB();

app.use(cookieParser()); 
app.use(express.json());
// Express backend setup

app.use(cors({
  origin: "http://localhost:5173", // or wherever your frontend runs
  credentials: true,              // VERY IMPORTANT for cookies to work
}));


// Routes
app.use('/users', userRoutes);



// Start server
app.listen(Port, () => {
  console.log(`Server is running on port ${Port}`);
});
