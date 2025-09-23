import mongoose, { Schema } from "mongoose";

const billingSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
 courtId: { type: Schema.Types.ObjectId, ref: "Court", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    amount: { type: Number, required: true },     
    isGst: { type: Boolean, default: false }, 
    gst: { type: Number, default: 0 },  
    gstNumber: { type: String }, 

    modeOfPayment: {
      type: String,
      enum: ["card", "upi", "cash"],
      required: true,
    },

   
    notes: { type: String },
  },
  { timestamps: true }
);
billingSchema.index({ courtId: 1, createdAt: -1 });
billingSchema.index({ userId: 1, createdAt: -1 });
billingSchema.index({ bookingId: 1 });
const Billing = mongoose.model("Billing", billingSchema);
export default Billing;
