import express from 'express';
import Class from '../models/Class.js';
import { protect } from '../middleware/authMiddleware.js';
import Booking from '../models/Booking.js';

const router = express.Router();

const isAdmin = (req, res, next) => {
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied - Admin only' 
        });
    }
    next();
};

// Get all classes
router.get('/', async (req, res) => {
    try {
        const classes = await Class.find({});
        res.status(200).json({ success: true, classes });
    }
    catch (error) {
        console.error("Error fetching classes: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Get a single class with availability
router.get('/:id', async (req, res) => {
    try {
        const classData = await Class.findById(req.params.id);
        if (!classData) {
            return res.status(404).json({ success: false, message: "Class not found" });
        }

        const availableSpots = classData.capacity - classData.enrolledCount;

        res.json({ success: true, class: classData, availableSpots });
    }
    catch(error) {
        console.error("Error fetching class: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

//Create a class - Admin only
router.post('/create', protect, isAdmin, async (req, res) => {
    try {        
        const { name, description, instructor, schedule, capacity, category, image } = req.body;

        // Validate required fields
        if (!name || !description || !instructor) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, description, and instructor are required' 
            });
        }

        // Create new class
        const newClass = new Class({
            name,
            description,
            instructor,
            schedule: schedule || { days: [], time: '' },
            capacity: capacity || 20,
            category: category || 'general',
            image: image || '',
            enrolled: []
        });

        await newClass.save();

        res.status(201).json({ 
            success: true, 
            message: 'Class created successfully!',
            class: newClass
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error creating class',
            error: error.message 
        });
    }
});

// UPDATE a class (ADMIN ONLY)
router.put('/:id/update', protect, isAdmin, async (req, res) => {
    try {
        
        const classData = await Class.findById(req.params.id);
        if (!classData) {
            return res.status(404).json({ 
                success: false, 
                message: 'Class not found' 
            });
        }

        // Update fields
        const updates = req.body;
        Object.keys(updates).forEach(key => {
            if (key === 'schedule' && updates.schedule) {
                classData.schedule = {
                    ...classData.schedule,
                    ...updates.schedule
                };
            } else if (key !== '_id' && key !== 'enrolled') {
                classData[key] = updates[key];
            }
        });

        await classData.save();

        res.json({ 
            success: true, 
            message: 'Class updated successfully!',
            class: classData
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error updating class' 
        });
    }
});

// DELETE a class (ADMIN ONLY)
router.delete('/:id/delete', protect, isAdmin, async (req, res) => {
    try {
        
        const classData = await Class.findById(req.params.id);
        if (!classData) {
            return res.status(404).json({ 
                success: false, 
                message: 'Class not found' 
            });
        }

        // Cancel all future bookings for this class
        const cancelledBookings = await Booking.updateMany(
            { 
                classId: req.params.id, 
                status: 'booked',
                classDate: { $gte: new Date() }
            },
            { status: 'cancelled' }
        );
        
        // Delete the class
        await Class.findByIdAndDelete(req.params.id);

        res.json({ 
            success: true, 
            message: 'Class deleted successfully!' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting class' 
        });
    }
});

router.post('/:id/book', protect, async (req, res) => {
    try {
        const { classDate } = req.body;
        const classId = req.params.id;
        const userId = req.user._id;

        //Find the class
        const classData = await Class.findById(classId);
        if (!classData) {
            return res.status(404).json({ success: false, message: "Class not found" });
        }

        //Check if class is full
        if (classData.enrolledCount >= classData.capacity) {
            return res.status(400).json({ success: false, message: "Class is fully booked" });
        }

        //Check if the user already booked the class for this date
        const existingBooking = await Booking.findOne({ 
            userId, 
            classId, 
            classDate: new Date(classDate),
            status: 'booked'
        });

        if (existingBooking) {
            return res.status(400).json({ success: false, message: "You have already booked this class for the selected date" });
        }

        //Create the booking
        const booking = new Booking({
            userId,
            classId,
            classDate: new Date(classDate),
            status: 'booked'
        });

        await booking.save();

        classData.enrolledCount += 1;
        await classData.save();

        res.status(201).json({ success: true, message: "Class booked successfully", booking });
    }
    catch (error) {
        console.error("Error booking class: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
})

//Cancel a booking
router.delete('/booking/:bookingId/cancel', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        //Verify that the booking belongs to the user
        if (booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        //Update booking status
        booking.status = 'cancelled';
        await booking.save();

        //Remove the user from the class enrolled count
        const classData = await Class.findById(booking.classId);
        if (classData) {
            classData.enrolledCount = Math.max(0, (classData.enrolledCount || 0) - 1);
            await classData.save();
        }

        res.status(200).json({ success: true, message: "Booking cancelled successfully" });
    }
    catch (error) {
        console.error("Error cancelling booking: ", error);
        res.status(500).json({ success: false, message: "Server Error" })
    }
})

//Get the bookings for a user
router.get('/user/bookings', protect, async (req, res) => {
    try {
        const bookings = await Booking.find({ 
            userId: req.user._id,
            status: 'booked',
            classDate: { $gte: new Date() }
        })
        .populate('classId')
        .sort({ classDate: 1 });

        res.status(200).json({ success: true, bookings });
    }
    catch (error) {
        console.error("Error fetching user bookings: ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

export default router;