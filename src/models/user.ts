import mongoose from "mongoose";
import validator from "validator";

interface IUser extends Document {
    _id: string;
    name: string;
    email: string;
    image: string;
    role: "admin" | "user";
    gender: "male" | "female";
    dob: Date;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: [true, "Please Enter ID"]
    },
    name: {
        type: String,
        required: [true, "Please Enter Name"]
    },
    email: {
        type: String,
        unique: [true, "Email Already Exists"],
        required: [true, "Please Enter Email"],
        validate: validator.default.isEmail
    },
    image: {
        type: String,
        required: [true, "Please Add Image"]
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user"
    },
    gender: {
        type: String,
        enum: ["male", "female"],
        required: [true, "Please Enter Gender"]
    },
    dob: {
        type: Date,
        required: [true, "Please Enter Date of Birth"]
    }
}, {
    timestamps: true
})


userSchema.virtual("age").get(function () {
    const today = new Date();
    const dob = this.dob;
    let age = today.getFullYear() - dob.getFullYear();

    if (today.getMonth() < dob.getMonth() || today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()) {
        age--;
    }

    return age;
})
export const User = mongoose.model('User', userSchema);

