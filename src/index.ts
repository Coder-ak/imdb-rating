import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import compression from "compression";
import cron from "node-cron";
import fs from "fs-extra";
import path from "path";

// Import modules
import { initializeDatabase } from "./db/db.js";
import { apiRoutes } from "./routes/api.js";
import { importRatings } from "./import.js";

// Initialize environment variables
dotenv.config();

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;
const PROJECT_ROOT = process.cwd();

app.set("trust proxy", true);

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());

// Routes
app.use("/api/v1", apiRoutes);

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(`Error: ${err.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  },
);

// Initialize the database
(async () => {
  try {
    // Ensure data directory exists
    await fs.ensureDir(path.join(PROJECT_ROOT, "data"));

    // Initialize the database
    await initializeDatabase();

    // Schedule cron job to download and import ratings at midnight UTC
    cron.schedule("0 0 * * *", async () => {
      console.log("Running scheduled import job");
      try {
        await importRatings();
        console.log("Import job completed successfully");
      } catch (error) {
        console.error(`Import job failed: ${(error as Error).message}`);
      }
    });

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error(
      `Failed to initialize application: ${(error as Error).message}`,
    );
    process.exit(1);
  }
})();

// For Vite export
export const imdbApp = app;
