import { User } from "../model/userSchema.js";
import mongoose from "mongoose";
import Booking from "../model/bookingSchema.js";
import Slot from "../model/slotSchema.js";
import Billing from "../model/billingSchema.js";
const getAllUsers = async (req, res) => {
  try {
    const { phoneNumber, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = {};

    if (phoneNumber) {
      query.phoneNumber = { $regex: phoneNumber, $options: "i" };
    }

    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(parseInt(limit)).lean(),
      User.countDocuments(query),
    ]);

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: "No users found" });
    }

    return res.status(200).json({
      success: true,
      count: users.length,
      totalUsers: total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phoneNumber, whatsAppNumber, address } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (phoneNumber && !/^[0-9]{10}$/.test(phoneNumber)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }
    if (whatsAppNumber && !/^[0-9]{10}$/.test(whatsAppNumber)) {
      return res.status(400).json({ message: "Invalid WhatsApp number format" });
    }
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const phoneExists = await User.findOne({ phoneNumber });
      if (phoneExists) {
        return res.status(400).json({ message: "Phone number already exists" });
      }
    }
    user.firstName = firstName ?? user.firstName;
    user.lastName = lastName ?? user.lastName;
    user.phoneNumber = phoneNumber ?? user.phoneNumber;
    user.whatsAppNumber = whatsAppNumber ?? user.whatsAppNumber;
    user.address = address ?? user.address;

    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
const deleteUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const user = await User.findById(id).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found" });
    }

    // Find all bookings of this user
    const bookings = await Booking.find({ userId: id }).session(session);
    const bookingIds = bookings.map(b => b._id);
    const slotIds = bookings.flatMap(b => b.slotIds);

    // Delete all related data in parallel
    await Promise.all([
      User.deleteOne({ _id: id }).session(session),
      Booking.deleteMany({ userId: id }).session(session),
      Slot.deleteMany({ $or: [{ userId: id }, { _id: { $in: slotIds } }] }).session(session),
      Billing.deleteMany({ $or: [{ userId: id }, { bookingId: { $in: bookingIds } }] }).session(session),
    ]);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "User, bookings, slots, and all related billing deleted successfully",
      deleted: {
        bookings: bookingIds.length,
        slots: slotIds.length,
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id).lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


export{getAllUsers,updateUser,deleteUser,getUserById}