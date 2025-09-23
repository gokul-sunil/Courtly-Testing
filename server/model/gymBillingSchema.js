import mongoose, { Schema } from "mongoose";

const gymBillingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "GymUsers", required: true },

    amount: { type: Number, required: true },
    isGst: { type: Boolean, default: false },
    gst: { type: Number, default: 0 },
    gstNumber: { type: String },

    subscriptionMonths: { type: Number, required: true, min: 1, max: 12 },


    modeOfPayment: {
      type: String,
      enum: ["card", "upi", "cash"],
      required: true,
    },

    notes: { type: String },
  },
  { timestamps: true }
);

// Indexes for faster queries
gymBillingSchema.index({ userId: 1, createdAt: -1 });
gymBillingSchema.index({ subscriptionMonths: 1, createdAt: -1 });

const GymBilling = mongoose.model("GymBilling", gymBillingSchema);
export default GymBilling;
