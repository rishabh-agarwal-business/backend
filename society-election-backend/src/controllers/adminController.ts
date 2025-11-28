import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import config from "../config";
import { PositionModel } from "../models/position";

/**
 * Admin login (simple username/password using env ADMIN_*)
 */
export async function adminLogin(req: Request, res: Response) {
    const { username, password } = req.body;
    if (username !== config.adminUsername || password !== config.adminPassword) {
        return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ admin: true, username }, config.jwtSecret, { expiresIn: "12h" });
    res.json({ ok: true, token });
}

/**
 * Register or upsert a Position (and its candidates)
 */
export async function registerPosition(req: Request, res: Response) {
    const payload = req.body;
    if (!payload || !payload.id || !payload.title) {
        return res.status(400).json({ ok: false, message: "id and title required" });
    }

    const existing = await PositionModel.findOne({ id: payload.id });
    if (existing) {
        existing.title = payload.title;
        existing.description = payload.description;
        existing.candidates = payload.candidates || existing.candidates;
        await existing.save();
        return res.json({ ok: true, message: "Updated" });
    }

    const pos = await PositionModel.create({
        id: payload.id,
        title: payload.title,
        description: payload.description,
        candidates: payload.candidates || []
    });

    res.json({ ok: true, position: pos });
}
