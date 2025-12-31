import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';

const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchClassDetails();
  }, [id]);

  const fetchClassDetails = async () => {
    try {
      // Use your existing endpoint
      const { data } = await axios.get(`http://localhost:3105/api/classes`);
      
      // Find the specific class
      const foundClass = data.classes.find(cls => cls._id === id);
      
      if (!foundClass) {
        throw new Error('Class not found');
      }
      
      setClassData(foundClass);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching class details:', error);
      setLoading(false);
    }
  };

  const handleBookClass = async () => {
    if (!user) {
      alert('Please log in to book a class.');
      return;
    }

    setBookingLoading(true);
    try {
      const token = await getToken();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data } = await axios.post(
        `http://localhost:3105/api/classes/${id}/book`,
        { classDate: tomorrow.toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        alert(`Successfully booked ${classData.name} class on ${tomorrow.toDateString()}`);
        fetchClassDetails();
      }
    } catch (error) {
      console.error('Error booking class:', error);
      alert(error.response?.data?.message || 'Failed to book class');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl text-red-600 mb-4">Class not found</p>
        <button
          onClick={() => navigate('/classes')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Back to Classes
        </button>
      </div>
    );
  }

  const spotsAvailable = classData.capacity - (classData.enrolled?.length || 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link to="/classes" className="text-blue-600 hover:text-blue-800">
            Classes
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-700">{classData.name}</span>
        </nav>

        {/* Hero Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="relative h-96">
            <img
              src={classData.image}
              alt={classData.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h1 className="text-5xl font-bold mb-2">{classData.name}</h1>
              <p className="text-xl text-gray-200">with {classData.instructor}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Class Overview */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">About This Class</h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {classData.description}
              </p>

              {/* Class Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Category</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {classData.category || 'Fitness'}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Capacity</p>
                  <p className="font-semibold text-gray-900">{classData.capacity} people</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Duration</p>
                  <p className="font-semibold text-gray-900">60 minutes</p>
                </div>
              </div>

              {/* Schedule */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Regular Schedule</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {classData.schedule?.days?.map((day, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium"
                    >
                      {day}
                    </span>
                  ))}
                </div>
                <p className="text-gray-600 mt-2">
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {classData.schedule?.time}
                </p>
              </div>

              {/* What to Bring */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">What to Bring</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Water bottle
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Comfortable workout clothes
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Yoga mat (for mat-based classes)
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Towel
                  </li>
                </ul>
              </div>
            </div>

            {/* Instructor Section */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Meet Your Instructor</h2>
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                  {classData.instructor?.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {classData.instructor}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Certified Fitness Instructor • 5+ years experience
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {classData.instructor} is a passionate fitness instructor dedicated to helping
                    students achieve their wellness goals through expert guidance and motivation.
                    With specialized training in {classData.category || 'fitness'}, they bring energy
                    and expertise to every class.
                  </p>
                </div>
              </div>
            </div>

            {/* Class Policies */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Class Policies</h2>
              <div className="space-y-4 text-gray-700">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold mb-1">Arrival Time</p>
                    <p className="text-sm">Please arrive 10 minutes early for check-in</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold mb-1">Cancellation</p>
                    <p className="text-sm">Cancel at least 2 hours before class start time</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold mb-1">All Levels Welcome</p>
                    <p className="text-sm">Modifications provided for different fitness levels</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-bold text-gray-900">Book Now</span>
                </div>
                
                {/* Availability */}
                <div className={`p-4 rounded-lg mb-4 ${
                  spotsAvailable > 5 
                    ? 'bg-green-50 border border-green-200' 
                    : spotsAvailable > 0
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className="text-center font-semibold">
                    {spotsAvailable > 0 
                      ? `${spotsAvailable} spots available` 
                      : 'Class is full'}
                  </p>
                </div>

                {/* Next Class Info */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Next class:</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold text-gray-900">
                      {classData.schedule?.days?.[0] || 'TBD'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {classData.schedule?.time}
                    </p>
                  </div>
                </div>

                {/* Book Button */}
                <button
                  onClick={handleBookClass}
                  disabled={spotsAvailable === 0 || bookingLoading}
                  className={`w-full py-4 rounded-lg font-semibold text-lg transition ${
                    spotsAvailable === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {bookingLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Booking...
                    </span>
                  ) : spotsAvailable === 0 ? (
                    'Class Full'
                  ) : (
                    'Book This Class'
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  Requires active membership
                </p>
              </div>

              {/* Quick Info */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Max {classData.capacity} participants
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  60 minute class
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  All levels welcome
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDetails;