import { Router } from "express";
import{assignDietPlan, deleteDietPlan, deleteTrainer, getAllTrainers, getUsersByTrainer, registerTrainer,requestPasswordReset,resetPassword,trainerLogin}from "../controller/trainerController.js"
import  uploadDiet  from "../utils/pdfMulter.js";
const trainerRouter=Router();
trainerRouter.route('/register').post(registerTrainer);
trainerRouter.route('/login').post(trainerLogin);
trainerRouter.route('/all-trainers').get(getAllTrainers);
trainerRouter.route('/delete/:id').delete(deleteTrainer);//{id:trainer id}
trainerRouter.route('/assigned-users/:id').get(getUsersByTrainer)//{id:trainerId}
trainerRouter.route('/assign-diet-plan').post(uploadDiet,assignDietPlan);//{id:trainer id}
trainerRouter.route('/delete-diet-plan').delete(deleteDietPlan);//{id:trainer id}

trainerRouter.route('/sent-otp').post(requestPasswordReset);
trainerRouter.route('/reset-password').post(resetPassword);






export default trainerRouter