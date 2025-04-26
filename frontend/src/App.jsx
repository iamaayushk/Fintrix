import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Logger from './pages/Logger';
// import InvestmentChat from './pages/investmentChat';
import Investment from './pages/Investment'
import Dashboard from './pages/Dashboard';
import { Card } from './component/ui/card-hover-effect';
import Signup from './pages/Signup';
import Login from './pages/Login';


function App() {
  return (
  
    <>
    {/* <Card/> */}
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logger" element={<Logger />} />
        {/* <Route path="/investment" element={<InvestmentChat />} /> */}
        <Route path="/investment" element={<Investment />} />

        <Route path="/dashboard" element={<Dashboard/>} />

      </Routes>
    </Router>
    </>
  );
}

export default App;
