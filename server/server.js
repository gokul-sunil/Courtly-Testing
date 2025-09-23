import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./mongoDB/mongodb.js";
import courtRoutes from "./routes/courtRoute.js"
import adminRouter from "./routes/adminRoute.js";
import receptionistRouter from "./routes/receptionistRoute.js";
import slotRouter from "./routes/slotRoute.js";
import userRouter from "./routes/userRoute.js";
import bookingRouter from "./routes/bookingRoute.js";
import "./utils/bookingStatusCronJob.js";
import "./utils/gymSubscriptionCronJob.js";
import billingRouter from "./routes/billingRoute.js";
import gymRouter from "./routes/gymRoute.js";
import trainerRouter from "./routes/trainerRoute.js"
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();
connectDB();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Middleware
app.use(express.json()); 
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cors());

// Routes
app.use("/api/v1/Court", courtRoutes)
app.use('/api/v1/admin', adminRouter)
app.use('/api/v1/receptionist', receptionistRouter)
app.use('/api/v1/slot', slotRouter)
app.use('/api/v1/trainer', trainerRouter)
app.use('/api/v1/user', userRouter)
app.use('/api/v1/bookings',bookingRouter)
app.use('/api/v1/billings',billingRouter)
app.use('/api/v1/gym',gymRouter)




// Server listen
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`✅ Server running in port ${PORT}`);
});
