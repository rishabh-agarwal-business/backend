import { IPBlockModel } from "../models/ipBlock";
import config from "../config";

/**
 * Tracks attempts by ip, blocks if threshold exceeded
 */
export async function recordAttempt(ip: string, success: boolean) {
    const now = Date.now();
    const rec = await IPBlockModel.findOne({ ip });
    if (!rec) {
        await IPBlockModel.create({
            ip,
            attempts: success ? 0 : 1,
            firstAttemptAt: now,
            blockedUntil: undefined
        });
        return { blocked: false };
    }

    // If currently blocked
    if (rec.blockedUntil && rec.blockedUntil > now) {
        return { blocked: true, blockedUntil: rec.blockedUntil };
    }

    // Reset window if firstAttemptAt too old (use same window as rate limit)
    if (now - rec.firstAttemptAt > config.rateLimitWindowMs) {
        rec.attempts = success ? 0 : 1;
        rec.firstAttemptAt = now;
        rec.blockedUntil = undefined;
        await rec.save();
        return { blocked: false };
    }

    // increment attempts
    if (!success) rec.attempts += 1;
    else rec.attempts = 0;

    if (!success && rec.attempts >= config.ipFraudThreshold) {
        rec.blockedUntil = now + config.ipFraudBlockMinutes * 60_000;
    }

    await rec.save();
    return { blocked: !!rec.blockedUntil, blockedUntil: rec.blockedUntil };
}

export async function isBlocked(ip: string) {
    const rec = await IPBlockModel.findOne({ ip });
    const now = Date.now();
    return !!(rec && rec.blockedUntil && rec.blockedUntil > now);
}
