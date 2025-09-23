import { Gym } from "../model/gymSchema.js";
import mongoose from "mongoose";
import { GymUsers } from "../model/gymUserSchema.js";
import { Trainer } from "../model/trainerSchema.js";
import GymBilling from "../model/gymBillingSchema.js";

const getFileUrl = (req, folder, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get("host")}/uploads/${folder}/${filename}`;
};
const createGym = async (req, res) => {
  try {
    const { name, address, phoneNumber } = req.body || {};

    // Basic validations
    if (!name || !address || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Name, address, and phone number are required."
      });
    }

    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ success: false, message: "Invalid name format." });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ success: false, message: "Phone number must be 10 digits." });
    }

    if (address.length < 5) {
      return res.status(400).json({ success: false, message: "Address is too short." });
    }

    // Check if phone number already exists
    const existingGym = await Gym.findOne({ phoneNumber });
    if (existingGym) {
      return res.status(400).json({
        success: false,
        message: "A gym with this phone number already exists."
      });
    }

    // Save to database
    const newGym = await Gym.create({ name, address, phoneNumber });

    return res.status(201).json({
      success: true,
      message: "Gym created successfully!",
      data: newGym
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error."
    });
  }
};
const isValidPhone = (num) => /^[0-9]{10}$/.test(num);

const registerToGym = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      address,
      phoneNumber,
      whatsAppNumber,
      notes,
      trainerId,
      amount,
      isGst,
      gst,
      gstNumber,
      modeOfPayment,
      subscriptionMonths = 1, // default 1 month
      startDate,
      userType
    } = req.body;

    // --- Validations ---
    if (!phoneNumber || !isValidPhone(phoneNumber)) {
      return res.status(400).json({ message: "Valid phone number is required" });
    }

    if (!trainerId) return res.status(400).json({ message: "Trainer must be assigned" });
    const trainer = await Trainer.findById(trainerId).session(session);
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });
if (!["athlete", "non-athlete","personal-trainer"].includes(userType)) {
  return res.status(400).json({ message: "Invalid userType. Must be 'athlete' or 'non-athlete' or 'personal-trainer'" });
}
    if (subscriptionMonths < 1 || subscriptionMonths > 12) {
      return res.status(400).json({ message: "Subscription months must be between 1 and 12" });
    }

    if (!amount || isNaN(amount) || amount < 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const validPayments = ["card", "upi", "cash"];
    if (!modeOfPayment || !validPayments.includes(modeOfPayment)) {
      return res.status(400).json({ message: "Invalid payment mode" });
    }

    if (isGst) {
      if (!gst || isNaN(gst) || gst < 0)
        return res.status(400).json({ message: "GST must be a valid non-negative number" });

      if (!gstNumber || gstNumber.length > 20)
        return res.status(400).json({ message: "GST number is required and max 20 chars" });
    }
const dietPdf = req.files?.dietPdf?.[0]?.filename
  ? `uploads/diets/${req.files.dietPdf[0].filename}`
  : null;

const profilePicture = req.files?.profilePicture?.[0]?.filename
  ? `uploads/profiles/${req.files.profilePicture[0].filename}`
  : null;


    // --- Check if user exists ---
    let user = await GymUsers.findOne({ phoneNumber }).session(session);

    const subscriptionStart = new Date(startDate);
    const subscriptionEnd = new Date(subscriptionStart);
   subscriptionEnd.setMonth(subscriptionEnd.getMonth() + Number(subscriptionMonths));

    // --- Overlap validation ---
    if (user && user.subscription) {
      const { startDate: existingStart, endDate: existingEnd, status } = user.subscription;

      if (status === "active") {
        const existingStartDate = new Date(existingStart);
        const existingEndDate = new Date(existingEnd);

        const overlaps =
          (subscriptionStart <= existingEndDate && subscriptionEnd >= existingStartDate);

        if (overlaps) {
          await session.abortTransaction();
          session.endSession();
          return res
            .status(400)
            .json({ message: "User already has an active subscription in this period" });
        }
      }
    }

    if (!user) {
      // New user validations
      if (!name || name.length > 50) return res.status(400).json({ message: "Valid name is required" });
      if (!address || address.length > 200) return res.status(400).json({ message: "Valid address is required" });
      if (!whatsAppNumber || !isValidPhone(whatsAppNumber))
        return res.status(400).json({ message: "Valid WhatsApp number is required" });

      // Create new user
      user = await GymUsers.create(
        [
          {
            name,
            address,
            phoneNumber,
            whatsAppNumber,
            notes,
            trainer: trainer._id,
            dietPdf,
            profilePicture,  
             userType,
            subscription: {
              startDate: subscriptionStart,
              endDate: subscriptionEnd,
              months: subscriptionMonths,
              status: "active",
            },
          },
        ],
        { session }
      );
      user = user[0];

      // 🔗 Add user to trainer's users array
      trainer.users.push(user._id);
      await trainer.save({ session });

    } else {
      // Existing user: update optional fields
      user.name = name || user.name;
      user.address = address || user.address;
      user.whatsAppNumber = whatsAppNumber || user.whatsAppNumber;
      user.notes = notes || user.notes;
      user.userType = userType || user.userType;

  // Update existing user
if (dietPdf) user.dietPdf = dietPdf;
if (profilePicture) user.profilePicture = profilePicture;

      user.trainer = trainer._id;

      // Update subscription
      user.subscription = {
        startDate: subscriptionStart,
        endDate: subscriptionEnd,
        months: subscriptionMonths,
        status: "active",
      };

      await user.save({ session });

      // 🔗 Ensure user is in trainer's users array
      if (!trainer.users.includes(user._id)) {
        trainer.users.push(user._id);
        await trainer.save({ session });
      }
    }

    // --- Save billing info ---
    await GymBilling.create(
      [
        {
          userId: user._id,
          amount,
          isGst,
          gst,
          gstNumber,
          modeOfPayment,
          subscriptionMonths,
          startDate: subscriptionStart,
          endDate: subscriptionEnd,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "User registered successfully with gym subscription",
      data: user,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error in registerToGym:", err);
    res.status(500).json({ message: "Unexpected error", error: err.message });
  }
};
const getAllGymUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      trainerName,
      userType,
       order, 
    } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const query = {};

    // --- Search by name or phone number ---
    if (search) {
      if (!isNaN(search)) {
        query.phoneNumber = Number(search);
      } else {
        query.name = { $regex: search, $options: "i" };
      }
    }

    // --- Filter by subscription status ---
    if (status && ["active", "expired"].includes(status)) {
      query["subscription.status"] = status;
    }

    // --- Filter by trainerName ---
    if (trainerName) {
      const trainers = await Trainer.find({
        trainerName: { $regex: trainerName, $options: "i" },
      }).select("_id");

      if (trainers.length > 0) {
        query.trainer = { $in: trainers.map((t) => t._id) };
      } else {
        return res.status(404).json({
          success: false,
          message: "No trainers found with the given name",
        });
      }
    }

    // --- Filter by userType ---
    if (userType && ["athlete", "non-athlete","personal-trainer"].includes(userType)) {
      query.userType = userType;
    }
  let sortOption = { createdAt: -1 }; 
    if (order === "asc") {
      sortOption = { createdAt: 1 }; 
    }
    // --- Fetch users and total count in parallel ---
    const [users, total] = await Promise.all([
      GymUsers.find(query)
        .populate("trainer", "trainerName trainerEmail phoneNumber")
           .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      GymUsers.countDocuments(query),
    ]);

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: "No gym users found" });
    }

    return res.status(200).json({
      success: true,
      count: users.length,
      totalUsers: total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page, 10),
      message: "Gym users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching gym users:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};



const getGymUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await GymUsers.findById(id)
      .populate("trainer", "trainerName trainerEmail phoneNumber")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "Gym user not found" });
    }

    res.status(200).json({
      success: true,
      message: "Gym user fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error fetching gym user:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};
const updateGymUser = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    address,
    phoneNumber,
    whatsAppNumber,
    notes,
    trainerId,
    dietPdf,
    userType,
    subscription,
  } = req.body;

  try {
    const user = await GymUsers.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Gym user not found" });
    }

    // --- Update fields if provided ---
    if (name) user.name = name;
    if (address) user.address = address;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (whatsAppNumber) user.whatsAppNumber = whatsAppNumber;
    if (notes) user.notes = notes;
    if (dietPdf) user.dietPdf = dietPdf;
    if (userType && ["athlete", "non-athlete"].includes(userType)) {
      user.userType = userType;
    }

    if (trainerId) {
      const trainer = await Trainer.findById(trainerId);
      if (!trainer) {
        return res.status(404).json({ success: false, message: "Trainer not found" });
      }
      user.trainer = trainerId;
    }

    if (subscription) {
      const { startDate, endDate, months, status } = subscription;
      user.subscription = {
        startDate: startDate || user.subscription.startDate,
        endDate: endDate || user.subscription.endDate,
        months: months || user.subscription.months,
        status: status || user.subscription.status,
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Gym user updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating gym user:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};
const deleteGymUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    
    const user = await GymUsers.findById(id).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Gym user not found" });
    }

    // Delete billing info
    await GymBilling.deleteMany({ userId: user._id }).session(session);

    // Delete the user
    await GymUsers.findByIdAndDelete(user._id).session(session);

    // Remove from trainer.users array
    await Trainer.updateOne(
      { _id: user.trainer },
      { $pull: { users: user._id } }
    ).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Gym user deleted successfully",
      data: user,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting gym user:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};


const getGymPaymentHistory = async (req, res) => {
  try {
    const {
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      latest,
      userId,
      status, // active | expired
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const matchConditions = {};

    // --- Date Filter (by createdAt) ---
    if (startDate || endDate) {
      matchConditions.createdAt = {};
      if (startDate) matchConditions.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchConditions.createdAt.$lte = end;
      }
    }

    // --- User Filter ---
    if (userId) matchConditions.userId = userId;

    // --- Search Filter ---
    let userMatch = {};
    if (search) {
      userMatch = {
        $or: [
          { "user.name": { $regex: search, $options: "i" } },
          { "user.phoneNumber": { $regex: search, $options: "i" } },
        ],
      };
    }

    // --- Determine if we should fetch latest transactions ---
    const fetchLatest = latest === "true" || !!status; // auto fetch latest if status is provided

    if (fetchLatest) {
      const aggregationPipeline = [
        { $match: matchConditions },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$userId",
            latestTransaction: { $first: "$$ROOT" },
          },
        },
        {
          $lookup: {
            from: "gymusers",
            localField: "latestTransaction.userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
      ];

      if (search) aggregationPipeline.push({ $match: userMatch });

      // Get total count before pagination
      const totalDocsAgg = await GymBilling.aggregate([
        ...aggregationPipeline,
        { $count: "total" },
      ]);
      const totalDocs = totalDocsAgg[0]?.total || 0;

      aggregationPipeline.push({ $skip: skip }, { $limit: limitNum });

      let latestTransactions = await GymBilling.aggregate(aggregationPipeline);

      // Compute subscriptionStatus
      latestTransactions = latestTransactions.map((doc) => {
        const createdAt = new Date(doc.latestTransaction.createdAt);
        const expiryDate = new Date(createdAt);
        expiryDate.setMonth(
          expiryDate.getMonth() + (doc.latestTransaction.subscriptionMonths || 0)
        );
        const computedStatus = expiryDate > new Date() ? "active" : "expired";

        return {
          id: doc.latestTransaction._id,
          amount: doc.latestTransaction.amount,
          isGst: doc.latestTransaction.isGst,
          gst: doc.latestTransaction.gst,
          gstNumber: doc.latestTransaction.gstNumber,
          subscriptionMonths: doc.latestTransaction.subscriptionMonths,
          modeOfPayment: doc.latestTransaction.modeOfPayment,
          notes: doc.latestTransaction.notes,
          createdAt: doc.latestTransaction.createdAt,
          updatedAt: doc.latestTransaction.updatedAt,
          subscriptionStatus: computedStatus,
          user: {
            _id: doc.user._id,
            name: doc.user.name,
            phoneNumber: doc.user.phoneNumber,
            whatsAppNumber: doc.user.whatsAppNumber,
          },
        };
      });

      // --- Filter by status if provided ---
      if (status) {
        latestTransactions = latestTransactions.filter(
          (t) => t.subscriptionStatus === status
        );
      }

      return res.status(200).json({
        success: true,
        count: latestTransactions.length,
        total: totalDocs,
        message: "Latest transactions per user fetched successfully",
        data: latestTransactions,
        pagination: { page: pageNum, limit: limitNum },
      });
    }

    // --- Full History (if no status filter) ---
    let history = await GymBilling.find(matchConditions)
      .populate("userId", "name phoneNumber whatsAppNumber")
      .sort({ createdAt: -1 })
      .lean();

    if (search) {
      history = history.filter(
        (h) =>
          h.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
          h.userId?.phoneNumber?.toString().includes(search)
      );
    }

    const totalDocs = history.length;
    const paginatedHistory = history.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      count: paginatedHistory.length,
      total: totalDocs,
      pagination: { total: totalDocs, page: pageNum, limit: limitNum },
      message: userId
        ? "User's full payment history fetched successfully"
        : "Gym payment history fetched successfully",
      data: paginatedHistory,
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};
const getGymStatistics = async (req, res) => {
  try {
    const now = new Date();
    const lastYear = new Date(now);
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    // --- Overview: total users with subscriptions + status counts ---
    const [overview] = await GymUsers.aggregate([
      {
        $facet: {
          totalBookings: [{ $count: "count" }],
          activeSubscriptions: [
            { $match: { "subscription.status": "active" } },
            { $count: "count" },
          ],
          expiredSubscriptions: [
            { $match: { "subscription.status": "expired" } },
            { $count: "count" },
          ],
        },
      },
    ]);

    // Revenue overview (from GymBilling)
    const [revenueOverview] = await GymBilling.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    // ✅ Trainer count
    const trainerCount = await Trainer.countDocuments();

    const totalBookings = overview.totalBookings[0]?.count || 0;
    const activeSubscriptions = overview.activeSubscriptions[0]?.count || 0;
    const expiredSubscriptions = overview.expiredSubscriptions[0]?.count || 0;
    const totalRevenue = revenueOverview?.total || 0;

    // --- Monthly subscriptions (last 12 months) ---
    const monthlyBookings = await GymUsers.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthNames = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    const monthlyData = monthlyBookings.map(m => ({
      month: monthNames[m._id.month - 1],
      bookings: m.bookings,
    }));

    // --- Monthly revenue (last 12 months) ---
    const monthlyRevenue = await GymBilling.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$amount" },
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
      activeSubscriptions,
      expiredSubscriptions,
      totalRevenue,
      trainerCount, // ✅ Added trainers count
      monthlyBookings: monthlyData,
      monthlyRevenue: revenueData,
    });
  } catch (error) {
    console.error("Error fetching gym statistics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export{createGym,registerToGym,getAllGymUsers,getGymUserById,updateGymUser,deleteGymUser,getGymPaymentHistory,getGymStatistics}