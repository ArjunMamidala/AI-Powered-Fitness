import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Booking from '../models/Booking.js';
import Membership from '../models/Memberships.js';

const router = express.Router();

// Get user's complete dashboard data
router.get('/data', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        console.log("=== DASHBOARD DEBUG ===");
        console.log("1. req.user:", req.user);
        console.log("2. Looking for userId:", userId);
        console.log("3. userId type:", typeof userId, userId.constructor.name);

        // Get upcoming bookings (future classes that are booked)
        const upcomingBookings = await Booking.find({
            userId,
            status: 'booked',
            classDate: { $gte: new Date() }
        })
        .populate('classId')
        .sort({ classDate: 1 })
        .limit(10);

        // Get past bookings for activity history
        const pastBookings = await Booking.find({
            userId,
            classDate: { $lt: new Date() }
        })
        .populate('classId')
        .sort({ classDate: -1 })
        .limit(10);

        // Get active memberships
        const activeMemberships = await Membership.find({
            userId,
            status: 'active'
        });

        console.log("4. Found memberships:", activeMemberships);
        console.log("5. Membership count:", activeMemberships.length);

        // Let's also check ALL memberships for this user (any status)
        const allMemberships = await Membership.find({ userId });
        console.log("6. ALL memberships for this user:", allMemberships);

        // Check a sample membership to see the userId format
        const sampleMembership = await Membership.findOne({});
        console.log("7. Sample membership from database:", sampleMembership);

        // Calculate stats
        const totalUpcoming = await Booking.countDocuments({
            userId,
            status: 'booked',
            classDate: { $gte: new Date() }
        });

        const totalCompleted = await Booking.countDocuments({
            userId,
            status: 'completed'
        });

        const totalCancelled = await Booking.countDocuments({
            userId,
            status: 'cancelled'
        });

        const totalAttended = await Booking.countDocuments({
            userId,
            checkedIn: true
        });

        console.log("8. Sending response with memberships:", activeMemberships.length);

        res.json({
            success: true,
            data: {
                upcomingBookings,
                pastBookings,
                memberships: activeMemberships,
                stats: {
                    totalClassesBooked: totalUpcoming,
                    totalClassesAttended: totalAttended || totalCompleted,
                    totalClassesCancelled: totalCancelled,
                    activeSubscriptions: activeMemberships.length
                }
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to load dashboard data',
            error: error.message 
        });
    }
});


export default router;