import { Router } from "express";
import { getBillingsByCourt, getFullPaymentHistory } from "../controller/billingController.js";
const billingRouter=Router();
billingRouter.route('/court-payment-history/:id').get(getBillingsByCourt)//{id:courtId}
billingRouter.route('/payment-history').get(getFullPaymentHistory)
export default billingRouter