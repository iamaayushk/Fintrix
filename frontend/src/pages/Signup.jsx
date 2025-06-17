import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../component/Navbar";
import img from '../../public/signup.jpg'
import { BackgroundBeamsWithCollision } from "../component/ui/background-beams-with-collision";


const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
    await axios.post("http://localhost:3000/users/signup", formData, { withCredentials: true });
      setMessage("Signup successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-gray-900">
      <Navbar />
      <BackgroundBeamsWithCollision>
      <div className="flex items-center justify-center min-h-[70vh] space-x-8 rounded-xl m-15">
              {/* Image on the left */}
              {/* <img src={img} className="w-[350px] h-[250px] object-cover rounded-lg" /> */}
        <form
          onSubmit={handleSubmit}
          className="z-10000 bg-gradient-to-b from-zinc-600 to-zinc-900 p-8 rounded-xl  w-full max-w-md space-y-4"
        >
          <h2 className="text-2xl font-bold text-zinc-300 text-center">Create Your Account</h2>
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          {message && <p className="text-green-600 text-sm text-center">{message}</p>}

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3  rounded-lg bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3  bg-zinc-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 bg-zinc-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-900 cursor-pointer text-white font-semibold p-3 rounded-lg hover:bg-gray-500 hover:text-black transition"
          >
            Sign Up
          </button>

          <p className="text-sm text-center text-gray-300">
            Already have an account?{" "}
            <a href="/login" className="text-blue-500 hover:underline">
              Log In
            </a>
          </p>
        </form>
      </div>
      </BackgroundBeamsWithCollision>   
    </div>
  );
};

export default Signup;
