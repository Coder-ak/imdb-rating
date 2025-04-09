import rateLimit from "express-rate-limit";
import { StatusCodes } from "http-status-codes";

// Create rate limiter: 30 requests per 10 seconds
export const rateLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 30, // 30 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: "Too many requests, please try again later.",
    status: StatusCodes.TOO_MANY_REQUESTS,
  },
});
