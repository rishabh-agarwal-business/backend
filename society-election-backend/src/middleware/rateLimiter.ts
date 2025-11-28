import rateLimit from "express-rate-limit";
import config from "../config";

export const voteRateLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    message: { ok: false, message: "Too many requests, please try later." }
});
