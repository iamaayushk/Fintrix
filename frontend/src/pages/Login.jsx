import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../component/Navbar";
import Cookies from "js-cookie";
import img from '../../public/login.jpg';
// import ReCAPTCHA from "react-google-recaptcha";
import { BackgroundBeamsWithCollision } from "../component/ui/background-beams-with-collision";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

  

    try {
      const res = await axios.post("http://localhost:3000/users/login", { ...formData}, {
        withCredentials: true, // IMPORTANT for sending and receiving cookies
      });

      if (res.status === 200) {
        Cookies.set("token", res.data.token, { expires: 1 });

        // Delay to ensure cookies are set before navigation
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-gray-900">
      <Navbar />
      {/* <div className="flex items-center  bg-gradient-to-b from-zinc-900 to-gray-900 justify-center min-h-[70vh] space-x-8 border-2 rounded-xl m-15"> */}
      <BackgroundBeamsWithCollision >
        {/* <img src={img} className="w-[350px] h-[250px] object-cover rounded-lg" /> */}

        <form onSubmit={handleSubmit} className="z-10000 bg-gradient-to-b from-zinc-600 to-zinc-900 p-10 rounded-xl w-full max-w-md space-y-4">
          <h2 className="text-2xl font-bold text-neutral-300 text-center">Welcome Back</h2>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border rounded text-white bg-zinc-900"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 border rounded text-white bg-zinc-900"
            required
          />


  


          <button type="submit" className="w-full bg-blue-900 cursor-pointer text-white font-semibold p-3 rounded-lg hover:bg-gray-500 hover:text-black transition"          >
            Log In
          </button>

          <p className="text-sm text-center text-gray-200">
            Don’t have an account?{" "}
            <a href="/signup" className="text-blue-400 hover:underline">
              Sign Up
            </a>
          </p>
        </form>
      </BackgroundBeamsWithCollision>
      </div>
    // </div>
  );
};


export default Login;
