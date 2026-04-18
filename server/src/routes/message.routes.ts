import express from "express";
import { protect } from "../middlewares/auth.middleware";
import { getMessageList } from "../controllers/message.controller";

const router = express.Router();

router.get("/:userId", protect, getMessageList);

export default router;
