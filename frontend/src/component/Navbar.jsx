import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-gradient-to-r from-slate-800 to-teal-700 shadow-md py-4 px-6 md:px-16">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* Logo */}
        <Link to="/" className="text-[32px] font-bold text-white">
          Fintrix
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex gap-8 text-zinc-200 font-medium text-[18px]">
          <Link to="/" className="hover:text-white transition">Home</Link>
          {/* <Link to="/about" className="hover:text-black transition">About</Link> */}
          <a href="#about" className="hover:text-white transition">About</a>
          <Link to="/logger" className="hover:text-white transition">Logger</Link>
          <Link to="/investment" className="hover:text-white transition">Investment</Link>
          <Link to="/dashboard" className="hover:text-white transition">Dashboard</Link>

        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex gap-4">
          <Link to="/login">
            <p className="px-5 py-2  text-white font-semibold ">
              Login
            </p>
          </Link>
          <Link to="/signup">
            <button className="px-5 py-2 bg-black text-white rounded-sm font-semibold cursor-pointer hover:bg-blue-100 hover:text-black   transition">
              Sign Up 
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
