import express from "express";
import Membership from "../models/Memberships.js";
import { protect } from "../middleware/authMiddleware.js"; // Import protect middleware

const router = express.Router();

// Route to handle membership subscription - NOW PROTECTED
router.post("/create-checkout-session", protect, async (req, res) => {
  const { membershipName, membershipPrice, forceCreate } = req.body;
  const stripe = req.app.get('stripe');
  
  const userId = req.user._id;

  try {
    const existingMembership = await Membership.findOne({
      userId, 
      status: "active"
    });

    if (existingMembership && !forceCreate) {
      // User already has an active membership
      return res.status(200).json({ 
        hasActiveMembership: true,
        currentMembership: {
          name: existingMembership.membershipName,
          price: existingMembership.membershipPrice
        }
      });
    }

    // If forceCreate is true, cancel the old membership here
    if (existingMembership && forceCreate) {
      existingMembership.status = "cancelled";
      await existingMembership.save();
    }

    // Creating Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: membershipName,
            },
            unit_amount: parseInt(membershipPrice) * 100,
            recurring: {interval: 'month'}
          },
          quantity: 1, 
        },
      ],
      mode: 'subscription',
      metadata: {
        userId, 
        membershipName, 
        membershipPrice
      },
      success_url: 'http://localhost:5173/memberships?success=true',
      cancel_url: 'http://localhost:5173/memberships?canceled=true',
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Error creating Stripe session:", error);
    res.status(500).json({ error: "There was an error creating the checkout session." });
  }
});

export default router;