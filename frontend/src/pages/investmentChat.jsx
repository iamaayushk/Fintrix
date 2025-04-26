import React, { useState } from 'react';
import axios from 'axios';

const InvestmentAdvisor = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');

  const handleAsk = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/finance/chat', {
        message: query,
      });
      setResponse(res.data.reply);
    } catch (error) {
      console.error('Error sending message', error);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Investment Advisor</h2>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask about investments..."
        className="w-full p-2 border rounded"
        rows={4}
      />
      <button onClick={handleAsk} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">
        Ask
      </button>
      <div className="mt-4">
        <strong>Bot Response:</strong>
        <p>{response}</p>
      </div>
    </div>
  );
};

export default InvestmentAdvisor;
