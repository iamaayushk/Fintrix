// chatbotHandler.js
const axios = require('axios');

const chatbotHandler = async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await axios.post('http://localhost:5000/api/finance/chat', {
      message: userMessage
    });

    res.json({ response: response.data.response });
  } catch (error) {
    console.error('Chatbot error:', error.message);
    res.status(500).json({ response: 'Failed to connect to financial assistant.' });
  }
};

module.exports = chatbotHandler;
