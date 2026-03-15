import express from "express";
import { trackBehavior } from "../controllers/behaviorController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = express.Router();

// Route to track an array of behaviors or a single behavior
router.post("/", isAuthenticated, trackBehavior);

export default router;
