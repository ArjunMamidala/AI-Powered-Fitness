// routes/stripeWebhook.js
import express from "express";
import Stripe from "stripe";
import Membership from "../models/Memberships.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_KEY);

router.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful subscription payment
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Get userId and membershipName from metadata if you set it
    const { userId, membershipName, membershipPrice } = session.metadata;

    console.log("=== WEBHOOK DEBUG ===");
    console.log("1. Session metadata userId:", userId);
    console.log("2. userId type:", typeof userId);

    if (!userId || !membershipName || !membershipPrice) {
      console.log("Missing metadata in the session object.");
      return res.status(400).send("Missing metadata.");
    }

    try {
      //check if user already has active membership
      const exist = await Membership.find({
        userId: userId,
        status: "active"
      });

      console.log("6. Existing active memberships:", exist.length);


      if (exist.length > 0) {
        console.log(`User ${userId} already has an active ${membershipName} membership.`);
        
        await Membership.updateMany(
          { userId: userId, status: "active" },
          { status: "canceled" }
        )
        console.log("5. Existing memberships cancelled");
      }

      console.log("6. Creating new membership...");

      const newMembership = new Membership({
        userId,
        membershipName,
        membershipPrice,
        status: "active",
        stripeSessionId: session.id,
        stripeSubscriptionId: session.subscription, 
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
      });
      console.log("7. New membership object:", newMembership);

      await newMembership.save();

      console.log(`Saved membership for user ${userId}`);
    }
    catch (error) {
      console.error("Error saving membership: ", error);
      return res.status(500).send("Internal Server Error");
    }
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;

    try {
      await Membership.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        { status: subscription.status }
      );
      console.log(`Updated membership for subscription ${subscription.id}`);
    }
    catch (error) {
      console.error("Error updating membership: ", error);
      return res.status(500).send("Internal Server Error");
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;

    try {
      await Membership.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        { status: "canceled" }
      );
      console.log(`Canceled membership for subscription ${subscription.id}`);
    }
    catch (error) {
      console.error("Error canceling membership: ", error);
    }
  }

  res.json({ received: true });
});

export default router;
