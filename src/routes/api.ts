import express from "express";
import { getHealth, getRatingById } from "../controllers/ratings.controller.js";
import { rateLimiter } from "../middleware/rate-limiter.js";
import dotenv from "dotenv";

const router = express.Router();

dotenv.config();

const PROJECT_ROOT = process.cwd();
const DATA_DIR = path.join(PROJECT_ROOT, "db");
const HEALTH_FILE = path.join(DATA_DIR, "health.json");

// Apply rate limiter to all API routes
router.use(rateLimiter);

// Rating routes
router.get("/rating/:id", getRatingById);

router.get("/health", getHealth);

export { router as apiRoutes };
