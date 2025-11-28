import { Schema, model } from "mongoose";

export const ConfigModel = model("Config", new Schema({
    societyName: { type: String },
    electionYear: { type: Schema.Types.Mixed },
    isResultsPublic: { type: Boolean, default: true },
    adminPassword: { type: String },
    timeline: { type: Schema.Types.Mixed },
    rules: { type: [Schema.Types.Mixed], default: [] }
}));
