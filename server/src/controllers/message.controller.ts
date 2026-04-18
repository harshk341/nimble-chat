import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../globalTypes";
import Message from "../models/Message";

export const getMessageList = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.params.userId) {
      return res
        .status(400)
        .json({ success: false, message: "User Id required" });
    }

    const messages = await Message.find({
      $or: [
        { receiver: req.params.userId, sender: req.userId! },
        { sender: req.params.userId, receiver: req.userId! },
      ],
    }).sort({ createdAt: 1 });

    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};
