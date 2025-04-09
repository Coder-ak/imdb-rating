import axios from "axios";
import fs from "fs-extra";
import path from "path";
import zlib from "node:zlib";
import readline from "readline";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const PROJECT_ROOT = process.cwd();
const DATA_DIR = path.join(PROJECT_ROOT, "db");
const UPLOAD_DIR = path.join(PROJECT_ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "imdb.db");
const RATINGS_URL = process.env.RATINGS_URL;
const LAST_MODIFIED_FILE = path.join(UPLOAD_DIR, "last-modified.txt");
const COMPRESSED_FILE_PATH = path.join(UPLOAD_DIR, "title.ratings.tsv.gz");
const EXTRACTED_FILE_PATH = path.join(UPLOAD_DIR, "title.ratings.tsv");

export async function importRatings(): Promise<void> {
  try {
    // Ensure data directory exists
    await fs.ensureDir(DATA_DIR);
    await fs.ensureDir(UPLOAD_DIR);

    if (!RATINGS_URL) throw new Error("Missing URL for download");

    const shouldFetch = await shouldDownload(RATINGS_URL, LAST_MODIFIED_FILE);
    if (!shouldFetch) {
      console.log("No update detected. Skipping import.");
      return;
    }

    // Download the file
    console.log("Downloading IMDB ratings file...");
    await downloadFile(RATINGS_URL, COMPRESSED_FILE_PATH);
    console.log("Download completed");

    // Extract the file
    console.log("Extracting compressed file...");
    await extractGzFile(COMPRESSED_FILE_PATH, EXTRACTED_FILE_PATH);
    console.log("Extraction completed");

    // Process and import the data
    console.log("Importing ratings to database...");
    await importRatingsToDatabase(EXTRACTED_FILE_PATH);
    console.log("Import completed");

    // Clean up files
    await fs.remove(COMPRESSED_FILE_PATH);
    await fs.remove(EXTRACTED_FILE_PATH);
    console.log("Temporary files cleaned up");

    return;
  } catch (error) {
    console.error(`Import failed: ${(error as Error).message}`);
    throw error;
  }
}

async function shouldDownload(
  url: string,
  metaFilePath: string,
): Promise<boolean> {
  const head = await axios.head(url);
  const lastModified = head.headers["last-modified"];

  if (!lastModified) {
    throw new Error("Missing Last-Modified header in response");
  }

  let previousModified = "";
  try {
    previousModified = await fs.readFile(metaFilePath, "utf-8");
  } catch {}

  if (previousModified.trim() === lastModified.trim()) {
    return false;
  }

  await fs.writeFile(metaFilePath, lastModified);
  return true;
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await axios({
    method: "GET",
    url,
    responseType: "stream",
  });

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(outputPath);

    response.data.pipe(writer);

    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function extractGzFile(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const gunzip = zlib.createGunzip();
    const inputStream = fs.createReadStream(inputPath);
    const outputStream = fs.createWriteStream(outputPath);

    inputStream
      .pipe(gunzip)
      .pipe(outputStream)
      .on("finish", resolve)
      .on("error", reject);
  });
}

async function importRatingsToDatabase(filePath: string): Promise<void> {
  const db = new Database(DB_PATH);

  // Begin transaction for better performance
  db.exec("BEGIN TRANSACTION");

  try {
    // Create table if not exists with simplified structure
    db.exec(`
      CREATE TABLE IF NOT EXISTS imdb_ratings (
        id TEXT PRIMARY KEY,
        rating REAL NOT NULL
      )
    `);

    // Prepare statement for inserting or updating ratings
    const stmt = db.prepare(`
      INSERT INTO imdb_ratings (id, rating)
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET
        rating = excluded.rating
    `);

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let isFirstLine = true;
    let count = 0;

    // Process the file line by line
    for await (const line of rl) {
      // Skip header line
      if (isFirstLine) {
        isFirstLine = false;
        continue;
      }

      const [tconst, averageRating] = line.split("\t");

      if (tconst && averageRating) {
        stmt.run(tconst, parseFloat(averageRating));
        count++;

        if (count % 10000 === 0) {
          console.log(`Processed ${count} ratings`);
        }
      }
    }

    // Commit transaction
    db.exec("COMMIT");
    console.log(`Total ratings imported: ${count}`);
  } catch (error) {
    // Rollback transaction on error
    db.exec("ROLLBACK");
    throw error;
  } finally {
    db.close();
  }
}

// Allow running directly from command line
if (path.basename(import.meta.filename) === "import.ts") {
  importRatings()
    .then(() => {
      console.log("Import completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error(`Import failed: ${error.message}`);
      process.exit(1);
    });
}
