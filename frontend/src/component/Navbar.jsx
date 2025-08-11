import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react"; // Using lucide-react for icons

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-gradient-to-b min-w-full from-zinc-900 to-gray-900 border-b border-gray-500 text-white shadow-md py-4 px-4 sm:px-6 md:px-16">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl sm:text-3xl md:text-2xl md:mr-5 font-bold text-white">
          Fintrix
        </Link>

        {/* Hamburger Menu Button (Mobile) */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={toggleMenu}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        {/* Navigation Links and Auth Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex gap-8 md:gap-4 text-zinc-200 font-medium md:text-sm text-lg">
            <Link to="/" className="hover:text-white transition">
              Home
            </Link>
            <a href="#about" className="hover:text-white transition">
              About
            </a>
            <Link to="/logger" className="hover:text-white transition">
              Logger
            </Link>
            <Link to="/investment" className="hover:text-white transition">
              Investment
            </Link>
            <Link to="/dashboard" className="hover:text-white transition">
              Dashboard
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex gap-4 justify-center items-center">
            <Link to="/login">
              <p className="px-5 py-2 text-white font-semibold hover:text-blue-300 transition">
                Login
              </p>
            </Link>
            <Link to="/signup">
              <button className=" py-2 md:w-[80px] bg-black text-white rounded-sm font-semibold hover:bg-blue-600 hover:text-white transition">
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-4 flex flex-col gap-4 bg-gray-800 p-4 rounded-lg">
          <Link
            to="/"
            className="text-zinc-200 font-medium text-lg hover:text-white transition"
            onClick={toggleMenu}
          >
            Home
          </Link>
          <a
            href="#about"
            className="text-zinc-200 font-medium text-lg hover:text-white transition"
            onClick={toggleMenu}
          >
            About
          </a>
          <Link
            to="/logger"
            className="text-zinc-200 font-medium text-lg hover:text-white transition"
            onClick={toggleMenu}
          >
            Logger
          </Link>
          <Link
            to="/investment"
            className="text-zinc-200 font-medium text-lg hover:text-white transition"
            onClick={toggleMenu}
          >
            Investment
          </Link>
          <Link
            to="/dashboard"
            className="text-zinc-200 font-medium text-lg hover:text-white transition"
            onClick={toggleMenu}
          >
            Dashboard
          </Link>
          <div className="flex flex-col gap-4 mt-4">
            <Link to="/login" onClick={toggleMenu}>
              <p className="px-5 py-2 text-white font-semibold text-center border border-gray-600 rounded-sm hover:bg-gray-700 transition">
                Login
              </p>
            </Link>
            <Link to="/signup" onClick={toggleMenu}>
              <button className="px-5 py-2 bg-black text-white rounded-sm font-semibold w-full hover:bg-blue-600 transition">
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;