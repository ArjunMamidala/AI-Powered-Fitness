import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { set } from 'mongoose';


const Memberships = () => {

  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [loadingMap, setLoadingMap] = useState({});
  const [expandedPlan, setExpandedPlan] = useState(null); 
  const [currentMembership, setCurrentMembership] = useState(null);
  const [checkingMembership, setCheckingMembership] = useState(true);


  const memberships = ([
    {
      id: "basic",
      name: "Basic Plan",
      price: "30",
      duration: "per month",
      description: "Perfect for beginners or those who want essential gym access without the frills. Get started on your fitness journey with our core facilities.",
      detailedDescription: "Our Basic Plan gives you unlimited access to all gym equipment, including cardio machines, free weights, and strength training equipment. Perfect for individuals who prefer self-guided workouts and want to build a consistent fitness routine at an affordable price.",
      benefits: [
        "Access to Gym Facilities",
        "Free WiFi",
        "Free Parking",
      ],
      features: [
        "24/7 Gym Access",
        "All Cardio Equipment",
        "Weight Training Area",
        "Mobile App Access"
      ],
      bestFor: ["Beginners", "Budget-conscious", "Self-motivated individuals"],
      popular: false,
    },
    {
      id: "premium",
      name: "Premium Plan",
      price: "50",
      duration: "per month",
      description: "Our most popular plan with group classes and expert guidance. Take your fitness to the next level with community support.",
      detailedDescription: "The Premium Plan includes everything in Basic plus access to all group fitness classes and nutritional guidance. Join our vibrant fitness community with yoga, HIIT, spin classes, and more. Get personalized attention from our certified trainers.",
      benefits: [
        "All Basic Plan Features",
        "Group Fitness Classes",
        "Nutritional Guidance",
      ],
      features: [
        "50+ Weekly Group Classes",
        "Personalized Nutrition Plan",
        "Body Composition Analysis",
        "Class Booking Priority"
      ],
      bestFor: ["Regular gym-goers", "Class enthusiasts", "Those seeking guidance"],
      popular: true,
    },
    {
      id: "vip",
      name: "VIP Plan",
      price: "80",
      duration: "per month",
      description: "The ultimate fitness experience with personalized training and exclusive benefits. Achieve your goals faster with dedicated support.",
      detailedDescription: "Our VIP Plan offers the complete fitness experience with one-on-one personal training sessions, exclusive workshops, and premium amenities. Get customized workout plans, regular progress assessments, and access to member-only events for comprehensive fitness transformation.",
      benefits: [
        "All Premium Plan Features",
        "Personalized Training",
        "Exclusive Workshops",
      ],
      features: [
        "4 Personal Training Sessions/Month",
        "Advanced Body Analytics",
        "Recovery Services Access",
        "VIP Lounge Access"
      ],
      bestFor: ["Serious athletes", "Rapid results seekers", "Comprehensive wellness"],
      popular: false,
    },
  ]);

  useEffect(() => {
    const fetchCurrentMembership = async () => {
      if (!isLoaded || !user) {
        setCheckingMembership(false);
        return;
      }

      try {
        const token = await getToken();
        const { data } = await axios.get('http://localhost:3105/api/memberships/current', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (data.success && data.membership.length > 0) {
          setCurrentMembership(data.membership[0]);
        }
      }
      catch (error) {
        console.error("Error fetching current membership: ", error);
      }
      finally {
        setCheckingMembership(false);
      }
  };
    fetchCurrentMembership();
  }, [isLoaded, user, getToken]);

  const toggleExpand = (planId) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  const handleJoinNow = async (membership) => {
  if (!isLoaded) {
    return;
  }
  if (!user) {
      alert("Please log in to subscribe.");
      return;
  }

  setLoadingMap(prev => ({ ...prev, [membership.id]: true }));

  const userId = user.id;

  try {
      const token = await getToken();
      
      // FIRST REQUEST: Check for existing membership
      const response = await axios.post(
        'http://localhost:3105/api/subscribe/create-checkout-session', 
        {
          userId, 
          membershipName: membership.name, 
          membershipPrice: membership.price,
          forceCreate: false
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.hasActiveMembership) {
        const current = response.data.currentMembership;
        const confirmSwitch = window.confirm(
          `You already have an active membership (${current.name} - $${current.price}). ` +
          `Joining a new plan will cancel your current membership. Do you want to proceed?`
        );
        
        if (!confirmSwitch) {
          return;  // Will hit finally block to reset loading
        }

        // User confirmed - make SECOND REQUEST with forceCreate=true
        const forceResponse = await axios.post(
          'http://localhost:3105/api/subscribe/create-checkout-session',
          {
            userId, 
            membershipName: membership.name, 
            membershipPrice: membership.price,
            forceCreate: true  // Force creation this time
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const checkoutUrl = forceResponse.data.url;
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          console.error('No checkout URL received:', forceResponse.data);
          alert('Failed to create checkout session. Please try again.');
        }
      } else {
        // No existing membership - use first response URL
        const checkoutUrl = response.data.url;
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          console.error('No checkout URL received:', response.data);
          alert('Failed to create checkout session. Please try again.');
        }
      }
  }
  catch (error) {
      console.error("Error creating checkout session: ", error);
      if (error.response?.data?.error) {
          alert(error.response.data.error);
      } else {
          alert("There was an error with your subscription");
      }
  }
  finally {
      // Always reset loading state
      setLoadingMap(prev => ({ ...prev, [membership.id]: false }));
  }
};

  if (checkingMembership) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="membership-page py-16 bg-gray-50 min-h-screen">
      <section className="max-w-7xl mx-auto px-4">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Choose Your Membership
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Find the perfect plan that fits your fitness journey. From essential access to premium training, 
            we have options for every goal and budget.
          </p>
          
          {/* Plan Comparison Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold text-lg">$30</span>
              </div>
              <h3 className="font-semibold text-gray-800">Basic</h3>
              <p className="text-sm text-gray-600">Essential Access</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold text-lg">$50</span>
              </div>
              <h3 className="font-semibold text-gray-800">Premium</h3>
              <p className="text-sm text-gray-600">Most Popular</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold text-lg">$80</span>
              </div>
              <h3 className="font-semibold text-gray-800">VIP</h3>
              <p className="text-sm text-gray-600">Ultimate Experience</p>
            </div>
          </div>
        </div>
        
        {/* Membership Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {memberships.map((membership) => (
            <div 
              key={membership.id}
              className={`relative bg-white rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                membership.popular ? 'ring-2 ring-blue-500 transform md:scale-105' : ''
              }`}
            >
              {/* Popular Badge */}
              {membership.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {membership.name}
                </h3>
                
                {/* Short Description */}
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {membership.description}
                </p>
                
                {/* Price Section */}
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-blue-600">
                    ${membership.price}
                  </span>
                  <span className="text-gray-600 ml-2">{membership.duration}</span>
                </div>
                
                {/* Best For Section */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Perfect For:</h4>
                  <div className="flex flex-wrap gap-2">
                    {membership.bestFor.map((type, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Benefits List */}
                <ul className="space-y-3 mb-6">
                  {membership.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start text-gray-700">
                      <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                
                {/* Expandable Detailed Description */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => toggleExpand(membership.id)}
                    className="flex items-center justify-between w-full text-left text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <span className="font-medium">View Details</span>
                    <svg 
                      className={`w-4 h-4 transition-transform ${expandedPlan === membership.id ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {expandedPlan === membership.id && (
                    <div className="mt-4 space-y-4 animate-fadeIn">
                      <div>
                        <h5 className="font-semibold text-gray-800 mb-2">Plan Overview</h5>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {membership.detailedDescription}
                        </p>
                      </div>
                      
                      <div>
                        <h5 className="font-semibold text-gray-800 mb-2">Key Features</h5>
                        <ul className="grid grid-cols-1 gap-2">
                          {membership.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center text-sm text-gray-600">
                              <svg className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Join Now Button */}
                <button 
                  onClick={() => handleJoinNow(membership)}
                  disabled={loadingMap[membership.id]}
                  className={`w-full mt-6 py-4 font-semibold rounded-lg transition-all duration-200 ${
                    membership.popular 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-800 text-white hover:bg-gray-900'
                  } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                >
                  {loadingMap[membership.id] ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    `Join ${membership.name}`
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Information Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Membership Benefits Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">24/7 Access</h3>
              <p className="text-sm text-gray-600">Work out on your schedule with round-the-clock gym access</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Expert Trainers</h3>
              <p className="text-sm text-gray-600">Certified professionals to guide your fitness journey</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">All Equipment</h3>
              <p className="text-sm text-gray-600">State-of-the-art machines and free weights available</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Flexible Plans</h3>
              <p className="text-sm text-gray-600">No long-term contracts, cancel anytime</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Memberships;
