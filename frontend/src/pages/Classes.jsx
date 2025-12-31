import React, {useState, useEffect} from "react";
import assets from "../assets/assets";
import { Link } from "react-router-dom";
import axios from "axios";
import  { useAuth, useUser } from "@clerk/clerk-react";

export default function Classes() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instructor: "",
    schedule: {
      days: [],
      time: "",
    },
    capacity: 20,
    category: "",
    image: "",
  });

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        console.log("No user logged in");
        return;
      }
      
      try {
        const token = await getToken();
        if (!token) {
          console.log("No token available");
          return;
        } 
        const { data } = await axios.get("http://localhost:3105/api/user/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserRole(data?.user?.role);
      } catch (error) {
          if (error.response?.status === 401) {
            setUserRole('user');
          }
      }
    };

    fetchUserRole();
  }, [user, getToken]);

  // Check if user is admin based on database role
  const isAdmin = userRole === 'admin';
  
  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data } = await axios.get("http://localhost:3105/api/classes");
      setClasses(data.classes);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setLoading(false);
    }
  };

  const getNextClassDate = (scheduleDays) => {
    if (!scheduleDays || scheduleDays.length === 0) {
      return null;
    }

    const today = new Date();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayIndex = today.getDay();

    for (let i = 0; i <= 7; i++) {
      const checkDayIndex = (todayIndex + i) % 7;
      const dayName = daysOfWeek[checkDayIndex];

      if (scheduleDays.includes(dayName)) {
        const nextDate = new Date();
        nextDate.setDate(today.getDate() + i + 1);
        return nextDate;
      }
    }
    console.log("No matching day found in next 7 days");
    return null;
  }

  const handleBookClass = async (classId, className, scheduleDays) => {
    console.log("Full cls object:", classId);
    console.log("Class Name:", className);
    console.log("Schedule Days:", scheduleDays);

    if (!user) {
      alert("Please log in to book a class.");
      return;
    }
    try {
      const token = await getToken();
      const nextClassDate = getNextClassDate(scheduleDays);

       console.log("Next Class Date:", nextClassDate);

      if (!nextClassDate) {
        alert("No upcoming class dates available for this class.");
        return;
      }

      const { data } = await axios.post(
        `http://localhost:3105/api/classes/${classId}/book`,
        { classDate: nextClassDate.toISOString()}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        alert(`Successfully booked ${className} on ${nextClassDate.toDateString()}`);
        fetchClasses();
      }
    }
    catch (error) {
      console.error("Error booking class:", error);
      alert(error.response?.data?.message || "Failed to book class. Please try again.");
    }
  };
// Admin functions
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('schedule.')) {
      const scheduleField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [scheduleField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDaysChange = (day) => {
    setFormData(prev => {
      const days = prev.schedule.days.includes(day)
        ? prev.schedule.days.filter(d => d !== day)
        : [...prev.schedule.days, day];
      
      return {
        ...prev,
        schedule: {
          ...prev.schedule,
          days
        }
      };
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      instructor: '',
      schedule: { days: [], time: '' },
      capacity: 20,
      category: '',
      image: ''
    });
    setEditingClass(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = await getToken();
      
      if (editingClass) {
        const { data } = await axios.put(
          `http://localhost:3105/api/classes/${editingClass._id}/update`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (data.success) {
          alert('Class updated successfully!');
          resetForm();
          fetchClasses();
        }
      } else {
        const { data } = await axios.post(
          'http://localhost:3105/api/classes/create',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (data.success) {
          alert('Class created successfully!');
          resetForm();
          fetchClasses();
        }
      }
    } catch (error) {
      console.error('Error saving class:', error);
      alert(error.response?.data?.message || 'Error saving class');
    }
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      description: cls.description,
      instructor: cls.instructor,
      schedule: cls.schedule || { days: [], time: '' },
      capacity: cls.capacity,
      category: cls.category || '',
      image: cls.image || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (classId, className) => {
    if (!window.confirm(`Are you sure you want to delete "${className}"? This will cancel all future bookings.`)) {
      return;
    }

    try {
      const token = await getToken();
      const { data } = await axios.delete(
        `http://localhost:3105/api/classes/${classId}/delete`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (data.success) {
        alert('Class deleted successfully!');
        fetchClasses();
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      alert(error.response?.data?.message || 'Error deleting class');
    }
  };

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading classes...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <section className="max-w-6xl mx-auto px-4 py-16">
        {/* Header with Admin Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-extrabold text-gray-800 text-center md:text-left">
              Our Classes
            </h2>
            <p className="text-center md:text-left text-gray-600 mt-2">
              Join our expert-led fitness classes designed for all levels
            </p>
          </div>
          
          {/* Admin Only: Add New Class Button */}
          {isAdmin && (
            <button
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setShowForm(true);
                }
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold transition"
            >
              {showForm ? 'Cancel' : '+ Add New Class'}
            </button>
          )}
        </div>

        {/* Admin Only: Create/Edit Form */}
        {isAdmin && showForm && (
          <div className="bg-white shadow-lg rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {editingClass ? 'Edit Class' : 'Create New Class'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Class Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Yoga, Pilates, HIIT"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the class and its benefits..."
                />
              </div>

              {/* Instructor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructor *
                </label>
                <input
                  type="text"
                  name="instructor"
                  value={formData.instructor}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Sarah Johnson"
                />
              </div>

              {/* Days of the Week */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days of the Week
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {weekDays.map(day => (
                    <label key={day} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.schedule.days.includes(day)}
                        onChange={() => handleDaysChange(day)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="text"
                  name="schedule.time"
                  value={formData.schedule.time}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 6:00 PM - 7:00 PM"
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Capacity
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  min="1"
                  max="100"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., yoga, cardio, strength"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition"
                >
                  {editingClass ? 'Update Class' : 'Create Class'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Classes Grid - Visible to Everyone */}
        {classes.length === 0 ? (
          <div className="bg-white shadow rounded-xl p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No classes available yet</p>
            {isAdmin && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Create Your First Class
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {classes.map((cls, index) => (
              <div 
                key={cls._id || index} 
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
              >
                <img
                  src={cls.image}
                  alt={cls.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                    {cls.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    with {cls.instructor}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {cls.description}
                  </p>
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Schedule:</p>
                    <p className="text-sm text-gray-600">
                      {cls.schedule.days?.join(", ")}
                    </p>
                    <p className="text-sm text-gray-600">{cls.schedule.time}</p>
                  </div>
                  
                  {cls.capacity && (
                    <p className="text-sm text-gray-500 mb-4">
                      {cls.capacity - (cls.enrolled?.length || 0)} spots available
                    </p>
                  )}

                  {/* Conditional Buttons Based on User Role */}
                  {isAdmin ? (
                    // Admin sees Edit and Delete buttons
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(cls)}
                        className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cls._id, cls.name)}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    // Regular users see Book and Details buttons
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBookClass(cls._id, cls.name, cls.schedule.days)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-semibold"
                      >
                        Book Class
                      </button>
                      <Link
                        to={`/classes/${cls._id}`}
                        className="flex-1 text-center bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition font-semibold"
                      >
                        Details
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}