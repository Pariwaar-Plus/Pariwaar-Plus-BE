import { NextFunction, Request, Response } from "express";
import * as authService from "./auth.service";
import { AuthRequest } from "../../@types";


export const login = async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(
      req.body.email,
      req.body.password
    );

    // Set refresh token in a secure cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ accessToken, user });
  } catch (e: any) {
    res.status(401).json({ message: e.message });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    // Get token from cookies instead of body
    const oldToken = req.cookies.refreshToken;

    if (!oldToken) throw new Error("No refresh token provided");

    const { accessToken, refreshToken } = await authService.refresh(oldToken);

    // Update the cookie with the NEW rotated refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (e: any) {
    res.status(403).json({ message: e.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // 1. Get token from cookies (since that's where we store it now)
    const token = req.cookies.refreshToken;

    if (token) {
      await authService.logout(token);
    }

    // 2. Clear the cookie from the browser
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ message: "Logged out successfully" });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    // req.user was populated by your authMiddleware
    const userId = req.user.id; 
    
    const user = await authService.getMe(userId);
    res.json(user);
  } catch (e: any) {
    res.status(404).json({ message: e.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    await authService.forgotPassword(email);

    return res.json({
        message:
            "If an account exists, a password reset link has been sent."
    });
};

export const validateResetPasswordToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.body;

    await authService.validatePasswordResetToken(token);

    res.status(200).json({
      valid: true,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token,password } = req.body;

    const result = await authService.resetPassword(token,password);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const authReq = req as unknown as AuthRequest;
    const userId = authReq.user!.id;

    const result = await authService.changePassword(userId, req.body);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
