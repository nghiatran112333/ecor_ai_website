import express from "express";
import { getRecommendations } from "../controllers/recommendationController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = express.Router();

// Route to get AI recommendations for the logged in user
router.get("/", isAuthenticated, getRecommendations);

export default router;
