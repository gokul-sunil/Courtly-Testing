import express from "express";
import { bookedSlots, bookSlot, cancelBooking, getAvailableSlots, renewSlot } from "../controller/slotController.js";

const slotRouter = express.Router();

slotRouter.route("/book").post(bookSlot);
slotRouter.route("/booked/:id").get(bookedSlots);//{id:courtId}
slotRouter.route("/cancel/:id").post(cancelBooking);//{id:bookingId}
slotRouter.route("/renew/:id").post(renewSlot);//{id:bookingId}
slotRouter.get("/available/:courtId", getAvailableSlots);

export default slotRouter;
