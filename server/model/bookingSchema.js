import mongoose, { Schema } from "mongoose";

const bookingSchema = new Schema({
  courtId: { type: Schema.Types.ObjectId, ref: "Court", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

  slotIds: [{ type: Schema.Types.ObjectId, ref: "Slot" }],

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },

  isMultiDay: { type: Boolean, default: false },
  notes: { type: String, maxlength: 300 },
    isGst: { type: Boolean, default: false },   
  gst: { type: Number, default: 0 },        
  gstNumber: { type: String },                
  amount: { type: Number, required: true },  
  modeOfPayment: {
    type: String,
    enum: ["card", "upi", "cash"],
    required: true,
  },

  status: {
    type: String,
    enum: ["upcoming", "active", "expired","cancelled"],
    default: "upcoming",
  }
}, { timestamps: true });

// Auto-update status when document is fetched
bookingSchema.pre("save", function (next) {
  const today = new Date();
  if (today < this.startDate) {
    this.status = "upcoming";
  } else if (today >= this.startDate && today <= this.endDate) {
    this.status = "active";
  } else {
    this.status = "expired";
  }
  next();
});

export default mongoose.model("Booking", bookingSchema);
