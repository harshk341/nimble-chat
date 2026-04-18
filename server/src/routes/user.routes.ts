import express from "express";
import { protect } from "../middlewares/auth.middleware";
import { getUsersExceptMe } from "../controllers/user.controller";

const router = express.Router();

router.get("/", protect, getUsersExceptMe);

export default router;
