import Court from "../model/courtSchema.js";
import Billing from "../model/billingSchema.js";
import Booking from "../model/bookingSchema.js";

const createCourt = async (req, res) => {
    const { courtName, surface } = req.body;
    try {
        const response = await Court.create({
            courtName, surface
        })
        res.status(200).json({ message: `Court Created Successfully`, data: response })
    } catch (error) {
        res.status(500).json({ message: 'Internal server error due to', error: error.message })
    }
}

const getCourt = async (req, res) => {
    try {
        const response = await Court.find();
        res.status(200).json({ message: "Court Fetched Successfully", data: response })
    } catch (error) {
        res.status(500).json({ message: 'Internal error due to', error: error.message })
    }
}

const editCourt = async (req, res) => {
    const { id } = req.params;
    const { courtName, surface } = req.body;
    try {
        const response = await Court.findByIdAndUpdate(id, {
            courtName, surface
        }, { new: true })
        res.status(200).json({ message: `Court Edited Successfully`, data: response })
    } catch (error) {
        res.status(500).json({ message: 'Internal server error due to', error: error.message })
    }
}

const deleteCourt = async (req, res) => {
    const { id } = req.params;
    try {
        const response = await Court.findByIdAndDelete(id);
        res.status(200).json({ message: "Court Deleted Successfully", data: response })
    } catch (error) {
        res.status(500).json({ message: "Internal error due to", error: error.message })
    }
}
const getCourtStatistics = async (req, res) => {
  try {
    const now = new Date();
    const lastYear = new Date(now);
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    // --- Overview: total bookings, cancelled, total revenue ---
    const [overview] = await Booking.aggregate([
      {
        $facet: {
          totalBookings: [{ $count: "count" }],
          cancelledBookings: [{ $match: { status: "cancelled" } }, { $count: "count" }],
          totalRevenue: [
            {
              $lookup: {
                from: "billings",
                localField: "_id",
                foreignField: "bookingId",
                as: "billing",
              },
            },
            { $unwind: "$billing" },
            { $group: { _id: null, total: { $sum: "$billing.amount" } } },
          ],
        },
      },
    ]);

    const totalBookings = overview.totalBookings[0]?.count || 0;
    const cancelledBookings = overview.cancelledBookings[0]?.count || 0;
    const totalRevenue = overview.totalRevenue[0]?.total || 0;

    // --- Monthly bookings for last 12 months ---
    const monthlyBookings = await Booking.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          bookings: { $count: {} },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const monthlyData = monthlyBookings.map(m => ({
      month: monthNames[m._id.month - 1],
      bookings: m.bookings,
    }));

    // --- Monthly revenue for last 12 months ---
    const monthlyRevenue = await Booking.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      {
        $lookup: {
          from: "billings",
          localField: "_id",
          foreignField: "bookingId",
          as: "billing",
        },
      },
      { $unwind: "$billing" },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$billing.amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const revenueData = monthlyRevenue.map(r => ({
      month: monthNames[r._id.month - 1],
      revenue: r.revenue,
    }));

    res.json({
      totalBookings,
      cancelledBookings,
      totalRevenue,
      monthlyBookings: monthlyData,
      monthlyRevenue: revenueData,
    });
  } catch (error) {
    console.error("Error fetching court statistics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export {
    createCourt, getCourt, editCourt, deleteCourt,getCourtStatistics
}