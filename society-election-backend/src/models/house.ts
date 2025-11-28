import { Schema, model } from "mongoose";

export const HouseModel = model("House", new Schema({
    id: { type: String, required: true, unique: true },
    houseId: { type: String, required: true, unique: true },
    houseNumber: { type: String, required: true, unique: true },
    houseOwner: { type: String, required: true }
}));
