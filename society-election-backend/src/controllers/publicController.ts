import { Request, Response, NextFunction } from "express";
import { HouseModel } from "../models/house";
import { PositionModel } from "../models/position";
import { VoteModel } from "../models/vote";
import { VoteAttemptModel } from "../models/voteAttempt";
import { recordAttempt } from "../services/ipFraud";
import config from "../config";

/**
 * Register candidate:
 * - Validate candidate
 * - Ensure same candidate id or name is not already registered for different position
 * We'll accept candidate with id unique across all positions.
 */
export async function registerCandidate(req: Request, res: Response) {
    const { candidate } = req.body;
    if (!candidate || !candidate.id || !candidate.positionId) {
        return res.status(400).json({ ok: false, message: "candidate and positionId required" });
    }

    // check across positions
    const conflict = await PositionModel.findOne({
        "candidates.id": candidate.id,
        $or: [
            { "candidates.name": candidate.name },
            { "candidates.id": candidate.id }
        ]
    });

    if (conflict && conflict.id !== candidate.positionId) {
        return res.status(400).json({ ok: false, message: "Candidate already registered for a different position" });
    }

    // upsert into position
    const position = await PositionModel.findOne({ id: candidate.positionId });
    if (!position) return res.status(400).json({ ok: false, message: "Position not found" });

    // prevent duplicate id inside position
    if (position.candidates.some((c: any) => c.id === candidate.id)) {
        return res.status(400).json({ ok: false, message: "Candidate already registered for this position" });
    }

    position.candidates.push(candidate);
    await position.save();

    res.json({ ok: true, candidate });
}

/**
 * Register house
 */
export async function registerHouse(req: Request, res: Response) {
    const { house } = req.body;
    if (!house || !house.houseNumber || !house.houseOwner || !house.id) {
        return res.status(400).json({ ok: false, message: "house.id, houseNumber, houseOwner required" });
    }

    // check duplicate
    const exists = await HouseModel.findOne({ $or: [{ houseNumber: house.houseNumber }, { id: house.id }] });
    if (exists) {
        return res.status(400).json({ ok: false, message: "House already registered" });
    }

    const created = await HouseModel.create(house);
    res.json({ ok: true, house: created });
}

/**
 * Voting endpoint
 * - Rate limited by express-rate-limit middleware (applied on route)
 * - IP fraud check (record attempts and possibly block)
 * - Validate house exists
 * - Prevent multiple votes for same position from same house
 */
export async function vote(req: Request, res: Response, next: NextFunction) {
    const { houseNumber, positionId, candidateId } = req.body;
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

    // basic validation
    if (!houseNumber || !positionId || !candidateId) {
        await VoteAttemptModel.create({ houseNumber: houseNumber || "unknown", success: false, ipAddress: String(ip) });
        await recordAttempt(String(ip), false);
        return res.status(400).json({ ok: false, message: "houseNumber, positionId and candidateId required" });
    }

    const house = await HouseModel.findOne({ houseNumber });
    if (!house) {
        await VoteAttemptModel.create({ houseNumber, success: false, ipAddress: String(ip) });
        await recordAttempt(String(ip), false);
        return res.status(400).json({ ok: false, message: "House not found" });
    }

    // check duplicate vote for same position
    const existingVote = await VoteModel.findOne({ houseNumber, positionId });
    if (existingVote) {
        await VoteAttemptModel.create({ houseNumber, success: false, ipAddress: String(ip) });
        await recordAttempt(String(ip), false);
        return res.status(400).json({ ok: false, message: "House already voted for this position" });
    }

    // ensure candidate exists in position
    const position = await PositionModel.findOne({ id: positionId });
    if (!position || !position.candidates.some((c: any) => c.id === candidateId)) {
        await VoteAttemptModel.create({ houseNumber, success: false, ipAddress: String(ip) });
        await recordAttempt(String(ip), false);
        return res.status(400).json({ ok: false, message: "Invalid candidate or position" });
    }

    // all good — record vote
    await VoteModel.create({ houseNumber, positionId, candidateId, timestamp: Date.now() });
    await VoteAttemptModel.create({ houseNumber, success: true, ipAddress: String(ip) });
    await recordAttempt(String(ip), true);

    res.json({ ok: true, message: "Vote recorded" });
}

/**
 * Get aggregated results & stats
 */
export async function getResults(req: Request, res: Response) {
    const positions = await PositionModel.find({}).lean();

    const votes = await VoteModel.find({}).lean();

    // compute counts
    const results: any = {};
    const votedHouses = new Set<string>();
    let failedAttempts = await VoteAttemptModel.countDocuments({ success: false });
    const attemptDocs = await VoteAttemptModel.find({}).lean();

    for (const pos of positions) {
        results[pos.id] = {
            id: pos.id,
            title: pos.title,
            totalVotes: 0,
            candidates: (pos.candidates || []).map((c: any) => ({
                id: c.id,
                name: c.name,
                photo: c.photo,
                votes: 0,
                percentage: 0,
                isWinner: false
            }))
        };
    }

    for (const v of votes) {
        votedHouses.add(v.houseNumber);
        if (!results[v.positionId]) continue;
        const c = results[v.positionId].candidates.find((x: any) => x.id === v.candidateId);
        if (c) {
            c.votes += 1;
            results[v.positionId].totalVotes += 1;
        }
    }

    // compute winners and percentages
    for (const k of Object.keys(results)) {
        const r = results[k];
        if (r.totalVotes > 0) {
            for (const c of r.candidates) {
                c.percentage = Math.round((c.votes / r.totalVotes) * 10000) / 100;
            }
            r.candidates.sort((a: any, b: any) => b.votes - a.votes);
            r.winner = r.candidates[0] || null;
        } else {
            r.winner = null;
        }
    }

    // multiple votes attempts: houses with multiple votes for same position attempt aren't directly recorded,
    // but we can detect by counting VoteAttemptModel entries per house vs VoteModel count
    const attemptsByHouse = await VoteAttemptModel.aggregate([
        { $match: {} },
        { $group: { _id: "$houseNumber", attempts: { $sum: 1 }, success: { $sum: { $cond: ["$success", 1, 0] } } } },
        { $project: { houseNumber: "$_id", attempts: 1, success: 1 } }
    ]);

    const multipleVoteAttempts = attemptsByHouse.filter((a: any) => a.attempts > 1 && a.success === 0);

    res.json({
        ok: true,
        stats: {
            totalVotes: votes.length,
            votedHouses: Array.from(votedHouses).length,
            failedAttempts,
            multipleVoteAttempts
        },
        results
    });
}

/**
 * Misc stats for admin
 */
export async function getStats(req: Request, res: Response) {
    const totalVotes = await VoteModel.countDocuments();
    const votedHouses = (await VoteModel.distinct("houseNumber")).length;
    const failedAttempts = await VoteAttemptModel.countDocuments({ success: false });
    res.json({ ok: true, totalVotes, votedHouses, failedAttempts });
}
