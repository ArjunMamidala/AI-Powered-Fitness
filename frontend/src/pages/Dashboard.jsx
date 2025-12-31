import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const [userInfo, setUserInfo] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isLoaded || !user) {
            return;
        }

        const fetchData = async () => {
            try {
                const token = await getToken();
                
                // Fetch user profile
                const { data: userData } = await axios.get("http://localhost:3105/api/user/me", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserInfo(userData?.user);

                // Fetch dashboard data
                const { data: dashData } = await axios.get("http://localhost:3105/api/dashboard/data", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDashboardData(dashData?.data);
                setLoading(false);
            }
            catch (error) {
                console.error("Error fetching data:", error);
                setError(error.response?.data?.message || "Failed to load data");
                setLoading(false);
            }
        };

        fetchData();
    }, [getToken, isLoaded, user]);

    const handleCancelBooking = async (bookingId, className) => {
        if (!window.confirm(`Are you sure you want to cancel "${className}"?`)) {
            return;
        }

        try {
            const token = await getToken();
            const { data } = await axios.delete(
                `http://localhost:3105/api/classes/booking/${bookingId}/cancel`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                alert('Booking cancelled successfully!');
                window.location.reload();
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert(error.response?.data?.message || 'Failed to cancel booking');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <p className="text-xl text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!userInfo || !dashboardData) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-xl text-gray-600">No data available</p>
            </div>
        );
    }

    const { upcomingBookings, pastBookings, memberships, stats } = dashboardData;

    return (
        <div className="dashboard max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-4xl font-bold text-gray-900">
                    Welcome back{userInfo.username}!
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                    Here's your fitness journey at a glance
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-4xl font-bold">{stats.totalClassesBooked}</p>
                            <p className="text-sm opacity-90 mt-1">Upcoming Classes</p>
                        </div>
                        <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-4xl font-bold">{stats.totalClassesAttended}</p>
                            <p className="text-sm opacity-90 mt-1">Classes Completed</p>
                        </div>
                        <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-4xl font-bold">{stats.activeSubscriptions}</p>
                            <p className="text-sm opacity-90 mt-1">Active Plans</p>
                        </div>
                        <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-4xl font-bold">{stats.totalClassesCancelled}</p>
                            <p className="text-sm opacity-90 mt-1">Cancelled</p>
                        </div>
                        <svg className="w-12 h-12 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Upcoming Classes & Memberships */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Upcoming Classes */}
                    <div className="bg-white shadow-lg rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Upcoming Classes</h2>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                {upcomingBookings.length} Booked
                            </span>
                        </div>
                        
                        {upcomingBookings.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingBookings.map((booking) => (
                                    <div 
                                        key={booking._id} 
                                        className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-transparent p-5 rounded-r-lg hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg text-gray-900 mb-1">
                                                    {booking.classId?.name || 'Class'}
                                                </h3>
                                                <div className="space-y-1 text-sm text-gray-600">
                                                    <p className="flex items-center">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        {new Date(booking.classDate).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                    {booking.classId?.instructor && (
                                                        <p className="flex items-center">
                                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                            Instructor: {booking.classId.instructor}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold text-center">
                                                    Confirmed
                                                </span>
                                                <button
                                                    onClick={() => handleCancelBooking(booking._id, booking.classId?.name)}
                                                    className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-semibold hover:bg-red-200 transition"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-gray-600 text-lg mb-2">No upcoming classes</p>
                                <p className="text-gray-500 text-sm mb-4">Ready to book your next workout?</p>
                                <button
                                    onClick={() => window.location.href = '/classes'}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition"
                                >
                                    Browse Classes
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Active Memberships */}
                    <div className="bg-white shadow-lg rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Memberships</h2>
                        
                        {memberships.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {memberships.map((sub) => (
                                    <div 
                                        key={sub._id} 
                                        className="border-2 border-purple-200 rounded-xl p-5 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-shadow"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="font-bold text-xl capitalize text-gray-900">
                                                {sub.membershipName || 'Membership Plan'}
                                            </h3>
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold uppercase">
                                                {sub.status}
                                            </span>
                                        </div>
                                        {sub.membershipPrice && (
                                            <p className="text-lg text-purple-600 font-semibold mb-2">
                                                ${sub.membershipPrice}/month
                                            </p>
                                        )}
                                        {sub.endDate && (
                                            <p className="text-sm text-gray-600 flex items-center">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Renews: {new Date(sub.endDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-gray-600 text-lg mb-2">No active memberships</p>
                                <p className="text-gray-500 text-sm mb-4">Choose a plan to get started!</p>
                                <button
                                    onClick={() => window.location.href = '/memberships'}
                                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold transition"
                                >
                                    View Plans
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Recent Activity */}
                <div className="lg:col-span-1">
                    <div className="bg-white shadow-lg rounded-xl p-6 sticky top-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                        
                        {pastBookings.length > 0 ? (
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                {pastBookings.map((booking) => (
                                    <div 
                                        key={booking._id} 
                                        className="pb-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 p-3 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">
                                                    {booking.classId?.name || 'Class'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(booking.classDate).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                booking.checkedIn 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : booking.status === 'cancelled'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {booking.checkedIn ? 'Attended' : booking.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-gray-600 text-sm">No activity yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;