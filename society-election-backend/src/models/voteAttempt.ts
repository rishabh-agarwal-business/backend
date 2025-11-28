import { Schema, model } from "mongoose";

export const VoteAttemptModel = model("VoteAttempt", new Schema({
    houseNumber: { type: String, required: true },
    timestamp: { type: Number, required: true, default: () => Date.now() },
    success: { type: Boolean, required: true },
    ipAddress: { type: String }
}));
