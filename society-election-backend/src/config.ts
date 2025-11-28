import dotenv from "dotenv";
dotenv.config();

export default {
    port: process.env.PORT || 4000,
    mongoURI: process.env.MONGO_URI || "mongodb://localhost:27017/electiondb",
    jwtSecret: process.env.JWT_SECRET || "change_this",
    adminUsername: process.env.ADMIN_USERNAME || "admin",
    adminPassword: process.env.ADMIN_PASSWORD || "admin",
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 10),
    ipFraudThreshold: Number(process.env.IP_FRAUD_THRESHOLD || 5),
    ipFraudBlockMinutes: Number(process.env.IP_FRAUD_BLOCK_MINUTES || 15)
};
