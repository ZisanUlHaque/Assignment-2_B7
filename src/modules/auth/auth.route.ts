import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

// POST /api/auth/signup
router.post("/signup", authController.signup);

// POST /api/auth/login
router.post("/login", authController.login);

export const authRoute = router;