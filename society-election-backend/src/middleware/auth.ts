import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";

export interface AuthRequest extends Request {
    user?: any;
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ ok: false, message: "Missing token" });
    const token = header.split(" ")[1];
    try {
        const payload = jwt.verify(token, config.jwtSecret) as any;
        if (!payload || !payload.admin) throw new Error("Invalid");
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
}
