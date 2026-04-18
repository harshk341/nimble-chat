import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import User from "../models/User";
import { AuthenticatedRequest } from "../globalTypes";
import { getIO } from "../services/socket";

interface RegisterUserReqBody {
  name: string;
  email: string;
  password: string;
}

export const register = async (
  req: Request<{}, {}, RegisterUserReqBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, name, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "User aleardy exists" });
    }

    const hashpassword = await bcrypt.hash(password, 10);

    await User.create({ name, email, password: hashpassword });
    const io = getIO();
    io.emit("new-user");
    return res.status(201).json({ success: true, message: "User created" });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request<{}, {}, Pick<RegisterUserReqBody, "email" | "password">>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_ExpiresIn || "7d",
    } as SignOptions);

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: "Login successfully",
      token,
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

export const profile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
