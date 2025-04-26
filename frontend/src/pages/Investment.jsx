import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../component/Navbar2';

function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [showFinance, setShowFinance] = useState(false);
  const [ticker, setTicker] = useState('RELIANCE.NS');
  const [budget, setBudget] = useState(5000);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:8888/api/tasks')
      .then(response => setTasks(response.data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:8888/api/tasks', { title: newTask })
      .then(response => {
        setTasks([...tasks, response.data]);
        setNewTask('');
      })
      .catch(error => console.error('Error adding task:', error));
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setChatMessages(prev => [...prev, { sender: 'user', text: userInput }]);
    setUserInput('');

    try {
      const response = await axios.post('http://localhost:8888/api/finance/chat', {
        message: userInput
      });

      setChatMessages(prev => [...prev, {
        sender: 'bot',
        text: response.data.response
      }]);
    } catch (error) {
      setChatMessages(prev => [...prev, {
        sender: 'bot',
        text: 'Sorry, I encountered an error processing your request.',
        isError: true
      }]);
    }
  };

  const analyzeStock = async () => {
    try {
      const response = await axios.post('http://localhost:8888/api/finance/analyze', {
        ticker,
        budget
      });
      setAnalysis(response.data);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysis({
        success: false,
        error: 'Failed to analyze stock'
      });
    }
  };

  return (
    <div className="relative min-h-screen">
      <Navbar />
      <h1 className="text-2xl font-bold p-4">Task Manager</h1>

      <div className="p-4">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setShowFinance(false)}
            className={`px-4 py-2 rounded-md ${!showFinance ? 'bg-gradient-to-r from-slate-800 to-teal-800 text-white' : 'bg-gray-200'}`}
          >
            Tasks
          </button>
          <button
            onClick={() => setShowFinance(true)}
            className={`px-4 py-2 rounded ${showFinance ? 'bg-gradient-to-r from-slate-800 to-teal-800 text-white' : 'bg-gray-200'}`}
          >
            Finance
          </button>
        </div>

        {!showFinance ? (
          <>
            <form onSubmit={handleSubmit} className="mb-4">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="New task"
                className="p-2 border rounded"
              />
              <button type="submit" className="ml-2 px-4 py-2 border bg-gradient-to-r from-slate-800 to-teal-800 text-white rounded">
                Add Task
              </button>
            </form>

            <ul className="list-disc ml-6">
              {tasks.map(task => (
                <li key={task.id}>{task.title}</li>
              ))}
            </ul>
          </>
        ) : (
          <div className="finance-section">
            <div className="mb-4 w-[800px]">
              <label className="block mb-2">Stock Ticker:</label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="p-2 border rounded w-full"
                placeholder="e.g., RELIANCE.NS"
              />
            </div>

            <div className="mb-4 w-[800px]">
              <label className="block mb-2">Budget (₹):</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="1000"
                max="100000"
                step="500"
                className="p-2 border rounded w-full"
              />
            </div>

            <button
              onClick={analyzeStock}
              className="px-4 py-2 bg-gradient-to-r from-slate-800 to-teal-800 text-white rounded"
            >
              Analyze Stock
            </button>

            {analysis && (
              <div className="mt-4 p-4 bg-white/30 backdrop-blur-md rounded-lg">
                {analysis.success ? (
                  <>
                    <h3 className="font-bold">Analysis for {analysis.ticker}</h3>
                    <p>Current Price: ₹{analysis.current_price?.toFixed(2) || 'N/A'}</p>
                    <p>Score: {analysis.score?.toFixed(1)}/100</p>
                    <p className="font-semibold">Recommendation: {analysis.recommendation}</p>
                  </>
                ) : (
                  <p className="text-red-500">{analysis.error}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chatbox */}
      <div className="fixed bottom-2 right-6 w-90 h-[604px] bg-white/30 backdrop-blur-md border rounded-xl shadow-lg flex flex-col">
        <div className="p-3 font-semibold bg-gradient-to-r from-slate-800 to-teal-800 text-white rounded-t-xl">
          Financial Assistant
        </div>
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`text-sm p-2 border-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100 mr-auto'
                } ${msg.isError ? 'border-red-200' : ''}`}
            >
              {msg.text}
            </div>
          ))}
        </div>
        <form onSubmit={handleChatSubmit} className="p-3 flex border-t">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask about stocks or investments..."
            className="flex-1 px-2 py-1 border rounded"
          />
          <button
            type="submit"
            className="ml-2 px-3 py-1 bg-gradient-to-r from-slate-800 to-teal-800 text-white rounded cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default TaskManager;
