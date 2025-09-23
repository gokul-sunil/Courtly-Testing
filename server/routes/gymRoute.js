import { Router } from "express";
import { createGym, deleteGymUser, getAllGymUsers, getGymPaymentHistory, getGymStatistics, getGymUserById, registerToGym, updateGymUser } from "../controller/gymController.js";
import  uploadFiles  from "../utils/pdfMulter.js";
import { wrapMulter } from "../utils/wrapMulter.js";

const gymRouter=Router();
gymRouter.route('/create').post(createGym);
gymRouter.route('/user').post(wrapMulter(uploadFiles),registerToGym);
gymRouter.route('/all-users').get(getAllGymUsers);
gymRouter.route('/single-user/:id').get(getGymUserById);
gymRouter.route('/edit/:id').patch(wrapMulter(uploadFiles),updateGymUser);
gymRouter.route('/delete/:id').delete(deleteGymUser);
gymRouter.route('/payment-history').get(getGymPaymentHistory);
gymRouter.route('/full-statistics').get(getGymStatistics);







export default gymRouter