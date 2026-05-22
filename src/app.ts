import cors from "cors";
import express, { type Application, type Request, type Response } from "express";
import globalErrorHandler from "./middleware/globalErrorHandler";
import logger from "./middleware/logger";
import { authRoute } from "./modules/auth/auth.route";
import { issueRoute } from "./modules/issues/issues.route";

const app: Application = express();

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use(
  cors({
    origin: "*",
  })
);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "DevPulse API Server",
    author: "DevPulse",
  });
});

app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);

// Global Error Handling Middleware
app.use(globalErrorHandler);

export default app;