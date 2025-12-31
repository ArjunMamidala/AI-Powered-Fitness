import React from "react";
import assets from "../assets/assets";
import { Dumbbell, Users, Wind, Lock, Coffee, Droplet, Heart, User, Zap } from "lucide-react";

export default function AboutAndAmenities() {
  const amenities = [
    {
      icon: <Dumbbell className="w-10 h-10 text-blue-600 mx-auto mb-4" />,
      title: "Free Weights",
      description: "A wide variety of free weights to build strength and target specific muscle groups. Perfect for improving balance and coordination."
    },
    {
      icon: <Zap className="w-10 h-10 text-blue-600 mx-auto mb-4" />,
      title: "Machines",
      description: "A selection of machines for strength training, targeting every muscle group. Strongly recommended for beginners learning proper form."
    },
    {
      icon: <Dumbbell className="w-10 h-10 text-blue-600 mx-auto mb-4" />,
      title: "Barbells",
      description: "Heavy-duty barbells for serious lifters, perfect for compound movements and maximizing strength."
    },
    {
      icon: <Users className="w-10 h-10 text-blue-600 mx-auto mb-4" />,
      title: "Group Fitness Classes",
      description: "Join a variety of group fitness classes including yoga, HIIT, spinning, and more to stay motivated."
    },
    {
      icon: <Wind className="w-10 h-10 text-blue-600 mx-auto mb-4" />,
      title: "Sauna & Relaxation",
      description: "Unwind after a tough session with our sauna and dedicated relaxation areas, helping to ease muscle tension."
    },
    {
      icon: <Lock className="w-10 h-10 text-blue-600 mx-auto mb-4" />,
      title: "Locker Rooms",
      description: "Secure lockers, showers, and changing areas to keep your belongings safe and stay fresh."
    },
    {
      icon: <Coffee className="w-10 h-10 text-blue-600 mx-auto mb-4" />,
      title: "Nutrition Bar",
      description: "Grab a post-workout protein shake, snack, or hydration boost at our on-site nutrition bar."
    },
    {
      icon: <Droplet className="w-10 h-10 text-blue-600 mx-auto mb-4" />,
      title: "Hydromassage Machines",
      description: "Relax with our hydromassage machines to soothe tired muscles and speed up recovery."
    },
    {
      icon: <Heart className="w-10 h-10 text-blue-600 mx-auto mb-4" />,
      title: "Cardio Machines",
      description: "Get your heart pumping with our state-of-the-art treadmills, ellipticals, and stationary bikes."
    },
    {
      icon: <User className="w-10 h-10 text-blue-600 mx-auto mb-4" />,
      title: "Personal Training",
      description: "Work with our certified personal trainers for customized workout plans and guidance."
    },
  ];
  return (
    <div className="w-full bg-gray-50">
      {/* About Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Image */}
          <div className="md:w-1/2">
            <img
              src={assets.aboutGym}
              alt="Our Gym"
              className="rounded-lg shadow-xl w-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Text */}
          <div className="md:w-1/2 text-center md:text-left">
            <h2 className="text-4xl font-extrabold text-gray-800 mb-4">
              About Our Gym
            </h2>
            <p className="text-gray-600 mb-4 text-lg leading-relaxed">
              At AI-Powered Fitness, we’re committed to helping you achieve your
              fitness goals. Our experienced trainers, modern equipment, and
              welcoming community make every workout effective and enjoyable.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              Whether you’re starting your fitness journey or looking to level
              up, we provide a supportive environment where everyone can thrive.
            </p>
            <a
              href="/memberships"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors"
            >
              Join Us Today
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-white rounded-xl shadow-lg">
            <p className="text-4xl font-bold text-blue-600 mb-2">500+</p>
            <p className="text-gray-600">Active Members</p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-lg">
            <p className="text-4xl font-bold text-blue-600 mb-2">50+</p>
            <p className="text-gray-600">Classes Weekly</p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-lg">
            <p className="text-4xl font-bold text-blue-600 mb-2">15+</p>
            <p className="text-gray-600">Expert Trainers</p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-lg">
            <p className="text-4xl font-bold text-blue-600 mb-2">24/7</p>
            <p className="text-gray-600">Access Available</p>
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      {/* Amenities Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 bg-white shadow-lg rounded-xl">
        <h2 className="text-4xl font-extrabold text-gray-800 mb-4 text-center">
          Our Amenities
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          We provide world-class facilities and amenities to support your fitness journey
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {amenities.map((amenity, index) => (
            <div
              key={index}
              className="bg-gray-50 p-8 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ease-in-out text-center group"
            >
              <div className="group-hover:scale-110 transition-transform duration-300">
                {amenity.icon}
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-800">
                {amenity.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {amenity.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
