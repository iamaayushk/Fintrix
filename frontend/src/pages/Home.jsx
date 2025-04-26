import React, { useEffect } from "react";
import Navbar from "../component/Navbar";
import '../index.css';
import img from '../../public/hero.png'; 
import { HoverEffect } from "../component/ui/card-hover-effect";
import { Link } from "react-router-dom";
import { FaEnvelope } from "react-icons/fa";

// import { Card } from "../component/ui/card-hover-effect";


const Home = () => {

    const items = [
        {
          title: "Log Income and Expenses",
          description: "Track daily income, fixed expenses and variable expenses via an intuitive interface.",
        //   link: "/finance",
        },
        {
          title: "Visualize Spending",
          description: "Offers an interactive dashboard using Chart.js to categorize spending into Needs, Wants, and Savings, helping users understand their financial habits.",
        //   link: "/investments",
        },
        {
          title: "Receive AI-Powered Advice",
          description: "Provides personalized financial guidance, including ideal spending-to-saving ratios, investment suggestions (e.g., SIP, PPF, Mutual Funds), and tips to reduce unnecessary spending, powered by AI models trained on simulated user personas.",
          link: "/expenses",
        },
        {
            title:"Promote Financial Inclusion",
            description:"Simplifies investment decisions and fosters healthy saving habits, making financial management accessible to diverse incomes and underserved communities.",

        },
        {
            title:"Ensure Security",
            description:"Stores user data securely in MongoDB with encryption ensuring privacy and no third-party access."
        },
        {
            title:"Our Goal ",
            description:"Whether you're just getting started or striving to optimize your investments, Fintrix bridges the gap between financial awareness and actionable insights—one smart decision at a time."
        }
        
      ];
  // Add some effect to trigger animations when the component mounts
  useEffect(() => {
    const text = document.querySelector(".animate-text");
    const button = document.querySelector(".animate-button");
    const image = document.querySelector(".animate-image");

    // Trigger animations
    setTimeout(() => {
      text.classList.remove("opacity-0");
      text.classList.add("opacity-100", "transform", "translate-x-0", "transition-all", "duration-1000");
      button.classList.remove("opacity-0");
      button.classList.add("opacity-100", "transition-opacity", "duration-1000");
      image.classList.remove("opacity-0");
      image.classList.add("opacity-100", "transition-opacity", "duration-1000", "transform", "translate-x-0");
    }, 300);
  }, []);

  return (
    <div className="relative overflow-hidden ">

      <Navbar />

      <section
        id="home"
        className="relative z-10 py-20 px-6 md:px-20 bg-gradient-to-r from-green-900 to-blue-900"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between text-center md:text-left">
          {/* Text and Button Section */}
          <div className="text-center ml-10 md:text-left animate-text opacity-0 transform translate-x-[-100px]">
            <h1 className="text-[54px] font-extrabold text-white mb-4 w-[560px] ">
              How will you spend your <span className="strike-green">money</span> LIFE
            </h1>
            <p className="text-lg text-zinc-200 font-bold mb-8">
              AI Powered Personal Finance & Investment Advisor
            </p>
            <a
              href="/login"
              className="bg-black text-white px-6 py-3 rounded-sm font-semibold hover:bg-white hover:text-black transition animate-button opacity-0"
            >
              Start Your Journey 
            </a>
          </div>

          {/* Image Section */}
          <div className="mt-8 md:mt-0 animate-image opacity-0 transform translate-x-[100px]">
            <img
              src={img}
              alt="Hero"
              className="w-[full] md:w-[850px] h-[450px] mx-auto "
            />
          </div>
        </div>
      </section>

      {/* About Section */}

      <section id="about" className="relative z-10 py-20 px-6 bg-gradient-to-r from-blue-900 to-green-900 md:px-8 ">
        <div className="max-w-6xl mx-auto text-center md:text-left">
          <h2 className="text-5xl font-bold text-center text-white mb-6">About Fintrix</h2>
          <p className="text-lg text-gray-200 leading-relaxed mb-4">
            In today's fast-paced world, managing finances can be overwhelming especially for students and young professionals. <strong>Fintrix</strong> is built to solve this challenge by serving as your intelligent, secure, and personalized financial assistant.
          </p>
          <HoverEffect items={items} className="space-y-8" />
          {/* <p className="text-lg text-white leading-relaxed mb-4">
            From logging your daily income and expenses to analyzing your spending behavior, Fintrix provides you with AI-powered financial advice tailored to your lifestyle. Our goal? To help you make smarter financial decisions, grow your savings, and build a more confident financial future.
          </p>
          <p className="text-lg text-white leading-relaxed">
            Whether you're just getting started or striving to optimize your investments, Fintrix bridges the gap between financial awareness and actionable insights—one smart decision at a time.
          </p> */}
        </div>
      </section>
      <footer className="bg-gradient-to-r from-slate-800 to-teal-700 text-white px-6 py-8 md:px-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Logo & Tagline */}
        <div>
          <h1 className="text-2xl font-bold mb-2">Fintrix</h1>
          <p className="text-zinc-300">AI Powered Personal Finance & Investment Advisor</p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold mb-2">Navigation</h2>
          <Link to="/" className="hover:text-gray-300">Home</Link>
          <a href="#about" className="hover:text-gray-300">About</a>
          <Link to="/logger" className="hover:text-gray-300">Logger</Link>
          <Link to="/investment" className="hover:text-gray-300">Investment</Link>
          <Link to="/dashboard" className="hover:text-gray-300">Dashboard</Link>
        </div>

        {/* Contact & Socials */}
        <div>
          <h2 className="font-semibold mb-2">Connect</h2>
          <div className="flex gap-4 items-center mt-2">
            <a href="mailto:team@fintrix.com" className="hover:text-gray-300">
              <FaEnvelope size={20} />
            </a>
           
          </div>
        </div>

      </div>

      <div className="text-center text-sm text-zinc-900 mt-8">
        © {new Date().getFullYear()} Fintrix. All rights reserved.
      </div>
    </footer>

    </div>
  );
};

export default Home;
