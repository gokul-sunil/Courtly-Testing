import { Router } from 'express'
import { adminLogin, registerAdmin, requestPasswordReset, resetPassword } from '../controller/adminController.js';
const adminRouter=Router();
adminRouter.route('/register').post(registerAdmin);
adminRouter.route('/login').post(adminLogin)
adminRouter.route('/sent-otp').post(requestPasswordReset)
adminRouter.route('/reset-password').post(resetPassword)


export default adminRouter