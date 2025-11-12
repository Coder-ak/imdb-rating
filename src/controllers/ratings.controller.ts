import { Request, Response } from "express";
import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";
import { StatusCodes } from "http-status-codes";
import { getDatabase } from "../db/db.js";

dotenv.config();

const PROJECT_ROOT = process.cwd();
const DATA_DIR = path.join(PROJECT_ROOT, "db");
const HEALTH_FILE = path.join(DATA_DIR, "health.json");

interface IMDBRating {
  id: string;
  rating: number;
}

export async function getRatingById(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;

  try {
    // Validate IMDb ID format (should start with 'tt' followed by numbers)
    if (!id.match(/^tt\d+$/)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        error:
          'Invalid IMDb ID format. ID should start with "tt" followed by numbers.',
      });
      return;
    }

    const db = getDatabase();

    const rating = db
      .prepare<{}, IMDBRating>(
        `
      SELECT id, rating
      FROM imdb_ratings
      WHERE id = ?
    `,
      )
      .get(id);

    if (!rating) {
      res.status(StatusCodes.NOT_FOUND).json({
        error: `Rating not found for ID: ${id}`,
      });
      return;
    }

    res.status(StatusCodes.OK).json({
      id: rating.id,
      rating: rating.rating,
    });
  } catch (error) {
    console.error(
      `Error retrieving rating for ID ${id}: ${(error as Error).message}`,
    );
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "An error occurred while retrieving the rating",
    });
  }
}

export function getHealth(req: Request, res: Response): void {
 try {
       // Read persisted metadata
    let meta: { lastUpdated: string; recordCount: number } | null = null;
    if (fs.existsSync(HEALTH_FILE)) {
      const raw = fs.readFileSync(HEALTH_FILE, "utf-8");
      meta = JSON.parse(raw);
    }

    const health = {
      status: "ok",
      appUptime: process.uptime(), // seconds
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      ...(meta && {
        lastUpdated: meta.lastUpdated,
        lastRecordCount: meta.recordCount,
      }),
    };

    res.status(StatusCodes.OK).json(health);
  } catch (error) {
    console.error("[health] error:", (error as Error).message);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Health check failed" });
  }
}
