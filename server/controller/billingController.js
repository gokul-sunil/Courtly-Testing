import Billing from "../model/billingSchema.js";
import Booking from "../model/bookingSchema.js"
import { User } from "../model/userSchema.js";
const getBillingsByCourt = async (req, res) => {
  try {
    const { id: courtId } = req.params;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    if (!courtId) {
      return res.status(400).json({ message: "Court ID is required" });
    }

    // --- Pagination values ---
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // --- Build booking filter (only if query is passed) ---
    let bookingMatch = {};
    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        dateFilter.$lte = endOfDay;
      }
      bookingMatch.startDate = dateFilter;
    }

    // --- Query billings ---
    const billings = await Billing.find({ courtId })
      .populate({
        path: "bookingId",
        match: bookingMatch,
        select:
          "slotIds startDate endDate startTime endTime isMultiDay status notes amount modeOfPayment",
        populate: { path: "slotIds", select: "date startTime endTime" },
      })
      .populate("userId", "firstName lastName phoneNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // --- Remove billings where bookingId got filtered out ---
    const filteredBillings = bookingMatch.startDate
      ? billings.filter((b) => b.bookingId)
      : billings;

    // --- Total count (respect date filter) ---
    const total = await Billing.countDocuments({ courtId });

    // --- Helpers ---
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

    // --- Transform ---
    const formattedBillings = filteredBillings.map((billing) => {
      const booking = billing.bookingId;
      return {
        ...billing.toObject(),
        bookingId: booking
          ? {
              ...booking.toObject(),
              startDate: formatDate(booking.startDate),
              endDate: formatDate(booking.endDate),
              startTime: formatTime(booking.startTime),
              endTime: formatTime(booking.endTime),
            }
          : null,
      };
    });

    res.status(200).json({
      message: "Payment history fetched successfully",
      count: formattedBillings.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      billings: formattedBillings,
    });
  } catch (error) {
    console.error("Error fetching court billings:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

const getFullPaymentHistory = async (req, res) => {
  try {
    const { search, startDate, endDate, courtId, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // -----------------------------
    // 1️⃣ User search filter
    // -----------------------------
    let userFilter = {};
    if (search) {
      const orConditions = [
        { firstName: new RegExp(search, "i") },
        { lastName: new RegExp(search, "i") },
      ];

      if (/^\d+$/.test(search)) {
        orConditions.push({ phoneNumber: Number(search) });
      }

      const users = await User.find({ $or: orConditions }).select("_id");
      const userIds = users.map(u => u._id);

      if (userIds.length === 0) {
        return res.json({
          message: "Payment history fetched successfully",
          count: 0,
          total: 0,
          page: pageNum,
          totalPages: 0,
          billings: [],
        });
      }

      userFilter.userId = { $in: userIds };
    }

    // -----------------------------
    // 2️⃣ Booking date filter
    // -----------------------------
    let bookingIds = [];
    if (startDate || endDate) {
      const bookingFilter = {};

      if (startDate) {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        bookingFilter.startDate = { ...bookingFilter.startDate, $gte: startOfDay };
      }

      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        bookingFilter.startDate = { ...bookingFilter.startDate, $lte: endOfDay };
      }

      const bookings = await Booking.find(bookingFilter).select("_id");
      bookingIds = bookings.map(b => b._id);

      if (bookingIds.length === 0) {
        return res.json({
          message: "Payment history fetched successfully",
          count: 0,
          total: 0,
          page: pageNum,
          totalPages: 0,
          billings: [],
        });
      }
    }

    // -----------------------------
    // 3️⃣ Court filter
    // -----------------------------
    let courtFilter = {};
    if (courtId) {
      courtFilter.courtId = courtId;
    }

    // -----------------------------
    // 4️⃣ BookingId filter (from date filter)
    // -----------------------------
    if (bookingIds.length > 0) {
      courtFilter.bookingId = { $in: bookingIds };
    }

    // -----------------------------
    // 5️⃣ Combine all filters
    // -----------------------------
    const query = { ...userFilter, ...courtFilter };

    // -----------------------------
    // 6️⃣ Fetch Billing with population
    // -----------------------------
    const billings = await Billing.find(query)
      .populate("userId", "firstName lastName phoneNumber whatsAppNumber")
      .populate("courtId", "courtName")
      .populate("bookingId", "startDate endDate startTime endTime")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Billing.countDocuments(query);

    res.json({
      message: "Payment history fetched successfully",
      count: billings.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      billings,
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ message: "Server error", error });
  }
};





export{getBillingsByCourt,getFullPaymentHistory}