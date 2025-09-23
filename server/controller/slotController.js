import Slot from "../model/slotSchema.js";
import Court from "../model/courtSchema.js";
import { User } from "../model/userSchema.js";
import Booking from "../model/bookingSchema.js"
import mongoose from "mongoose";
import Billing from "../model/billingSchema.js";
const formatTime = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().substring(11, 16);
};
const bookSlot = async (req, res) => {
  try {
    const {
      courtId,
      startDate,
      endDate,
      startTime,
      endTime,
      phoneNumber,
      firstName,
      lastName,
      whatsAppNumber,
      address,
      notes,
      amount,
      isGst,
      gst,
      gstNumber,
      modeOfPayment,
    } = req.body;

    // --- Validations ---
    if (!courtId) return res.status(400).json({ message: "Court ID is required" });

    if (!startDate || !endDate) return res.status(400).json({ message: "Start and end date are required" });
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end)) return res.status(400).json({ message: "Invalid start or end date" });
    if (start > end) return res.status(400).json({ message: "Start date must be before end date" });
    const maxRangeDays = 365;
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (diffDays > maxRangeDays) return res.status(400).json({ message: `Booking cannot exceed ${maxRangeDays} days` });

    if (!startTime || !endTime) return res.status(400).json({ message: "Start and end time are required" });
    const [startH, startM = 0] = startTime.split(":").map(Number);
    const [endH, endM = 0] = endTime.split(":").map(Number);
    if (isNaN(startH) || isNaN(endH)) return res.status(400).json({ message: "Invalid time format, expected HH:mm" });

    if (!phoneNumber) return res.status(400).json({ message: "Phone number is required" });
    if (!/^[0-9]{10}$/.test(phoneNumber)) return res.status(400).json({ message: "Phone number must be 10 digits" });

    if (notes && notes.length > 300) return res.status(400).json({ message: "Notes too long (max 300 chars)" });

    if (amount == null) return res.status(400).json({ message: "Amount is required" });
    if (isNaN(amount) || amount < 0) return res.status(400).json({ message: "Amount must be a positive number" });

    if (isGst) {
      if (gst == null || isNaN(gst) || gst < 0) return res.status(400).json({ message: "GST must be a valid non-negative number" });
      if (!gstNumber || gstNumber.length > 20) return res.status(400).json({ message: "GST Number is required and max 20 chars" });
    }

    if (!modeOfPayment) return res.status(400).json({ message: "Payment mode is required" });
    const validPayments = ["card", "upi", "cash"];
    if (!validPayments.includes(modeOfPayment)) {
      return res.status(400).json({ message: "Invalid payment mode, must be card, upi, or cash" });
    }

    // --- Court Exists ---
    const court = await Court.findById(courtId);
    if (!court) return res.status(404).json({ message: "Court not found" });

    // --- User Handling ---
    let user = await User.findOne({ phoneNumber });

    if (!user) {
      if (!firstName || firstName.length > 50) return res.status(400).json({ message: "First name is required (max 50 chars)" });
      if (!lastName || lastName.length > 50) return res.status(400).json({ message: "Last name is required (max 50 chars)" });
      if (!whatsAppNumber || !/^[0-9]{10}$/.test(whatsAppNumber)) return res.status(400).json({ message: "WhatsApp number must be 10 digits" });
      if (!address || address.length > 200) return res.status(400).json({ message: "Address is required (max 200 chars)" });

      user = await User.create({ firstName, lastName, phoneNumber, whatsAppNumber, address });
    } else {
      if (firstName && firstName.length > 50) return res.status(400).json({ message: "First name too long" });
      if (lastName && lastName.length > 50) return res.status(400).json({ message: "Last name too long" });
      if (whatsAppNumber && !/^[0-9]{10}$/.test(whatsAppNumber)) return res.status(400).json({ message: "WhatsApp number must be 10 digits" });
      if (address && address.length > 200) return res.status(400).json({ message: "Address too long" });

      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.whatsAppNumber = whatsAppNumber || user.whatsAppNumber;
      user.address = address || user.address;
      await user.save();
    }

    // --- Prepare slots ---
    const slotsToCreate = [];
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const slotStart = new Date(currentDate);
      slotStart.setHours(startH, startM, 0, 0);

      const slotEnd = new Date(currentDate);
      slotEnd.setHours(endH, endM, 0, 0);

      if (slotStart >= slotEnd) {
        return res.status(400).json({ message: "Start time must be before end time" });
      }

      // Check overlap
      const overlap = await Slot.findOne({
        courtId,
        isBooked: true,
        $or: [{ startTime: { $lt: slotEnd }, endTime: { $gt: slotStart } }],
      }).populate("userId");

      if (overlap) {
        return res.status(400).json({
          message: "Overlap found with existing booking",
          details: {
            date: overlap.startTime.toLocaleDateString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            time: `${overlap.startTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} - ${overlap.endTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
            bookedBy: overlap.userId ? `${overlap.userId.firstName || ""} ${overlap.userId.lastName || ""}`.trim() : "Unknown",
          },
        });
      }

      slotsToCreate.push({
        courtId,
        startDate: new Date(currentDate),
        endDate: new Date(currentDate),
        startTime: slotStart,
        endTime: slotEnd,
        isBooked: true,
        isMultiDay: start.getTime() !== end.getTime(),
        userId: user._id,
        notes,
        amount,
        isGst,
        gst,
        gstNumber,
        modeOfPayment,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // --- Create slots ---
    const createdSlots = await Slot.insertMany(slotsToCreate);

    // Booking
    const bookingStartTime = new Date(start);
    bookingStartTime.setHours(startH, startM, 0, 0);

    const bookingEndTime = new Date(end);
    bookingEndTime.setHours(endH, endM, 0, 0);

    const booking = await Booking.create({
      courtId,
      userId: user._id,
      slotIds: createdSlots.map((s) => s._id),
      startDate: start,
      endDate: end,
      startTime: bookingStartTime,
      endTime: bookingEndTime,
      isMultiDay: start.toDateString() !== end.toDateString(),
      notes,
      amount,
      isGst,
      gst,
      gstNumber,
      modeOfPayment,
    });

    // Billing
    await Billing.create({
      bookingId: booking._id,
      userId: user._id,
      courtId,
      amount,
      isGst,
      gst,
      gstNumber,
      modeOfPayment,
    });

    // --- Format response ---
    const formatTime = (date) =>
      new Date(date).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });

    const formatDate = (date) =>
      new Date(date).toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });

    const formattedBooking = {
      ...booking.toObject(),
      startDate: formatDate(booking.startDate),
      endDate: formatDate(booking.endDate),
      startTime: formatTime(booking.startTime),
      endTime: formatTime(booking.endTime),
    };

    return res.status(201).json({
      message: "Slots booked successfully",
      booking: formattedBooking,
    });
  } catch (err) {
    console.error("Error in bookSlot:", err);
    return res.status(500).json({ message: "Unexpected error", error: err.message });
  }
};
const bookedSlots = async (req, res) => {
    const { id } = req.params;
    const { date } = req.query;

    if (!id) {
      return res.status(400).json({ message: "Court ID is required" });
    }

    try {
      // Get start/end of day in IST
      const getISTDayRange = (inputDate) => {
        let target = inputDate ? new Date(inputDate) : new Date();
        const istString = target.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        const istDate = new Date(istString);

        const start = new Date(istDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(istDate);
        end.setHours(23, 59, 59, 999);

        return { start, end };
      };

      const { start, end } = getISTDayRange(date);

      // Aggregation pipeline for faster query & formatting
      const slots = await Slot.aggregate([
        { $match: { courtId: new mongoose.Types.ObjectId(id), isBooked: true, startDate: { $gte: start, $lte: end } } },
        // Lookup user
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        // Lookup court
        {
          $lookup: {
            from: "courts",
            localField: "courtId",
            foreignField: "_id",
            as: "court",
          },
        },
        { $unwind: { path: "$court", preserveNullAndEmptyArrays: true } },
        // Project only necessary fields
        {
          $project: {
            slotId: "$_id",
            courtName: "$court.courtName",
            userFirstName: "$user.firstName",
            userLastName: "$user.lastName",
            phoneNumber: "$user.phoneNumber",
            notes: 1,
            startTime: 1,
            endTime: 1,
            startDate: 1,
          },
        },
        { $sort: { startDate: 1, startTime: 1 } },
      ]);

      if (!slots.length) {
        return res.status(200).json({
          message: date
            ? `No bookings found for ${new Date(date).toLocaleDateString("en-IN", {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: "Asia/Kolkata",
              })}`
            : "No bookings found for today",
          count: 0,
          data: [],
        });
      }

      // Format date/time in JS, only once per slot
      const formatted = slots.map((slot) => {
        const startIST = new Date(slot.startTime).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        });
        const endIST = new Date(slot.endTime).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        });

        return {
          slotId: slot.slotId,
          court: slot.courtName || "Unknown Court",
          bookedBy: `${slot.userFirstName || ""} ${slot.userLastName || ""}`.trim(),
          phoneNumber: slot.phoneNumber || "",
          date: new Date(slot.startDate).toLocaleDateString("en-IN", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "Asia/Kolkata",
          }),
          time: `${startIST} - ${endIST}`,
          notes: slot.notes || "",
        };
      });

      return res.status(200).json({
        message: date ? `Bookings for ${new Date(date).toLocaleDateString("en-IN", {
          weekday: "long",
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        })}` : "Today's booked slots",
        count: formatted.length,
        data: formatted,
      });
    } catch (error) {
      console.error("Error fetching booked slots:", error);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
};
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params; // bookingId

    // Find booking with slots
    const booking = await Booking.findById(id).populate("slotIds");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (["cancelled", "expired"].includes(booking.status)) {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }

    // --- Cancellation cutoff check (e.g. 1 hour before start time) ---
    const cutoffMinutes = 60; // change as needed
    const now = new Date();
    const bookingStart = new Date(booking.startDate + " " + booking.startTime); // adjust if you store times differently

    if (bookingStart - now <= cutoffMinutes * 60 * 1000) {
      return res.status(400).json({
        message: `Cancellations are not allowed within ${cutoffMinutes} minutes of start time`,
      });
    }

    // Mark booking as cancelled
    booking.status = "cancelled";
    await booking.save();

    // Free all slots linked to this booking
    await Slot.updateMany(
      { _id: { $in: booking.slotIds } },
      { $set: { isBooked: false, userId: null, notes: null } }
    );

    res.status(200).json({
      message: "Booking cancelled successfully",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error cancelling booking",
      error: error.message,
    });
  }
};
const renewSlot = async (req, res) => {
  try {
    const {id: bookingId } = req.params;
    const {
      courtId,
      startDate,
      endDate,
      startTime,
      endTime,
      amount,
      isGst,
      gst,
      gstNumber,
      modeOfPayment,
      notes,
    } = req.body || {};

    // Validate courtId
    if (!courtId) {
      return res.status(400).json({ message: "Court ID is required" });
    }
    if (!mongoose.isValidObjectId(courtId)) {
      return res.status(400).json({ message: "Invalid Court ID format" });
    }

    const court = await Court.findById(courtId);
    if (!court) {
      return res.status(404).json({ message: `Court not found for ID: ${courtId}` });
    }
    // --- Validation ---
    if (!bookingId) return res.status(400).json({ message: "Booking ID is required" });
    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({ message: "Invalid Booking ID format" });
    }

    if (!courtId) return res.status(400).json({ message: "Court ID is required" });
    if (!mongoose.isValidObjectId(courtId)) {
      return res.status(400).json({ message: "Invalid Court ID format" });
    }

    if (!startDate || !endDate) return res.status(400).json({ message: "Start and end date are required" });
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end)) return res.status(400).json({ message: "Invalid dates" });
    if (start > end) return res.status(400).json({ message: "Start date must be before end date" });

    if (!startTime || !endTime) return res.status(400).json({ message: "Start and end time are required" });
    const [startH, startM = 0] = startTime.split(":").map(Number);
    const [endH, endM = 0] = endTime.split(":").map(Number);
    if (isNaN(startH) || isNaN(endH)) return res.status(400).json({ message: "Invalid time format, expected HH:mm" });

    if (amount == null || isNaN(amount) || amount < 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    if (isGst) {
      if (gst == null || isNaN(gst) || gst < 0) {
        return res.status(400).json({ message: "GST must be a valid non-negative number" });
      }
      if (!gstNumber || gstNumber.length > 20) {
        return res.status(400).json({ message: "GST Number is required and max 20 chars" });
      }
    }

    const validPayments = ["card", "upi", "cash"];
    if (!modeOfPayment || !validPayments.includes(modeOfPayment)) {
      return res.status(400).json({ message: "Invalid payment mode" });
    }

    // --- Fetch original booking & user ---
    const originalBooking = await Booking.findById(bookingId).populate("userId");
    if (!originalBooking) return res.status(404).json({ message: "Original booking not found" });

    const userId = originalBooking.userId._id;

    // --- Check court exists ---
    // const court = await Court.findById(courtId);
    // if (!court) return res.status(404).json({ message: "Court not found" });

    // --- Prepare slots ---
    const slotsToCreate = [];
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const slotStart = new Date(currentDate);
      slotStart.setHours(startH, startM, 0, 0);

      const slotEnd = new Date(currentDate);
      slotEnd.setHours(endH, endM, 0, 0);

      if (slotStart >= slotEnd) {
        return res.status(400).json({ message: "Start time must be before end time" });
      }

      // Check overlap
      const overlap = await Slot.findOne({
        courtId,
        isBooked: true,
        $or: [{ startTime: { $lt: slotEnd }, endTime: { $gt: slotStart } }],
      });
      if (overlap) {
        return res.status(400).json({
          message: "Overlap found with existing booking",
          date: overlap.startTime.toDateString(),
        });
      }

      slotsToCreate.push({
        courtId,
        startDate: new Date(currentDate),
        endDate: new Date(currentDate),
        startTime: slotStart,
        endTime: slotEnd,
        isBooked: true,
        userId,
        notes,
        amount,
        isGst,
        gst,
        gstNumber,
        modeOfPayment,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // --- Save slots ---
    const createdSlots = await Slot.insertMany(slotsToCreate);

    // --- Fix start/end mutation issue ---
    const bookingStartTime = new Date(start);
    bookingStartTime.setHours(startH, startM, 0, 0);

    const bookingEndTime = new Date(end);
    bookingEndTime.setHours(endH, endM, 0, 0);

    // --- Create new booking ---
    const newBooking = await Booking.create({
      courtId,
      userId,
      slotIds: createdSlots.map((s) => s._id),
      startDate: start,
      endDate: end,
      startTime: bookingStartTime,
      endTime: bookingEndTime,
      isMultiDay: start.toDateString() !== end.toDateString(),
      notes,
      amount,
      isGst,
      gst,
      gstNumber,
      modeOfPayment,
      isRenewal: true,
      parentBooking: bookingId,
    });

    // --- Create billing record ---
    await Billing.create({
      bookingId: newBooking._id,
      userId,
      courtId,
      amount,
      isGst,
      gst,
      gstNumber,
      modeOfPayment,
    });

    // --- Response ---
    const formatTime = (date) =>
      new Date(date).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });

    const formatDate = (date) =>
      new Date(date).toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });

    return res.status(201).json({
      message: "Renewal booking created successfully",
      booking: {
        ...newBooking.toObject(),
        startDate: formatDate(newBooking.startDate),
        endDate: formatDate(newBooking.endDate),
        startTime: formatTime(newBooking.startTime),
        endTime: formatTime(newBooking.endTime),
      },
    });
  } catch (err) {
    console.error("Error in renewSlot:", err);
    return res.status(500).json({ message: "Unexpected error", error: err.message });
  }
};
const getAvailableSlots = async (req, res) => {
  try {
    const { courtId } = req.params;

    const slots = await Slot.find({ courtId, isBooked: false });

    res.status(200).json({
      message: "Available slots fetched successfully",
      data: slots,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching available slots",
      error: error.message,
    });
  }
};

export { bookSlot, cancelBooking, getAvailableSlots, bookedSlots,renewSlot };
