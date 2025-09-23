import cron from "node-cron";
import Booking from "../model/bookingSchema.js";

// Run every midnight
cron.schedule("0 0 * * *", async () => {
  const now = new Date();

  try {
    // Expire old bookings
    await Booking.updateMany(
      { endDate: { $lt: now }, status: { $ne: "expired" } },
      { $set: { status: "expired" } }
    );

    // Activate ongoing bookings
    await Booking.updateMany(
      { startDate: { $lte: now }, endDate: { $gte: now } },
      { $set: { status: "active" } }
    );

    // Mark upcoming bookings
    await Booking.updateMany(
      { startDate: { $gt: now } },
      { $set: { status: "upcoming" } }
    );

    console.log("Booking statuses updated");
  } catch (err) {
    console.error("Error updating booking statuses:", err);
  }
});
