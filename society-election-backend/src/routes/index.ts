import { Router } from "express";
import adminRoutes from "./admin";
import publicRoutes from "./public";

const router = Router();

router.use("/admin", adminRoutes);
router.use("/", publicRoutes);

export default router;
