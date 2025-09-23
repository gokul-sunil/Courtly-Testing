import { Router } from 'express'
import { getFullBookingHistory, getLatestBookings } from '../controller/bookingController.js';

const bookingRouter=Router();
bookingRouter.route('/latest-booking').get(getLatestBookings);
bookingRouter.route('/full-booking').get(getFullBookingHistory);

export default bookingRouter