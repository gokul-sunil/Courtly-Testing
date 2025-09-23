import mongoose,{Schema} from "mongoose";
import { configDotenv } from "dotenv";
configDotenv();
const userRole=process.env.USER_ROLE
const userSchema=new Schema({
firstName:{
    type:String,
    trim:true,
},
lastName:{
    type:String,
    trim:true
},
phoneNumber:{
type:Number,
 required: true,
      unique: true,
      match: /^[0-9]{10}$/,
},
whatsAppNumber:{
    type:Number,
     required: true,
      match: /^[0-9]{10}$/,
},
address:{
    type:String
},
role:{
    type:Number,
    default:userRole
}

})
userSchema.index({ phoneNumber: 1 }, { unique: true });
export const User = mongoose.model("User", userSchema);