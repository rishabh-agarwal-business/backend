import { Router } from "express";
import { adminLogin, registerPosition } from "../controllers/adminController";
import { requireAdmin } from "../middleware/auth";

const router = Router();

router.post("/login", adminLogin);

// protected
router.post("/positions", requireAdmin, registerPosition);

export default router;
