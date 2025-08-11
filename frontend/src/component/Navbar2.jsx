import React from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Navbar = () => {
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:3000/users/logout", {}, { withCredentials: true }); // Send logout request to backend
      navigate("/login"); // Redirect to login page after logout
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav className="bg-gradient-to-b from-zinc-900  to-gray-900 border-b-1 border-gray-500 text-white shadow-md py-4 px-6 md:px-16">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            
            {/* Logo */}
            <Link to="/" className="text-[32px] font-bold text-white">
              Fintrix
            </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex gap-8 text-zinc-200 font-medium text-[18px]">
          <Link to="/" className="hover:text-white transition">Home</Link>
          {/* <Link to="/about" className="hover:text-black transition">About</Link> */}
          {/* <a href="#about" className="hover:text-black transition">About</a> */}
          <Link to="/logger" className="hover:text-white transition">Logger</Link>
          <Link to="/investment" className="hover:text-white transition">Investment</Link>
          <Link to="/dashboard" className="hover:text-white transition">Dashboard</Link>
        </div>

        {/* Logout Button */}
        <div className="hidden md:flex gap-4">
          <button
            onClick={handleLogout}
            className="px-5 py-2 bg-red-800 text-white rounded-sm font-semibold cursor-pointer hover:bg-black hover:text-red-500 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
