import { Router } from 'express'
import { deleteReceptionist, getAllReceptionists, receptionistLogin, registerReceptionist, requestPasswordReset, resetPassword } from '../controller/receptionistController.js';
// import { deleteTrainer } from '../controller/trainerController.js';

const receptionistRouter=Router();
receptionistRouter.route('/register').post(registerReceptionist);
receptionistRouter.route('/login').post(receptionistLogin);
receptionistRouter.route('/all-receptionists').get(getAllReceptionists);
receptionistRouter.route('/delete/:id').delete(deleteReceptionist);
receptionistRouter.route('/sent-otp').post(requestPasswordReset);
receptionistRouter.route('/reset-password').post(resetPassword);




export default receptionistRouter