import User from "../models/User";
import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../globalTypes";

export const getUsersExceptMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId! } });

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};
