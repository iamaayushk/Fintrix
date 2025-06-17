import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate(); 

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      alert("User not authenticated. Redirecting to login.");
      navigate('/login');
    } else {
      axios.get('http://localhost:8888/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => setTasks(response.data))
      .catch(error => console.error('Error fetching tasks:', error));
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const token = Cookies.get('token');
    if (!token) {
      alert("User not authenticated. Please login again.");
      navigate('/login');
      return;
    }

    axios.post(
      'http://localhost:8888/api/tasks',
      { title: newTask },
      { headers: { Authorization: `Bearer ${token}` } }
    )
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
    <div className="relative min-h-screen bg-gradient-to-b from-zinc-800 to-gray-900 ">
      <Navbar />

      <h1 className="text-2xl font-bold p-4 text-zinc-200">Task Manager</h1>

      <div className="p-4">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setShowFinance(false)}
            className={`px-4 py-2 rounded-md font-semibold cursor-pointer ${!showFinance ? 'bg-blue-400 text-black' : 'bg-transparent text-white'}`}
          >
            Tasks
          </button>
          <button
            onClick={() => setShowFinance(true)}
            className={`px-4 py-2 rounded font-semibold cursor-pointer ${showFinance ? 'bg-blue-400 text-black' : 'bg-transparent text-white'}`}
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
                className="p-2 border rounded border-white text-white"
              />
              <button type="submit" className="ml-2 px-4 py-2 border bg-blue-400 text-black font-semibold rounded">
                Add Task
              </button>
            </form>

            <ul className="list-disc ml-6 text-white">
              {tasks.map(task => (
                <li key={task.id}>{task.title}</li>
              ))}
            </ul>
          </>
        ) : (
          <div className="finance-section">
            <div className="mb-4 w-[800px]">
              <label className="block mb-2 text-zinc-300">Stock Ticker:</label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="p-2 border rounded w-full border-white text-white"
                placeholder="e.g., RELIANCE.NS"
              />
            </div>

            <div className="mb-4 w-[800px]">
              <label className="block mb-2 text-zinc-300">Budget (₹):</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                min="1000"
                max="100000"
                step="500"
                className="p-2 border rounded w-full border-white text-white"
              />
            </div>

            <button
              onClick={analyzeStock}
              className="px-4 py-2 bg-blue-400 text-black font-semibold rounded"
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

      <div className="fixed bottom-2 right-6 w-90 h-[604px] bg-white/30 backdrop-blur-md border rounded-xl shadow-lg flex flex-col">
        <div className="p-3 font-semibold bg-gradient-to-r from-gray-800 to-zinc-800 text-white rounded-t-xl">
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
            className="flex-1 px-2 py-1 border rounded border-white text-black bg-white"
          />
          <button
            type="submit"
            className="ml-2 px-3 py-1 bg-blue-400 text-black font-semibold rounded cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default TaskManager;
