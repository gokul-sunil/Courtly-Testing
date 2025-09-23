import mongoose, { Schema } from 'mongoose'
const courtSchema = new Schema({
    courtName: {
        type: String,
        unique: true
    },
    surface: {
        type: String,
        default: "grass"
    },
    totalSlots: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }

})

const Court = mongoose.model("Court", courtSchema);
export default Court;