import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../component/Navbar";
import Cookies from "js-cookie";
import img from '../../public/login.jpg';

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://localhost:3000/users/login", formData, {
        withCredentials: true, // IMPORTANT for sending and receiving cookies
      });

      if (res.status === 200) {
        Cookies.set("token", res.data.token, { expires: 1 });

        // Delay to ensure cookies are set before navigation
        setTimeout(() => {
          navigate("/dashboard");
        }, 100); 
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 bg-gradient-to-r from-green-900 to-blue-900">
      <Navbar />
      <div className="flex items-center bg-white justify-center min-h-[70vh] space-x-8 border-2 rounded-xl m-15">
        <img src={img} className="w-[350px] h-[250px] object-cover rounded-lg" />

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl w-full max-w-md space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 text-center">Welcome Back</h2>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border rounded"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 border rounded"
            required
          />

          <button type="submit" className="w-full bg-blue-900 cursor-pointer text-white p-3 rounded-lg hover:bg-blue-800 transition">
            Log In
          </button>

          <p className="text-sm text-center text-gray-600">
            Don’t have an account?{" "}
            <a href="/signup" className="text-blue-400 hover:underline">
              Sign Up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
