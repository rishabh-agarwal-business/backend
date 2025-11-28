import { Router } from "express";
import {
    registerHouse,
    getResults,
    vote,
    registerCandidate,
    getStats
} from "../controllers/publicController";
import { voteRateLimiter } from "../middleware/rateLimiter";
import { isBlocked } from "../services/ipFraud";

const router = Router();

// Register candidate (public or protected? here public with basic checks)
router.post("/candidate", registerCandidate);

// Register house
router.post("/house", registerHouse);

// voting endpoint — rate limited
router.post("/vote", voteRateLimiter, async (req, res, next) => {
    // IP fraud block check
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
    if (await isBlocked(String(ip))) {
        return res.status(429).json({ ok: false, message: "IP blocked due to suspicious activity" });
    }
    // call controller
    return vote(req, res, next);
});

// results & stats
router.get("/results", getResults);
router.get("/stats", getStats);

export default router;
