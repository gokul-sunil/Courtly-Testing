import mongoose, { Schema } from "mongoose";

const gymUsersSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 50 },
    address: { type: String, required: true, maxlength: 200 },
    phoneNumber: { type: Number, required: true, unique: true, match: /^[0-9]{10}$/ },
    whatsAppNumber: { type:Number, required: true, match: /^[0-9]{10}$/ },
    notes: { type: String, maxlength: 300 },
    trainer: { type: Schema.Types.ObjectId, ref: "Trainer", required: true },
   dietPdfs: {
      type: [String],
      validate: {
        validator: function (val) {
          return val.length <= 10; 
        },
        message: "Maximum 10 diet plans are allowed per user",
      },
      default: [],
    },
     profilePicture: { type: String }, 
    userType: { type: String, enum: ["athlete", "non-athlete","personal-trainer"], default: "non-athlete" },
    subscription: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      months: { type: Number, min: 1, max: 12, required: true },
       status: { type: String, enum: ["active", "expired"], default: "active" },
    },
  },
  { timestamps: true }
);

export const GymUsers = mongoose.model("GymUsers", gymUsersSchema);
