import { Schema, model } from "mongoose";

export const IPBlockModel = model("IPBlock", new Schema({
    ip: { type: String, required: true, unique: true },
    attempts: { type: Number, default: 0 },
    firstAttemptAt: { type: Number, default: () => Date.now() },
    blockedUntil: { type: Number } // timestamp
}));
