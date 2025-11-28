import { Schema, model } from "mongoose";

const CandidateSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    photo: { type: String },
    motto: { type: String },
    description: { type: String },
    positionId: { type: String, required: true }
});

export const PositionModel = model("Position", new Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    candidates: { type: [CandidateSchema], default: [] }
}));
