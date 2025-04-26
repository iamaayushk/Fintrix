import React from "react";

const AboutSection = () => {
  return (
    <section className="bg-white py-16 px-4 md:px-16 lg:px-32" id="about">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
          About Fintrix
        </h2>
        <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
          Fintrix is your AI-powered personal finance coach designed to simplify money 
          management. Whether you're budgeting your salary, tracking daily expenses, or 
          planning investments — Fintrix helps you visualize, understand, and optimize your finances.
        </p>
        <p className="text-lg text-gray-600 leading-relaxed">
          Built for students and young professionals, Fintrix promotes financial literacy with personalized 
          tips, smart analytics, and real-time investment suggestions. We bridge the gap between awareness 
          and action — helping you make confident financial decisions every day.
        </p>
      </div>
    </section>
  );
};

export default AboutSection;
