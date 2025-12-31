import express from "express"
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/db.js";
import { clerkMiddleware } from '@clerk/express'
import clerkWebhooks from "./controllers/clerkWebhooks.js";
import userRoutes from "./routes/userRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import Stripe from 'stripe'
import stripeWebhook from "./routes/stripeWebhook.js";
import emailRoutes from "./routes/emailRoutes.js";
import trainerRoutes from "./routes/trainerRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import nutritionRoutes from "./routes/nutritionRoutes.js";

connectDB()

const app = express();
app.use(cors()); //Enable Cross-Origin Resource Sharing
app.use(cors({ origin: "http://localhost:5173" })); // allow frontend

//Stripe webhook
app.use('/api/webhook', stripeWebhook)

// Middleware
app.use(express.json());
app.use(clerkMiddleware());

//API to listen to Clerk Webhookds
app.post("/api/clerk/webhooks", clerkWebhooks);

app.get('/', (req, res) => {
    res.send("API is working");
})

const stripe = new Stripe(process.env.STRIPE_KEY);

app.set('stripe', stripe)

app.use('/api/user', userRoutes)

app.use('/api/subscribe', subscriptionRoutes);

app.use("/api/email", emailRoutes)

app.use("/api/trainers", trainerRoutes);

app.use('/api/classes', classRoutes)

app.use('/api/dashboard', dashboardRoutes);

app.use('/api/nutrition', nutritionRoutes);






const PORT = process.env.PORT || 3105;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));