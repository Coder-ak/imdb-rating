import express from "express";
import { getRatingById } from "../controllers/ratings.controller.js";
import { rateLimiter } from "../middleware/rate-limiter.js";

const router = express.Router();

// Apply rate limiter to all API routes
router.use(rateLimiter);

// Rating routes
router.get("/rating/:id", getRatingById);

export { router as apiRoutes };
