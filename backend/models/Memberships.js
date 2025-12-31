import mongoose from "mongoose";

const membershipSchema = mongoose.Schema({
  userId: { type: String, required: true },
  membershipName: { type: String, required: true },
  membershipPrice: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["active", "inactive", "cancelled"], 
    default: "active" 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  stripeSessionId: { type: String },
  stripeSubscriptionId: { type: String }
}, { timestamps: true });

membershipSchema.index(
  { userId: 1, status: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { status: 'active' }
  }
);

const Membership = mongoose.model("Membership", membershipSchema);

export default Membership;