import { Schema, model } from "mongoose";

export const VoteModel = model("Vote", new Schema({
    houseNumber: { type: String, required: true, index: true },
    positionId: { type: String, required: true },
    candidateId: { type: String, required: true },
    timestamp: { type: Number, required: true, default: () => Date.now() }
}));
