import { Request, Response } from "express";
import * as authService from "./auth.service";

export const register = async (req: Request, res: Response) => {
  try {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ message: "Invalid input" });
    }
    const user = await authService.register(req.body);
    res.status(201).json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

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